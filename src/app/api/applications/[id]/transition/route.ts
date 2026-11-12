import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { applications, approvalSteps, serviceTypes, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { audit, logEvent, notify } from "@/lib/server";
import { canTransition, roleCanTransition } from "@/lib/workflow";
import { computeDueDate } from "@/lib/sla";

function letterHtml(app: any, svcName: string, ownerName: string) {
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Surat ${svcName} - ${app.applicationNumber}</title>
<style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:40px;border:1px solid #ccc;color:#222}
.wm{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-24deg);font-size:64px;font-weight:900;color:rgba(180,40,40,.14);border:4px solid rgba(180,40,40,.14);padding:10px 28px;letter-spacing:2px}
.kop{text-align:center;border-bottom:3px double #333;padding-bottom:12px;margin-bottom:20px}.kop h2{margin:0}.kop p{margin:2px 0;font-size:13px}</style></head><body>
<div class="wm">SIMULASI</div>
<div class="kop"><h2>PEMERINTAH KOTA CONTOH — KECAMATAN CONTOH</h2><h3>KELURAHAN CONTOH (SIMULASI)</h3><p>Jl. Contoh No. 1, Telp. (021) 000000 — Data simulasi, bukan dokumen resmi</p></div>
<p style="text-align:center"><b><u>${svcName.toUpperCase()}</u></b><br>Nomor: ${app.letterNumber ?? "-"}</p>
<p>Yang bertanda tangan di bawah ini, Lurah Contoh (simulasi), menerangkan bahwa:</p>
<table><tr><td>Nama</td><td>: <b>${ownerName}</b></td></tr><tr><td>No. Pengajuan</td><td>: ${app.applicationNumber}</td></tr><tr><td>Keperluan</td><td>: ${svcName}</td></tr></table>
<p>Nama tersebut di atas adalah warga Kelurahan Contoh berdasarkan data administrasi yang terverifikasi pada sistem kelar.in (simulasi).</p>
<p>Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya. <b>Dokumen ini adalah SIMULASI / BUKAN DOKUMEN RESMI dan tidak memiliki kekuatan hukum.</b> Tidak terdapat tanda tangan elektronik resmi.</p>
<br><br><div style="text-align:right">Contoh, ${new Date().toLocaleDateString("id-ID")}<br><br><br><br><b>( Lurah Contoh — simulasi )</b></div>
<p style="margin-top:30px;font-size:12px;color:#666">Dicetak dari kelar.in • ID ${app.id} • ${new Date().toISOString()}</p>
</body></html>`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, note, delayReason, newDueAt } = body as { action: string; note?: string; delayReason?: string; newDueAt?: string };

  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  const app = rows[0];
  if (!app) return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  const svc = (await db.select().from(serviceTypes).where(eq(serviceTypes.id, app.serviceTypeId)).limit(1))[0];

  // ownership check for WARGA resubmit
  if (user.role === "WARGA" && app.userId !== user.id)
    return NextResponse.json({ error: "Bukan pengajuan milik Anda." }, { status: 403 });

  try {
    // ---- EXTEND ESTIMATION (no status change) ----
    if (action === "extend") {
      if (!["PETUGAS", "LURAH"].includes(user.role))
        return NextResponse.json({ error: "Tidak berwenang mengubah estimasi." }, { status: 403 });
      if (!delayReason) return NextResponse.json({ error: "Alasan keterlambatan wajib diisi." }, { status: 400 });
      const due = newDueAt ? new Date(newDueAt) : app.dueAt ? new Date(app.dueAt) : new Date();
      if (newDueAt) {
        const nd = new Date(newDueAt);
        nd.setDate(nd.getDate() + 2);
      }
      await db.update(applications).set({ delayReason, dueAt: newDueAt ? new Date(newDueAt) : app.dueAt, updatedAt: new Date() }).where(eq(applications.id, id));
      await logEvent({ applicationId: id, actorId: user.id, actorName: user.name, actorRole: user.role, previousStatus: app.status, newStatus: app.status, title: "Estimasi diperbarui", description: delayReason });
      await notify({ userId: app.userId, applicationId: id, type: "ESTIMASI", title: "Estimasi pelayanan diperbarui", message: `${delayReason} Estimasi baru dapat dilihat pada tracking.`, link: `/pengajuan/${id}` });
      await audit({ actorId: user.id, action: "EXTEND_SLA", entity: "applications", entityId: id, details: { delayReason, newDueAt } });
      return NextResponse.json({ ok: true });
    }

    let target: string | null = null;
    let title = "";
    let desc = note ?? "";

    if (action === "verify") {
      if (user.role !== "PETUGAS") return NextResponse.json({ error: "Hanya petugas yang dapat memverifikasi." }, { status: 403 });
      target = "TERVERIFIKASI"; title = "Dokumen terverifikasi";
      desc = note || "Seluruh persyaratan dinyatakan lengkap. SLA mulai berjalan.";
    } else if (action === "return") {
      if (!note) return NextResponse.json({ error: "Alasan pengembalian wajib diisi." }, { status: 400 });
      target = "MENUNGGU_WARGA"; title = "Dokumen dikembalikan";
    } else if (action === "resubmit") {
      if (user.role !== "WARGA") return NextResponse.json({ error: "Hanya warga yang dapat mengirim ulang." }, { status: 403 });
      target = "MENUNGGU_VERIFIKASI"; title = "Perbaikan dikirim ulang";
      desc = note || "Warga mengirimkan perbaikan dokumen.";
    } else if (action === "process") {
      if (user.role !== "PETUGAS") return NextResponse.json({ error: "Hanya petugas." }, { status: 403 });
      target = app.status === "TERVERIFIKASI" ? "SEDANG_DIPROSES" : "MENUNGGU_RT_RW";
      title = target === "SEDANG_DIPROSES" ? "Surat sedang diproses" : "Dikirim ke RT/RW";
      desc = note || (target === "SEDANG_DIPROSES" ? "Petugas menyusun draf surat." : "Berkas diteruskan untuk persetujuan lingkungan.");
    } else if (action === "approve_rt") {
      if (user.role !== "RT_RW") return NextResponse.json({ error: "Hanya RT/RW." }, { status: 403 });
      target = "MENUNGGU_LURAH"; title = "Disetujui RT/RW";
      desc = note || "Lingkungan menyetujui permohonan.";
    } else if (action === "approve_lurah") {
      if (user.role !== "LURAH") return NextResponse.json({ error: "Hanya Lurah." }, { status: 403 });
      target = svc?.requiresCamat ? "MENUNGGU_CAMAT" : "FINALISASI";
      title = svc?.requiresCamat ? "Disetujui Lurah, diteruskan ke Camat" : "Disetujui Lurah";
      desc = note || "Persetujuan akhir lurah diberikan.";
    } else if (action === "approve_camat") {
      if (user.role !== "CAMAT") return NextResponse.json({ error: "Hanya Camat." }, { status: 403 });
      target = "FINALISASI"; title = "Disetujui Camat";
      desc = note || "Camat menyetujui pengajuan ahli waris.";
    } else if (action === "finalize") {
      if (user.role !== "PETUGAS") return NextResponse.json({ error: "Hanya petugas yang dapat finalisasi." }, { status: 403 });
      target = "SELESAI"; title = "Surat diterbitkan";
      desc = note || "Surat final diterbitkan (SIMULASI).";
    } else if (action === "reject") {
      if (!note) return NextResponse.json({ error: "Alasan penolakan wajib diisi." }, { status: 400 });
      target = "DITOLAK"; title = "Pengajuan ditolak";
    } else {
      return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
    }

    if (!target) return NextResponse.json({ error: "Transisi tidak valid." }, { status: 400 });
    if (!canTransition(app.status, target))
      return NextResponse.json({ error: `Transisi ${app.status} → ${target} tidak diizinkan.` }, { status: 400 });
    if (!roleCanTransition(user.role, target) && !(user.role === "WARGA" && target === "MENUNGGU_VERIFIKASI"))
      return NextResponse.json({ error: `Role ${user.role} tidak berwenang ke status ${target}.` }, { status: 403 });

    const patch: any = { status: target, updatedAt: new Date(), currentNote: desc ?? null, staffHandlerId: user.role === "PETUGAS" ? user.id : app.staffHandlerId ?? null };

    // SLA logic
    const now = new Date();
    if (target === "TERVERIFIKASI") {
      const slaDays = app.isPriority && app.priorityStatus === "APPROVED" ? svc?.prioritySlaDays ?? 1 : svc?.baseSlaDays ?? 3;
      if (!app.verifiedAt) {
        patch.verifiedAt = now;
        patch.slaStartedAt = now;
        patch.dueAt = computeDueDate(now, slaDays, !!(app.isPriority && app.priorityStatus === "APPROVED"));
      } else if (app.pausedAt) {
        // resume: extend due by pause duration
        const pauseSec = Math.floor((now.getTime() - new Date(app.pausedAt).getTime()) / 1000);
        const acc = (app.accumulatedPauseSeconds ?? 0) + pauseSec;
        patch.accumulatedPauseSeconds = acc;
        patch.pausedAt = null;
        if (app.dueAt) {
          const due = new Date(app.dueAt);
          due.setSeconds(due.getSeconds() + pauseSec);
          patch.dueAt = due;
        }
        patch.verifiedAt = app.verifiedAt;
      }
    }
    if (target === "MENUNGGU_WARGA") {
      // pause SLA if started
      if (app.slaStartedAt && !app.completedAt && !app.pausedAt) patch.pausedAt = now;
    }
    if (target === "SELESAI") {
      patch.completedAt = now;
      patch.pausedAt = null;
      const letterNo = `470/${app.applicationNumber.split("-").pop()}/KL-Contoh/2026`;
      patch.letterNumber = letterNo;
      // generate letter html
      const owner = (await db.select().from(users).where(eq(users.id, app.userId)).limit(1))[0];
      const html = letterHtml({ ...app, letterNumber: letterNo }, svc?.name ?? "Surat Keterangan", owner?.name ?? "-");
      const dir = path.join(process.cwd(), "public", "uploads", "letters");
      await mkdir(dir, { recursive: true });
      const rel = `/uploads/letters/${app.applicationNumber}.html`;
      await writeFile(path.join(process.cwd(), "public", rel), html, "utf-8");
      patch.letterPath = rel;
    }

    await db.update(applications).set(patch).where(eq(applications.id, id));

    // approval steps update
    if (target === "MENUNGGU_LURAH" && app.status === "MENUNGGU_RT_RW") {
      const steps = await db.select().from(approvalSteps).where(eq(approvalSteps.applicationId, id));
      const s = steps.find((x) => x.stage === "RT_RW");
      if (s) await db.update(approvalSteps).set({ status: "DISETUJUI", actorId: user.id, note: desc, actedAt: now }).where(eq(approvalSteps.id, s.id));
    }
    if ((target === "FINALISASI" || target === "MENUNGGU_CAMAT") && app.status === "MENUNGGU_LURAH") {
      const steps = await db.select().from(approvalSteps).where(eq(approvalSteps.applicationId, id));
      const s = steps.find((x) => x.stage === "LURAH");
      if (s) await db.update(approvalSteps).set({ status: "DISETUJUI", actorId: user.id, note: desc, actedAt: now }).where(eq(approvalSteps.id, s.id));
    }
    if (target === "FINALISASI" && app.status === "MENUNGGU_CAMAT") {
      const steps = await db.select().from(approvalSteps).where(eq(approvalSteps.applicationId, id));
      const s = steps.find((x) => x.stage === "CAMAT");
      if (s) await db.update(approvalSteps).set({ status: "DISETUJUI", actorId: user.id, note: desc, actedAt: now }).where(eq(approvalSteps.id, s.id));
    }
    if (target === "MENUNGGU_WARGA" && ["MENUNGGU_RT_RW", "MENUNGGU_LURAH", "MENUNGGU_CAMAT"].includes(app.status)) {
      const stageMap: Record<string, string> = { MENUNGGU_RT_RW: "RT_RW", MENUNGGU_LURAH: "LURAH", MENUNGGU_CAMAT: "CAMAT" };
      const steps = await db.select().from(approvalSteps).where(eq(approvalSteps.applicationId, id));
      const s = steps.find((x) => x.stage === stageMap[app.status]);
      if (s) await db.update(approvalSteps).set({ status: "DIKEMBALIKAN", actorId: user.id, note: desc, actedAt: now }).where(eq(approvalSteps.id, s.id));
    }

    await logEvent({
      applicationId: id, actorId: user.id, actorName: user.name, actorRole: user.role,
      previousStatus: app.status, newStatus: target, title, description: desc,
    });

    // notifications
    const notifMap: Array<{ to: string; title: string; msg: string }> = [];
    if (target === "TERVERIFIKASI") notifMap.push({ to: app.userId, title: "Dokumen telah terverifikasi", msg: `Pengajuan ${app.applicationNumber} terverifikasi. SLA mulai berjalan. Estimasi dapat dilihat pada tracking.` });
    else if (target === "MENUNGGU_WARGA") notifMap.push({ to: app.userId, title: "Dokumen perlu diperbaiki", msg: `Pengajuan ${app.applicationNumber} dikembalikan: ${desc} SLA dijeda hingga Anda mengirim perbaikan.` });
    else if (target === "MENUNGGU_VERIFIKASI") {
      const staff = await db.select().from(users).where(eq(users.role, "PETUGAS"));
      for (const s of staff) notifMap.push({ to: s.id, title: "Perbaikan warga masuk", msg: `Warga memperbaiki ${app.applicationNumber}. Mohon verifikasi ulang.` });
    } else if (target === "SEDANG_DIPROSES") notifMap.push({ to: app.userId, title: "Pengajuan sedang diproses", msg: `Pengajuan ${app.applicationNumber} sedang disusun petugas.` });
    else if (target === "MENUNGGU_RT_RW") {
      const rts = await db.select().from(users).where(eq(users.role, "RT_RW"));
      for (const r of rts) notifMap.push({ to: r.id, title: "Butuh persetujuan lingkungan", msg: `Pengajuan ${app.applicationNumber} menunggu ACC RT/RW.` });
      notifMap.push({ to: app.userId, title: "Menunggu persetujuan RT/RW", msg: `Pengajuan ${app.applicationNumber} diteruskan ke RT/RW.` });
    } else if (target === "MENUNGGU_LURAH") {
      const lurahs = await db.select().from(users).where(eq(users.role, "LURAH"));
      for (const l of lurahs) notifMap.push({ to: l.id, title: "Butuh persetujuan Lurah", msg: `Pengajuan ${app.applicationNumber} menunggu persetujuan akhir.` });
      notifMap.push({ to: app.userId, title: "Menunggu persetujuan Lurah", msg: `RT/RW menyetujui ${app.applicationNumber}. Kini menunggu Lurah.` });
    } else if (target === "MENUNGGU_CAMAT") {
      const camats = await db.select().from(users).where(eq(users.role, "CAMAT"));
      for (const c of camats) notifMap.push({ to: c.id, title: "Butuh persetujuan Camat", msg: `Pengajuan ahli waris ${app.applicationNumber} menunggu persetujuan Camat.` });
      notifMap.push({ to: app.userId, title: "Diteruskan ke Camat", msg: `Lurah menyetujui ${app.applicationNumber}. Kini menunggu Camat (khusus ahli waris).` });
    } else if (target === "FINALISASI") notifMap.push({ to: app.userId, title: "Surat sedang difinalisasi", msg: `Pengajuan ${app.applicationNumber} lolos approval dan sedang difinalisasi petugas.` });
    else if (target === "SELESAI") notifMap.push({ to: app.userId, title: "Surat berhasil diterbitkan", msg: `Pengajuan ${app.applicationNumber} SELESAI. Unduh surat pada detail pengajuan (SIMULASI). Mohon beri rating.` });
    else if (target === "DITOLAK") notifMap.push({ to: app.userId, title: "Pengajuan ditolak", msg: `Pengajuan ${app.applicationNumber} ditolak: ${desc}` });

    for (const n of notifMap) {
      await notify({ userId: n.to, applicationId: id, type: "STATUS", title: n.title, message: n.msg, link: `/pengajuan/${id}` });
    }
    await audit({ actorId: user.id, action: `TRANSITION_${action.toUpperCase()}`, entity: "applications", entityId: id, details: { from: app.status, to: target, note: desc } });

    return NextResponse.json({ ok: true, status: target });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memproses aksi." }, { status: 500 });
  }
}
