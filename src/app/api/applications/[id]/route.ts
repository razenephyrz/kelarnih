import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationDocuments,
  applicationEvents,
  approvalSteps,
  applications,
  ratings,
  serviceRequirements,
  serviceTypes,
  users,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { formatWIB } from "@/lib/sla";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const apps = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  const app = apps[0];
  if (!app) return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  if (user.role === "WARGA" && app.userId !== user.id)
    return NextResponse.json({ error: "Anda tidak berhak melihat pengajuan ini." }, { status: 403 });
  if (user.role === "CAMAT") {
    const svc = (await db.select().from(serviceTypes).where(eq(serviceTypes.id, app.serviceTypeId)).limit(1))[0];
    if (!svc?.requiresCamat) return NextResponse.json({ error: "Di luar kewenangan Camat." }, { status: 403 });
  }
  const svc = (await db.select().from(serviceTypes).where(eq(serviceTypes.id, app.serviceTypeId)).limit(1))[0];
  const reqs = await db.select().from(serviceRequirements).where(eq(serviceRequirements.serviceTypeId, app.serviceTypeId));
  reqs.sort((a, b) => a.sortOrder - b.sortOrder);
  const docs = await db.select().from(applicationDocuments).where(eq(applicationDocuments.applicationId, id));
  const steps = await db.select().from(approvalSteps).where(eq(approvalSteps.applicationId, id));
  const events = await db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, id));
  events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const owner = (await db.select().from(users).where(eq(users.id, app.userId)).limit(1))[0];
  const ratingRows = await db.select().from(ratings).where(eq(ratings.applicationId, id)).limit(1);
  // enrich steps with actor names
  const enrichedSteps = await Promise.all(
    steps.map(async (s) => {
      let actorName: string | null = null;
      if (s.actorId) {
        const u = (await db.select().from(users).where(eq(users.id, s.actorId)).limit(1))[0];
        actorName = u?.name ?? null;
      }
      return { ...s, actorName };
    })
  );
  return NextResponse.json({
    application: {
      ...app,
      serviceName: svc?.name, serviceSlug: svc?.slug, serviceDescription: svc?.description,
      requiresCamat: !!svc?.requiresCamat, baseSlaDays: svc?.baseSlaDays, prioritySlaDays: svc?.prioritySlaDays,
      ownerName: owner?.name, ownerEmail: owner?.email, ownerPhone: owner?.phone, ownerAddress: owner?.address,
    },
    requirements: reqs,
    documents: docs,
    approvals: enrichedSteps,
    events,
    rating: ratingRows[0] ?? null,
  });
}
