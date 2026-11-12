import { db } from "@/db";
import { applicationEvents, auditLogs, notifications } from "@/db/schema";

export async function logEvent(opts: {
  applicationId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  title: string;
  description?: string | null;
}) {
  await db.insert(applicationEvents).values({
    applicationId: opts.applicationId,
    actorId: opts.actorId ?? null,
    actorName: opts.actorName ?? null,
    actorRole: opts.actorRole ?? null,
    previousStatus: opts.previousStatus ?? null,
    newStatus: opts.newStatus ?? null,
    title: opts.title,
    description: opts.description ?? null,
  });
}

export async function notify(opts: {
  userId: string;
  applicationId?: string | null;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}) {
  await db.insert(notifications).values({
    userId: opts.userId,
    applicationId: opts.applicationId ?? null,
    type: opts.type,
    title: opts.title,
    message: opts.message,
    link: opts.link ?? null,
  });
}

export async function audit(opts: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
}) {
  await db.insert(auditLogs).values({
    actorId: opts.actorId ?? null,
    action: opts.action,
    entity: opts.entity,
    entityId: opts.entityId ?? null,
    details: opts.details ?? null,
  });
}

export function ensureDir(p: string) {
  // dynamic import to avoid edge issues
  const fs = require("fs");
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
