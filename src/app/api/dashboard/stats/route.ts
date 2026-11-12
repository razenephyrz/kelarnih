import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications, ratings, serviceTypes, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "6m"; // 1m, 3m, 6m, 12m, all
  const months = range === "1m" ? 1 : range === "3m" ? 3 : range === "12m" ? 12 : range === "all" ? 24 : 6;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const allApps = await db.select().from(applications);
  const allRatings = await db.select().from(ratings);
  const svcs = await db.select().from(serviceTypes);
  const svcMap = Object.fromEntries(svcs.map((s) => [s.id, s]));

  const inRange = allApps.filter((a) => new Date(a.createdAt) >= cutoff);
  const completed = inRange.filter((a) => a.status === "SELESAI");
  const overdue = inRange.filter((a) => a.dueAt && a.status !== "SELESAI" && new Date(a.dueAt).getTime() < Date.now());

  // on-time %
  let onTime = 0;
  for (const c of completed) {
    if (c.dueAt && c.completedAt && new Date(c.completedAt).getTime() <= new Date(c.dueAt).getTime()) onTime++;
    else if (!c.dueAt) onTime++;
  }
  const onTimePct = completed.length ? Math.round((onTime / completed.length) * 100) : 0;

  // prev month comparison (completed last 30d vs previous 30d on-time)
  const now = new Date();
  const last30 = allApps.filter((a) => a.status === "SELESAI" && new Date(a.completedAt ?? a.updatedAt) >= new Date(now.getTime() - 30 * 86400000));
  const prev30 = allApps.filter((a) => a.status === "SELESAI" && new Date(a.completedAt ?? a.updatedAt) < new Date(now.getTime() - 30 * 86400000) && new Date(a.completedAt ?? a.updatedAt) >= new Date(now.getTime() - 60 * 86400000));
  function pct(list: typeof allApps) {
    if (!list.length) return 0;
    let ok = 0;
    for (const c of list) if (c.dueAt && c.completedAt && new Date(c.completedAt).getTime() <= new Date(c.dueAt).getTime()) ok++;
    return Math.round((ok / list.length) * 100);
  }
  const delta = pct(last30) - pct(prev30);

  // avg process days (verified -> completed)
  let totalDays = 0, cntDays = 0;
  for (const c of completed) {
    if (c.verifiedAt && c.completedAt) {
      totalDays += (new Date(c.completedAt).getTime() - new Date(c.verifiedAt).getTime()) / 86400000;
      cntDays++;
    }
  }
  const avgDays = cntDays ? +(totalDays / cntDays).toFixed(1) : 0;

  // ratings
  const avg = allRatings.length ? +(allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length).toFixed(1) : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: allRatings.filter((r) => r.score === s).length }));
  const byCat: Record<string, { count: number; avg: number }> = {};
  for (const c of ["KECEPATAN", "KERAMAHAN", "KEJELASAN"]) {
    const list = allRatings.filter((r) => r.category === c);
    byCat[c] = { count: list.length, avg: list.length ? +(list.reduce((s, r) => s + r.score, 0) / list.length).toFixed(1) : 0 };
  }
  // lurah rating (ratings with lurahId)
  const lurahRatings = allRatings.filter((r) => r.lurahId);
  const lurahAvg = lurahRatings.length ? +(lurahRatings.reduce((s, r) => s + r.score, 0) / lurahRatings.length).toFixed(1) : 0;

  // trend per month
  const trend: Array<{ month: string; total: number; selesai: number }> = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    const m = d.getMonth(), y = d.getFullYear();
    const list = allApps.filter((a) => { const t = new Date(a.createdAt); return t.getMonth() === m && t.getFullYear() === y; });
    trend.push({ month: key, total: list.length, selesai: list.filter((a) => a.status === "SELESAI").length });
  }

  // status distribution
  const statuses = ["MENUNGGU_VERIFIKASI", "MENUNGGU_WARGA", "TERVERIFIKASI", "SEDANG_DIPROSES", "MENUNGGU_RT_RW", "MENUNGGU_LURAH", "MENUNGGU_CAMAT", "FINALISASI", "SELESAI", "DITOLAK"];
  const statusDist = statuses.map((s) => ({ status: s, count: inRange.filter((a) => a.status === s).length })).filter((x) => x.count > 0);

  // avg per service
  const perService = svcs.map((s) => {
    const list = completed.filter((a) => a.serviceTypeId === s.id && a.verifiedAt && a.completedAt);
    const avgD = list.length ? +(list.reduce((sum, a) => sum + (new Date(a.completedAt!).getTime() - new Date(a.verifiedAt!).getTime()) / 86400000, 0) / list.length).toFixed(1) : 0;
    return { slug: s.slug, name: s.name, count: completed.filter((a) => a.serviceTypeId === s.id).length, avgDays: avgD };
  }).filter((x) => x.count > 0);

  // waiting approvals
  const waitingRT = allApps.filter((a) => a.status === "MENUNGGU_RT_RW").length;
  const waitingLurah = allApps.filter((a) => a.status === "MENUNGGU_LURAH").length;
  const waitingCamat = allApps.filter((a) => a.status === "MENUNGGU_CAMAT").length;
  const needVerify = allApps.filter((a) => a.status === "MENUNGGU_VERIFIKASI").length;
  const priorityCount = allApps.filter((a) => a.isPriority).length;
  const priorityPending = allApps.filter((a) => a.isPriority && a.priorityStatus === "PENDING").length;

  // my stats for warga
  let mine = null as any;
  if (user.role === "WARGA") {
    const myApps = allApps.filter((a) => a.userId === user.id);
    mine = {
      total: myApps.length,
      selesai: myApps.filter((a) => a.status === "SELESAI").length,
      proses: myApps.filter((a) => !["SELESAI", "DITOLAK"].includes(a.status)).length,
      perluPerbaikan: myApps.filter((a) => a.status === "MENUNGGU_WARGA").length,
      recent: myApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((a) => ({ ...a, serviceName: svcMap[a.serviceTypeId]?.name })),
    };
  }

  return NextResponse.json({
    summary: {
      total: inRange.length, selesai: completed.length, terlambat: overdue.length,
      onTimePct, delta, avgDays, ratingAvg: avg, ratingCount: allRatings.length,
      lurahAvg, lurahCount: lurahRatings.length,
      waitingRT, waitingLurah, waitingCamat, needVerify, priorityCount, priorityPending,
    },
    trend, statusDist, perService,
    ratingDist: dist, ratingByCat: byCat,
    mine,
    lateList: overdue.slice(0, 8).map((a) => ({ ...a, serviceName: svcMap[a.serviceTypeId]?.name })),
  });
}
