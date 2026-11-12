import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, serviceTypes, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { audit, logEvent, notify } from "@/lib/server";
import { computeDueDate } from "@/lib/sla";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { decision, note } = body as { decision: "APPROVE" | "REJECT"; note?: string };
  if (user.role !== "PETUGAS") return NextResponse.json({ error: "Hanya petugas yang memutuskan prioritas." }, { status: 403 });
  if (!decision) return NextResponse.json({ error: "Keputusan wajib diisi." }, { status: 400 });
  if (!note) return NextResponse.json({ error: "Alasan tertulis wajib diisi." }, { status: 400 });
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  const app = rows[0];
  if (!app) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  if (!app.isPriority || app.priorityStatus !== "PENDING")
    return NextResponse.json({ error: "Tidak ada permintaan prioritas pending." }, { status: 400 });
  const svc = (await db.select().from(serviceTypes).where(eq(serviceTypes.id, app.serviceTypeId)).limit(1))[0];
  const now = new Date();
  if (decision === "APPROVE") {
    const patch: any = {
      priorityStatus: "APPROVED", priorityNote: note, priorityDecidedBy: user.id, priorityDecidedAt: now, updatedAt: now,
    };
    // if already verified, recalc due to priority target
    if (app.verifiedAt && app.slaStartedAt) {
      patch.dueAt = computeDueDate(new Date(app.verifiedAt), svc?.prioritySlaDays ?? 1, true);
    }
    await db.update(applications).set(patch).where(eq(applications.id, id));
    await logEvent({ applicationId: id, actorId: user.id, actorName: user.name, actorRole: user.role, previousStatus: app.status, newStatus: app.status, title: "Prioritas disetujui", description: `${note} Estimasi berubah ke target prioritas (Hari ini sebelum 15.00 / 1 hari).` });
    await notify({ userId: app.userId, applicationId: id, type: "PRIORITAS", title: "Permintaan prioritas disetujui", message: `Prioritas untuk ${app.applicationNumber} disetujui: ${note}`, link: `/pengajuan/${id}` });
  } else {
    await db.update(applications).set({ priorityStatus: "REJECTED", priorityNote: note, priorityDecidedBy: user.id, priorityDecidedAt: now, updatedAt: now }).where(eq(applications.id, id));
    await logEvent({ applicationId: id, actorId: user.id, actorName: user.name, actorRole: user.role, previousStatus: app.status, newStatus: app.status, title: "Prioritas ditolak", description: `${note} Pengajuan tetap berjalan via antrean normal.` });
    await notify({ userId: app.userId, applicationId: id, type: "PRIORITAS", title: "Permintaan prioritas ditolak", message: `Prioritas untuk ${app.applicationNumber} ditolak: ${note}. Pengajuan tetap berjalan normal.`, link: `/pengajuan/${id}` });
  }
  await audit({ actorId: user.id, action: `PRIORITY_${decision}`, entity: "applications", entityId: id, details: { note } });
  return NextResponse.json({ ok: true });
}
