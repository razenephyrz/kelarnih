import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminRequests, notifications, requestHistory } from "@/db/schema";
import { uid } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/requests/:id — partial update and/or status change with audit + notify.
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const rows = await db.select().from(adminRequests).where(eq(adminRequests.id, id)).limit(1);
    const current = rows[0];
    if (!current) return Response.json({ ok: false, error: "not-found" }, { status: 404 });

    const now = new Date();
    const patch: Partial<typeof adminRequests.$inferInsert> = { updatedAt: now };
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.description === "string") patch.description = body.description;
    if (typeof body.status === "string") patch.status = body.status;
    if (Array.isArray(body.requiredActions)) patch.requiredActions = body.requiredActions;
    if (typeof body.delayReason !== "undefined") patch.delayReason = body.delayReason || null;
    if (typeof body.escalationFlag === "boolean") patch.escalationFlag = body.escalationFlag;
    if (body.metadata && typeof body.metadata === "object") patch.metadata = body.metadata;

    await db.update(adminRequests).set(patch).where(eq(adminRequests.id, id));

    let historyId: string | null = null;
    let notificationId: string | null = null;
    const newStatus = typeof body.status === "string" ? body.status : current.status;
    const statusChanged = newStatus !== current.status;
    const note: string | undefined = body.explanation ?? body.note;

    if (statusChanged || note) {
      historyId = uid("h");
      await db.insert(requestHistory).values({
        id: historyId,
        requestId: id,
        previousStatus: current.status,
        newStatus,
        explanation: note || `Updated by ${body.actorName ?? "operator"}.`,
        actorId: String(body.actorId ?? current.ownerId),
        actorName: String(body.actorName ?? "Operator"),
        actorRole: String(body.actorRole ?? "admin"),
        timestamp: now,
      });
    }
    if (statusChanged) {
      const type =
        newStatus === "completed" ? "completed" : newStatus === "action_required" ? "action_required" : "status_change";
      notificationId = uid("n");
      await db.insert(notifications).values({
        id: notificationId,
        recipientId: current.ownerId,
        requestId: id,
        title:
          newStatus === "completed"
            ? `Request ${id} completed`
            : newStatus === "action_required"
              ? `Action needed on ${id}`
              : `Update on ${id}: ${String(newStatus).replace("_", " ")}`,
        message: `Prototype message: ${note ?? `Status changed to ${newStatus}.`}`,
        type,
        isRead: false,
        createdAt: now,
      });
    }

    return Response.json({ ok: true, historyId, notificationId });
  } catch (e) {
    console.error("[request PATCH]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

// DELETE /api/requests/:id — blocked for completed/approved (official record).
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const rows = await db.select().from(adminRequests).where(eq(adminRequests.id, id)).limit(1);
    const current = rows[0];
    if (!current) return Response.json({ ok: false, error: "not-found" }, { status: 404 });
    if (current.status === "completed" || current.status === "approved") {
      return Response.json({ ok: false, error: "official-record" }, { status: 422 });
    }
    await db.delete(requestHistory).where(eq(requestHistory.requestId, id));
    await db.delete(adminRequests).where(eq(adminRequests.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[request DELETE]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
