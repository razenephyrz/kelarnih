import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export const dynamic = "force-dynamic";

// GET /api/notifications?recipientId=... — inbox list (newest first via client sort).
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const recipientId = url.searchParams.get("recipientId");
    const rows = recipientId
      ? await db.select().from(notifications).where(eq(notifications.recipientId, recipientId))
      : await db.select().from(notifications);
    return Response.json({
      ok: true,
      notifications: rows.map((n) => ({
        id: n.id,
        recipientId: n.recipientId,
        requestId: n.requestId ?? undefined,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : new Date(n.createdAt).toISOString(),
      })),
    });
  } catch (e) {
    console.error("[notifications GET]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

// PATCH /api/notifications — { ids: string[], isRead: boolean } bulk update.
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const isRead = body.isRead !== false;
    const recipientId: string | undefined = body.recipientId;
    for (const id of ids.slice(0, 200)) {
      if (recipientId) {
        await db
          .update(notifications)
          .set({ isRead })
          .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)));
      } else {
        await db.update(notifications).set({ isRead }).where(eq(notifications.id, id));
      }
    }
    return Response.json({ ok: true, updated: ids.length });
  } catch (e) {
    console.error("[notifications PATCH]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
