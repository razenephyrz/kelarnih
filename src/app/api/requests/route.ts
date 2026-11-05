import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminRequests, notifications, requestHistory } from "@/db/schema";
import { uid } from "@/lib/utils";

export const dynamic = "force-dynamic";

function iso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

// GET /api/requests?ownerId=... — list (optionally scoped to an owner).
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get("ownerId");
    const rows = ownerId
      ? await db.select().from(adminRequests).where(eq(adminRequests.ownerId, ownerId))
      : await db.select().from(adminRequests);
    return Response.json({
      ok: true,
      requests: rows.map((r) => ({
        id: r.id,
        ownerId: r.ownerId,
        documentType: r.documentType,
        title: r.title,
        description: r.description,
        status: r.status,
        createdAt: iso(r.createdAt),
        updatedAt: iso(r.updatedAt),
        targetCompletionAt: iso(r.targetCompletionAt),
        assignedDepartment: r.assignedDepartment,
        requiredActions: r.requiredActions ?? [],
        delayReason: r.delayReason ?? undefined,
        escalationFlag: r.escalationFlag ?? false,
        metadata: (r.metadata ?? {}) as Record<string, string>,
      })),
    });
  } catch (e) {
    console.error("[requests GET]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

// POST /api/requests — create + history + notification, atomically from the client's view.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + Number(body.targetDays ?? 7));
    target.setHours(17, 0, 0, 0);

    const row = {
      id: String(body.id ?? `CF-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`),
      ownerId: String(body.ownerId),
      documentType: String(body.documentType ?? "General"),
      title: String(body.title ?? "Untitled request"),
      description: String(body.description ?? ""),
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      targetCompletionAt: target,
      assignedDepartment: String(body.assignedDepartment ?? "Front Office"),
      requiredActions: [] as string[],
      delayReason: null as string | null,
      escalationFlag: false,
      metadata: (body.metadata ?? {}) as Record<string, string>,
    };
    await db.insert(adminRequests).values(row);

    const actorName = String(body.actorName ?? "Citizen");
    const historyId = uid("h");
    await db.insert(requestHistory).values({
      id: historyId,
      requestId: row.id,
      previousStatus: "—",
      newStatus: "submitted",
      explanation: "Request submitted. Received at front office intake.",
      actorId: row.ownerId,
      actorName,
      actorRole: String(body.actorRole ?? "citizen"),
      timestamp: now,
    });

    const notifId = uid("n");
    await db.insert(notifications).values({
      id: notifId,
      recipientId: row.ownerId,
      requestId: row.id,
      title: `Request ${row.id} received`,
      message: `Prototype message: your ${row.documentType} request "${row.title}" was received and is awaiting verification.`,
      type: "request_created",
      isRead: false,
      createdAt: now,
    });

    return Response.json({
      ok: true,
      request: {
        ...row,
        status: row.status,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        targetCompletionAt: target.toISOString(),
        delayReason: undefined,
      },
      historyId,
      notificationId: notifId,
    });
  } catch (e) {
    console.error("[requests POST]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
