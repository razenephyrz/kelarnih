import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, ratings, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["LURAH", "PETUGAS"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.select().from(users);
  const staff = rows.filter((r) => ["PETUGAS", "RT_RW", "LURAH", "CAMAT"].includes(r.role));
  const apps = await db.select().from(applications);
  const allRatings = await db.select().from(ratings);
  const enriched = staff.map((s) => {
    const handled = apps.filter((a) => a.staffHandlerId === s.id);
    const rlist = allRatings.filter((r) => r.staffId === s.id);
    const avg = rlist.length ? +(rlist.reduce((x, y) => x + y.score, 0) / rlist.length).toFixed(1) : null;
    return { id: s.id, name: s.name, email: s.email, role: s.role, phone: s.phone, handled: handled.length, ratingAvg: avg, ratingCount: rlist.length };
  });
  return NextResponse.json({ staff: enriched });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "LURAH") return NextResponse.json({ error: "Hanya Lurah." }, { status: 403 });
  const { name, email, password, role, phone } = await req.json();
  if (!name || !email || !password || !role) return NextResponse.json({ error: "Data belum lengkap." }, { status: 400 });
  if (!["PETUGAS", "RT_RW"].includes(role)) return NextResponse.json({ error: "Role harus PETUGAS atau RT/RW (demo)." }, { status: 400 });
  const exists = await db.select().from(users).where(eq(users.email, String(email).toLowerCase())).limit(1);
  if (exists[0]) return NextResponse.json({ error: "Email sudah dipakai." }, { status: 409 });
  const hash = await hashPassword(String(password));
  const [row] = await db.insert(users).values({ name, email: String(email).toLowerCase(), passwordHash: hash, role, phone: phone ?? null }).returning();
  await audit({ actorId: user.id, action: "CREATE_STAFF", entity: "users", entityId: row.id, details: { role } });
  return NextResponse.json({ staff: { id: row.id, name: row.name, email: row.email, role: row.role } });
}
