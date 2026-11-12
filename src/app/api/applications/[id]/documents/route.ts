import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { audit, logEvent } from "@/lib/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  const app = rows[0];
  if (!app) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  if (user.role === "WARGA" && app.userId !== user.id)
    return NextResponse.json({ error: "Bukan milik Anda." }, { status: 403 });
  if (app.status !== "MENUNGGU_WARGA" && user.role === "WARGA")
    return NextResponse.json({ error: "Perbaikan hanya saat status Perlu Perbaikan." }, { status: 400 });
  const body = await req.json();
  const { documents } = body as { documents: Array<{ requirementKey: string; path: string; fileName: string; fileType: string; fileSize: number }> };
  if (!documents?.length) return NextResponse.json({ error: "Tidak ada dokumen." }, { status: 400 });
  for (const d of documents) {
    // upsert by requirementKey: mark old as replaced? keep history by inserting new + marking old?
    const existing = await db.select().from(applicationDocuments).where(eq(applicationDocuments.applicationId, id));
    const same = existing.filter((x) => x.requirementKey === d.requirementKey);
    for (const s of same) {
      await db.update(applicationDocuments).set({ status: "PERBAIKAN", note: "Digantikan warga dengan berkas baru." }).where(eq(applicationDocuments.id, s.id));
    }
    await db.insert(applicationDocuments).values({
      applicationId: id,
      requirementKey: d.requirementKey,
      requirementName: d.requirementKey,
      fileName: d.fileName, fileType: d.fileType, fileSize: d.fileSize, filePath: d.path,
      status: "MENUNGGU",
    });
  }
  await logEvent({
    applicationId: id, actorId: user.id, actorName: user.name, actorRole: user.role,
    previousStatus: app.status, newStatus: app.status,
    title: "Dokumen perbaikan diunggah", description: `${documents.length} berkas perbaikan diunggah warga.`,
  });
  await audit({ actorId: user.id, action: "FIX_DOCUMENTS", entity: "applications", entityId: id, details: { count: documents.length } });
  return NextResponse.json({ ok: true });
}
