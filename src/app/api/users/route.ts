import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

export const dynamic = "force-dynamic";

// POST /api/users — mirror a mock-registered citizen into Postgres (best-effort).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !body.id || !body.name || !body.passwordHash) {
      return Response.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
    if (existing.length > 0) return Response.json({ ok: true, deduped: true });
    await db.insert(user).values({
      id: String(body.id),
      name: String(body.name),
      email,
      emailVerified: false,
      role: "citizen",
      passwordHash: String(body.passwordHash),
      avatarColor: "#274C77",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[users POST]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
