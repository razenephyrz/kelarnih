import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationDocuments,
  applicationEvents,
  approvalSteps,
  applications,
  notifications,
  serviceRequirements,
  serviceTypes,
  users,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { audit, logEvent, notify } from "@/lib/server";
import { genApplicationNumber } from "@/lib/workflow";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const mine = searchParams.get("mine") ?? "";

  let rows = await db
    .select({
      app: applications,
      svc: serviceTypes,
      owner: { id: users.id, name: users.name, email: users.email },
    })
    .from(applications)
    .leftJoin(serviceTypes, eq(applications.serviceTypeId, serviceTypes.id))
    .leftJoin(users, eq(applications.userId, users.id))
    .orderBy(desc(applications.createdAt))
    .limit(200);

  // role filtering
  if (user.role === "WARGA") {
    rows = rows.filter((r) => r.app.userId === user.id);
  } else if (user.role === "RT_RW") {
    // RT/RW sees apps needing their approval + history they acted on
    if (!mine) {
      // default: all that passed verification (relevant), but prioritize MENUNGGU_RT_RW
      // keep all for transparency except drafts — no drafts exist
    }
  } else if (user.role === "CAMAT") {
    rows = rows.filter((r) => r.svc?.requiresCamat);
  }
  // LURAH & PETUGAS see all

  if (q) {
    const ql = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.app.applicationNumber.toLowerCase().includes(ql) ||
        (r.svc?.name ?? "").toLowerCase().includes(ql) ||
        (r.owner?.name ?? "").toLowerCase().includes(ql)
    );
  }
  if (status) rows = rows.filter((r) => r.app.status === status);

  const out = rows.map((r) => ({
    ...r.app,
    serviceName: r.svc?.name ?? "-",
    serviceSlug: r.svc?.slug ?? "",
    requiresCamat: !!r.svc?.requiresCamat,
    baseSlaDays: r.svc?.baseSlaDays ?? 3,
    ownerName: r.owner?.name ?? "-",
    ownerEmail: r.owner?.email ?? "-",
  }));
  return NextResponse.json({ applications: out });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "WARGA")
    return NextResponse.json({ error: "Hanya warga yang dapat membuat pengajuan." }, { status: 403 });
  try {
    const body = await req.json();
    const { serviceSlug, formData = {}, citizenNote, documents = [], isPriority, priorityReason, priorityDetail, priorityEvidencePath } = body;
    if (!serviceSlug) return NextResponse.json({ error: "Jenis layanan wajib dipilih." }, { status: 400 });
    const svcRows = await db.select().from(serviceTypes).where(eq(serviceTypes.slug, serviceSlug)).limit(1);
    const svc = svcRows[0];
    if (!svc) return NextResponse.json({ error: "Layanan tidak ditemukan." }, { status: 404 });

    const reqs = await db.select().from(serviceRequirements).where(eq(serviceRequirements.serviceTypeId, svc.id));
    // validate required docs
    const docKeys = new Set((documents as any[]).map((d) => d.requirementKey));
    const missing: string[] = [];
    for (const r of reqs) {
      let need = r.requirementType === "WAJIB";
      if (r.requirementType === "KONDISIONAL" && r.conditionField) {
        const val = (formData as any)[r.conditionField];
        const condVals = (r.conditionValues as string[]) ?? [];
        if (condVals.includes(String(val))) need = true;
      }
      if (need && !docKeys.has(r.key)) missing.push(r.name);
    }
    if (missing.length)
      return NextResponse.json({ error: `Dokumen wajib belum lengkap: ${missing.join(", ")}` }, { status: 400 });

    if (isPriority) {
      if (!svc.priorityEnabled)
        return NextResponse.json({ error: "Layanan ini tidak dapat diajukan prioritas." }, { status: 400 });
      if (!priorityReason) return NextResponse.json({ error: "Alasan prioritas wajib dipilih." }, { status: 400 });
      const needEvidence = ["dika", "medis", "sekolah_kerja"].includes(priorityReason);
      if (needEvidence && !priorityEvidencePath)
        return NextResponse.json({ error: "Alasan ini mewajibkan bukti pendukung." }, { status: 400 });
    }

    if (!documents.length) return NextResponse.json({ error: "Minimal satu dokumen persyaratan wajib diunggah." }, { status: 400 });

    // prevent double submit: same user + same service within 1 minute with same note?
    const no = genApplicationNumber();
    const [app] = await db
      .insert(applications)
      .values({
        applicationNumber: no,
        userId: user.id,
        serviceTypeId: svc.id,
        status: "MENUNGGU_VERIFIKASI",
        formData,
        citizenNote: citizenNote ?? null,
        isPriority: !!isPriority,
        priorityReason: isPriority ? priorityReason : null,
        priorityReasonDetail: isPriority ? priorityDetail ?? null : null,
        priorityEvidencePath: isPriority ? priorityEvidencePath ?? null : null,
        priorityStatus: isPriority ? "PENDING" : "NONE",
        staffHandlerId: null,
      })
      .returning();

    for (const d of documents as any[]) {
      if (!d.path || !d.requirementKey) continue;
      await db.insert(applicationDocuments).values({
        applicationId: app.id,
        requirementKey: d.requirementKey,
        requirementName: reqs.find((r) => r.key === d.requirementKey)?.name ?? d.requirementKey,
        fileName: d.fileName ?? "dokumen",
        fileType: d.fileType ?? "application/pdf",
        fileSize: d.fileSize ?? 0,
        filePath: d.path,
        status: "MENUNGGU",
      });
    }
    // approval steps skeleton
    const stages = ["RT_RW", "LURAH"];
    if (svc.requiresCamat) stages.push("CAMAT");
    for (const st of stages) {
      await db.insert(approvalSteps).values({ applicationId: app.id, stage: st, status: "MENUNGGU" });
    }
    await logEvent({
      applicationId: app.id, actorId: user.id, actorName: user.name, actorRole: "WARGA",
      previousStatus: null, newStatus: "MENUNGGU_VERIFIKASI",
      title: "Pengajuan dikirim", description: `Pengajuan ${no} untuk ${svc.name} dikirim. Menunggu verifikasi petugas.`,
    });
    await notify({
      userId: user.id, applicationId: app.id, type: "PENGAJUAN",
      title: "Pengajuan berhasil dikirim",
      message: `Pengajuan ${no} (${svc.name}) diterima dan menunggu verifikasi. SLA mulai dihitung setelah dokumen terverifikasi.`,
      link: `/pengajuan/${app.id}`,
    });
    // notify all petugas
    const staff = await db.select().from(users).where(eq(users.role, "PETUGAS"));
    for (const s of staff) {
      await notify({
        userId: s.id, applicationId: app.id, type: "PENGAJUAN_MASUK",
        title: "Pengajuan baru masuk",
        message: `${user.name} mengajukan ${svc.name} (${no}). Segera verifikasi berkas.`,
        link: `/pengajuan/${app.id}`,
      });
    }
    await audit({ actorId: user.id, action: "CREATE_APPLICATION", entity: "applications", entityId: app.id, details: { no, service: svc.slug } });
    return NextResponse.json({ application: app });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membuat pengajuan." }, { status: 500 });
  }
}
