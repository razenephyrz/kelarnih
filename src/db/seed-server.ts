// Server-side seeding: mirrors the client demo dataset into Postgres via Drizzle.
// Runs lazily from `/api/bootstrap` when tables are empty — the same role the
// SvelteKit `src/hooks.server.ts` init would play in the mysql2 target.
import { db } from "@/db";
import { adminRequests, notifications, procedures, requestHistory, user } from "@/db/schema";
import { seedHistory, seedNotifications, seedProcedures, seedRequests, seedUsers } from "@/data/seed";

function toDate(v: string): Date {
  return new Date(v);
}

export async function ensureSeeded(): Promise<{ seeded: boolean }> {
  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) return { seeded: false };

  const users = seedUsers();
  await db.insert(user).values(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: false,
      role: u.role,
      passwordHash: u.passwordHash,
      avatarColor: u.avatarColor ?? "#274C77",
      createdAt: toDate(u.createdAt),
      updatedAt: toDate(u.createdAt),
    }))
  );

  const procs = seedProcedures();
  await db.insert(procedures).values(
    procs.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      eligibility: p.eligibility,
      requiredDocuments: p.requiredDocuments,
      procedureSteps: p.procedureSteps,
      responsibleDepartment: p.responsibleDepartment,
      processingTarget: p.processingTarget,
      processingDays: p.processingDays,
      commonPitfalls: p.commonPitfalls,
      sourceReference: p.sourceReference,
      lastVerifiedAt: toDate(p.lastVerifiedAt),
    }))
  );

  const reqs = seedRequests();
  await db.insert(adminRequests).values(
    reqs.map((r) => ({
      id: r.id,
      ownerId: r.ownerId,
      documentType: r.documentType,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: toDate(r.createdAt),
      updatedAt: toDate(r.updatedAt),
      targetCompletionAt: toDate(r.targetCompletionAt),
      assignedDepartment: r.assignedDepartment,
      requiredActions: r.requiredActions,
      delayReason: r.delayReason ?? null,
      escalationFlag: r.escalationFlag ?? false,
      metadata: r.metadata,
    }))
  );

  const hist = seedHistory();
  await db.insert(requestHistory).values(
    hist.map((h) => ({
      id: h.id,
      requestId: h.requestId,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      explanation: h.explanation,
      actorId: h.actorId,
      actorName: h.actorName,
      actorRole: h.actorRole,
      timestamp: toDate(h.timestamp),
    }))
  );

  const notifs = seedNotifications();
  await db.insert(notifications).values(
    notifs.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      requestId: n.requestId ?? null,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: toDate(n.createdAt),
    }))
  );

  return { seeded: true };
}
