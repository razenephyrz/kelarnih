import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceRequirements, serviceTypes } from "@/db/schema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const cat = searchParams.get("cat") ?? "";
  const rows = await db.select().from(serviceTypes);
  let filtered = rows.filter((r) => r.isActive);
  if (q) filtered = filtered.filter((r) => (r.name + " " + r.description).toLowerCase().includes(q));
  if (cat) filtered = filtered.filter((r) => r.category === cat);
  const reqs = await db.select().from(serviceRequirements);
  const withReqs = filtered.map((s) => ({
    ...s,
    requirements: reqs.filter((r) => r.serviceTypeId === s.id).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
  const cats = [...new Set(rows.map((r) => r.category))];
  return NextResponse.json({ services: withReqs, categories: cats });
}
