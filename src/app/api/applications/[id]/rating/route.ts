import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, ratings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { audit, notify } from "@/lib/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { score, category, comment } = body as { score: number; category: string; comment?: string };
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  const app = rows[0];
  if (!app) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  if (app.userId !== user.id) return NextResponse.json({ error: "Hanya pemilik pengajuan yang boleh memberi rating." }, { status: 403 });
  if (app.status !== "SELESAI") return NextResponse.json({ error: "Rating hanya setelah pengajuan SELESAI." }, { status: 400 });
  if (!score || score < 1 || score > 5) return NextResponse.json({ error: "Skor 1–5 wajib diisi." }, { status: 400 });
  const existing = await db.select().from(ratings).where(eq(ratings.applicationId, id)).limit(1);
  if (existing[0]) return NextResponse.json({ error: "Rating hanya dapat diberikan satu kali." }, { status: 400 });
  const cats = ["KECEPATAN", "KERAMAHAN", "KEJELASAN"];
  if (!cats.includes(category)) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
  // context tag: if app had returns (paused), label it
  const contextTag = app.accumulatedPauseSeconds > 0 || app.delayReason ? "dokumen sempat dikembalikan" : null;
  // find lurah id: use staff handler? need lurah user
  const { users } = await import("@/db/schema");
  const lurahs = await db.select().from(users).where(eq(users.role, "LURAH")).limit(1);
  const [r] = await db
    .insert(ratings)
    .values({
      applicationId: id, citizenId: user.id, staffId: app.staffHandlerId ?? null, lurahId: lurahs[0]?.id ?? null,
      score, category, comment: comment?.slice(0, 1000) ?? null, contextTag,
    })
    .returning();
  await audit({ actorId: user.id, action: "GIVE_RATING", entity: "ratings", entityId: r.id, details: { score, category } });
  return NextResponse.json({ rating: r });
}
