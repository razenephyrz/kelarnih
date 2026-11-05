import { db } from "@/db";
import { adminRequests, notifications, procedures, requestHistory, user } from "@/db/schema";
import { ensureSeeded } from "@/db/seed-server";

export const dynamic = "force-dynamic";

function iso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

// GET /api/bootstrap — seed-if-empty, then return the whole demo dataset.
// Client store hydrates from here first, localStorage second (offline fallback).
export async function GET() {
  try {
    await ensureSeeded();
    const [users, reqs, hist, notifs, procs] = await Promise.all([
      db.select().from(user),
      db.select().from(adminRequests),
      db.select().from(requestHistory),
      db.select().from(notifications),
      db.select().from(procedures),
    ]);
    return Response.json({
      ok: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        createdAt: iso(u.createdAt),
        avatarColor: u.avatarColor ?? "#274C77",
      })),
      requests: reqs.map((r) => ({
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
      history: hist.map((h) => ({
        id: h.id,
        requestId: h.requestId,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        explanation: h.explanation,
        actorId: h.actorId,
        actorName: h.actorName,
        actorRole: h.actorRole,
        timestamp: iso(h.timestamp),
      })),
      notifications: notifs.map((n) => ({
        id: n.id,
        recipientId: n.recipientId,
        requestId: n.requestId ?? undefined,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: iso(n.createdAt),
      })),
      procedures: procs.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        eligibility: p.eligibility ?? [],
        requiredDocuments: p.requiredDocuments ?? [],
        procedureSteps: p.procedureSteps ?? [],
        responsibleDepartment: p.responsibleDepartment,
        processingTarget: p.processingTarget,
        processingDays: p.processingDays ?? 7,
        commonPitfalls: p.commonPitfalls ?? [],
        sourceReference: p.sourceReference,
        lastVerifiedAt: iso(p.lastVerifiedAt),
      })),
    });
  } catch (e) {
    console.error("[bootstrap]", e);
    return Response.json({ ok: false, error: "bootstrap-failed" }, { status: 500 });
  }
}

// POST /api/bootstrap — wipe + reseed the demo dataset (used by "Reset demo data").
export async function POST() {
  try {
    const { adminRequests: req, notifications: ntf, requestHistory: his, procedures: prc, user: usr } = await import(
      "@/db/schema"
    );
    await db.delete(ntf);
    await db.delete(his);
    await db.delete(req);
    await db.delete(prc);
    await db.delete(usr);
    const { ensureSeeded } = await import("@/db/seed-server");
    await ensureSeeded();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[bootstrap POST]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
