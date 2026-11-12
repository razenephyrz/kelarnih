import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceRequirements, serviceTypes } from "@/db/schema";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await db.select().from(serviceTypes).where(eq(serviceTypes.slug, slug)).limit(1);
  const svc = rows[0];
  if (!svc) return NextResponse.json({ error: "Layanan tidak ditemukan." }, { status: 404 });
  const reqs = await db.select().from(serviceRequirements).where(eq(serviceRequirements.serviceTypeId, svc.id));
  reqs.sort((a, b) => a.sortOrder - b.sortOrder);
  return NextResponse.json({ service: { ...svc, requirements: reqs } });
}
