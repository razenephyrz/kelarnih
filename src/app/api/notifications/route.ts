import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  if (searchParams.get("unread") === "1") {
    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
    return NextResponse.json({ unread: rows.length });
  }
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(60);
  return NextResponse.json({ notifications: rows });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { ids, all } = body as { ids?: string[]; all?: boolean };
  if (all) {
    const { eq: eq2 } = await import("drizzle-orm");
    await db.update(notifications).set({ isRead: true }).where(eq2(notifications.userId, user.id));
    return NextResponse.json({ ok: true });
  }
  if (ids?.length) {
    for (const id of ids) {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    }
    return NextResponse.json({ ok: true });
  }
  // single id via ?id=
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
}
