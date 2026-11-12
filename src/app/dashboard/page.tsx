"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FilePlus2, Clock, Star, ArrowRight, Zap, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui";
import { formatDateWIB } from "@/lib/sla";

export default function DashboardPage() {
  const { me, loading } = useMe();
  const [stats, setStats] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!me) return;
    Promise.all([
      mockApiFetch("/api/dashboard/stats?range=6m").then((r) => parseJsonResponse(r)).catch(() => ({})),
      mockApiFetch("/api/applications").then((r) => parseJsonResponse(r)).catch(() => ({ applications: [] })),
    ]).then(([s, a]) => {
      setStats(s);
      setApps(a.applications ?? []);
    }).finally(() => setLoadingData(false));
  }, [me]);

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;

  return (
    <AppShell user={me} title={`Selamat Datang, ${me.name.split(" ")[0]}`} subtitle="Pantau pengajuan dan urus kebutuhan administrasi Anda dengan lebih mudah.">
      {loadingData ? (
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : (
        <RoleDashboard me={me} stats={stats} apps={apps} />
      )}
    </AppShell>
  );
}

function RoleDashboard({ me, stats, apps }: any) {
  if (me.role === "WARGA") return <WargaDash me={me} stats={stats} apps={apps} />;
  if (me.role === "PETUGAS") return <PetugasDash stats={stats} apps={apps} />;
  if (me.role === "RT_RW") return <RtDash apps={apps} />;
  if (me.role === "LURAH") return <LurahDash stats={stats} apps={apps} />;
  if (me.role === "CAMAT") return <CamatDash apps={apps} />;
  return null;
}

function WargaDash({ me, stats, apps }: any) {
  const mine = stats?.mine;
  const popular = apps.slice(0, 3);
  return (
    <div className="space-y-5">
      <div className="hero-plum rounded-[24px] p-6 text-white sm:p-7">
        <p className="text-[13px] font-bold text-white/70">Dashboard layanan publik Kelurahan Contoh</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Total pengajuan", mine?.total ?? 0],
            ["Selesai", mine?.selesai ?? 0],
            ["Perlu perbaikan", mine?.perluPerbaikan ?? 0],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-2xl bg-white/12 p-4"><p className="text-[26px] font-extrabold">{v}</p><p className="text-[12px] font-bold text-white/75">{l}</p></div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/pengajuan/baru" className="btn-terra rounded-xl px-5 py-2.5 text-sm font-extrabold"><FilePlus2 size={15} className="mr-1 inline" /> Buat Pengajuan</Link>
          <Link href="/tracking" className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-extrabold hover:bg-white/25">Lacak Status →</Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-extrabold">Pengajuan Terbaru</h2>
            <Link href="/pengajuan" className="ml-auto text-[13px] font-bold text-[#c06b4a]">Lihat semua →</Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {(mine?.recent ?? []).length === 0 && <div className="card-soft p-6 text-center text-sm text-[#7a6f6a]">Belum ada pengajuan. <Link href="/pengajuan/baru" className="font-bold text-[#c06b4a]">Buat pertama →</Link></div>}
            {(mine?.recent ?? []).map((a: any) => (
              <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 p-4 hover:shadow-md">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f7e8df]">📄</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</span>
                  <span className="block text-[12px] text-[#7a6f6a]">Estimasi: {a.dueAt ? formatDateWIB(a.dueAt) : "setelah verifikasi"}</span>
                </span>
                <span className="ml-auto flex shrink-0 flex-col items-end gap-1"><StatusBadge status={a.status} /></span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[17px] font-extrabold">Edukasi Terkait</h2>
          <div className="card-soft mt-3 p-4">
            <div className="flex gap-1.5 text-[11px] font-bold">
              {["KTP", "KK", "Pengantar RT"].map((t) => <span key={t} className="rounded-full bg-[#f7e8df] px-2.5 py-1">{t}</span>)}
            </div>
            <ul className="mt-2 space-y-1.5 rounded-xl bg-[#2b2320] p-3.5 text-[13px] text-white">
              <li>☑ KTP-el — identitas pemohon</li>
              <li>☑ KK — susunan keluarga</li>
              <li>☐ Surat pernyataan bermaterai</li>
            </ul>
            <p className="mt-2 text-[13px]"><b>Estimasi: 2 hari</b> <span className="text-[#7a6f6a]">• dihitung setelah verifikasi</span></p>
            <Link href="/pengajuan/baru" className="btn-terra mt-2 inline-block rounded-xl px-4 py-2 text-[13px] font-bold">Ajukan Pengajuan</Link>
          </div>
          <div className="card-soft mt-3 p-4">
            <p className="text-[14px] font-extrabold">Layanan populer</p>
            <div className="mt-2 space-y-1.5">
              {[["Domisili", "/pengajuan/baru?layanan=domisili"], ["Kematian", "/pengajuan/baru?layanan=kematian"], ["SKTM", "/pengajuan/baru?layanan=sktm"]].map(([n, h]) => (
                <Link key={n} href={h} className="flex items-center justify-between rounded-xl bg-[#faf5ef] px-3 py-2 text-[13px] font-bold hover:bg-[#f4e9de]">{n} <ArrowRight size={14} /></Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PetugasDash({ stats, apps }: any) {
  const s = stats?.summary ?? {};
  const needVerify = apps.filter((a: any) => a.status === "MENUNGGU_VERIFIKASI");
  const priority = apps.filter((a: any) => a.isPriority && a.priorityStatus === "PENDING");
  const late = stats?.lateList ?? [];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Perlu verifikasi", s.needVerify ?? needVerify.length, "Menunggu Verifikasi", "/verifikasi"],
          ["Prioritas pending", s.priorityPending ?? priority.length, "Keputusan prioritas", "/prioritas"],
          ["Terlambat", s.terlambat ?? 0, "Perlu perhatian", "/monitoring"],
          ["Total 6 bln", s.total ?? apps.length, "Semua pengajuan", "/pengajuan"],
        ].map(([l, v, d, h]) => (
          <Link key={l as string} href={h as string} className="card-soft p-4 hover:shadow-md">
            <p className="text-[26px] font-extrabold text-[#5f3d4e]">{v}</p>
            <p className="text-[13px] font-extrabold">{l}</p>
            <p className="text-[12px] text-[#7a6f6a]">{d}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="text-[16px] font-extrabold">Pengajuan masuk terbaru</h2>
          <div className="mt-2 space-y-2">
            {apps.slice(0, 5).map((a: any) => (
              <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 p-3.5 hover:shadow-md">
                <span className="min-w-0"><span className="block truncate text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</span><span className="text-[12px] text-[#7a6f6a]">{a.ownerName}</span></span>
                <span className="ml-auto"><StatusBadge status={a.status} /></span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="flex items-center gap-1.5 text-[16px] font-extrabold"><AlertTriangle size={16} className="text-[#c06b4a]" /> Terlambat / perlu perhatian</h2>
          <div className="mt-2 space-y-2">
            {late.length === 0 && <div className="card-soft p-5 text-sm text-[#7a6f6a]">Tidak ada yang terlambat. 🎉</div>}
            {late.map((a: any) => (
              <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft border-red-200 p-3.5">
                <p className="text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</p>
                <p className="text-[12px] text-[#991b1b] font-bold">Terlambat — {a.delayReason ?? "segera perbarui estimasi dengan alasan"}</p>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/verifikasi" className="btn-primary rounded-xl px-4 py-2.5 text-[13px] font-bold">Buka Verifikasi</Link>
            <Link href="/prioritas" className="rounded-xl border border-[#5f3d4e] px-4 py-2.5 text-[13px] font-bold text-[#5f3d4e]"><Zap size={13} className="mr-1 inline" /> Antrean Prioritas</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RtDash({ apps }: any) {
  const waiting = apps.filter((a: any) => a.status === "MENUNGGU_RT_RW");
  const done = apps.filter((a: any) => !["MENUNGGU_RT_RW", "MENUNGGU_VERIFIKASI"].includes(a.status)).slice(0, 6);
  return (
    <div className="space-y-5">
      <div className="card-blush rounded-[20px] p-6">
        <p className="text-[15px] font-extrabold">Menunggu persetujuan Anda: {waiting.length} pengajuan</p>
        <p className="text-[13px] text-[#5f3d4e]">Periksa data warga, setujui atau kembalikan dengan alasan tertulis. Tindakan tercatat + notifikasi otomatis.</p>
        <Link href="/persetujuan" className="btn-primary mt-3 inline-block rounded-xl px-5 py-2.5 text-sm font-bold">Buka Persetujuan →</Link>
      </div>
      <h2 className="text-[16px] font-extrabold">Butuh tindakan</h2>
      <div className="space-y-2">
        {waiting.length === 0 && <div className="card-soft p-6 text-center text-sm text-[#7a6f6a]">Tidak ada yang menunggu. Semua clear ✅</div>}
        {waiting.map((a: any) => (
          <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 border-orange-200 p-4">
            <span><span className="block text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</span><span className="text-[12px] text-[#7a6f6a]">{a.ownerName} • {a.isPriority ? "⚡ Prioritas" : "Reguler"}</span></span>
            <span className="ml-auto"><StatusBadge status={a.status} /></span>
          </Link>
        ))}
      </div>
      <h2 className="text-[16px] font-extrabold">Riwayat</h2>
      <div className="space-y-2">
        {done.map((a: any) => (
          <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 p-3.5 opacity-90">
            <span className="text-[14px] font-bold">{a.serviceName} • {a.applicationNumber}</span>
            <span className="ml-auto"><StatusBadge status={a.status} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LurahDash({ stats, apps }: any) {
  const s = stats?.summary ?? {};
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [`${s.onTimePct ?? 0}%`, `Tepat waktu (${(s.delta ?? 0) >= 0 ? "+" : ""}${s.delta ?? 0}% vs bln lalu)`, "/akuntabilitas"],
          [`${s.avgDays ?? 0} hari`, "Rata-rata proses", "/akuntabilitas"],
          [`${s.lurahAvg ?? 0}/5`, `Rating Lurah (${s.lurahCount ?? 0} penilaian)`, "/akuntabilitas"],
          [`${s.ratingAvg ?? 0}/5`, `Rating layanan (${s.ratingCount ?? 0})`, "/akuntabilitas"],
        ].map(([v, l, h]) => (
          <Link key={l as string} href={h as string} className="card-soft p-4 hover:shadow-md">
            <p className="text-[22px] font-extrabold text-[#5f3d4e]">{v}</p><p className="text-[12px] font-bold text-[#7a6f6a]">{l}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Menunggu Lurah", s.waitingLurah ?? 0, "/persetujuan"], ["Menunggu RT/RW", s.waitingRT ?? 0, "/monitoring"], ["Prioritas", s.priorityCount ?? 0, "/monitoring"], ["Terlambat", s.terlambat ?? 0, "/monitoring"]].map(([l, v, h]) => (
          <Link key={l as string} href={h as string} className="card-soft p-3.5 text-center hover:shadow-md"><p className="text-xl font-extrabold">{v}</p><p className="text-[12px] font-bold text-[#7a6f6a]">{l}</p></Link>
        ))}
      </div>
      <div>
        <div className="flex items-center"><h2 className="text-[16px] font-extrabold">Menunggu persetujuan Lurah</h2><Link href="/persetujuan" className="ml-auto text-[13px] font-bold text-[#c06b4a]">Buka semua →</Link></div>
        <div className="mt-2 space-y-2">
          {apps.filter((a: any) => a.status === "MENUNGGU_LURAH").slice(0, 5).map((a: any) => (
            <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 border-orange-200 p-3.5">
              <span className="text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber} <span className="font-normal text-[#7a6f6a]">— {a.ownerName}</span></span>
              <span className="ml-auto flex gap-1.5"><PriorityBadge isPriority={a.isPriority} priorityStatus={a.priorityStatus} /><StatusBadge status={a.status} /></span>
            </Link>
          ))}
          {apps.filter((a: any) => a.status === "MENUNGGU_LURAH").length === 0 && <div className="card-soft p-5 text-sm text-[#7a6f6a]">Tidak ada antrean. 🎉</div>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/akuntabilitas" className="btn-primary rounded-xl px-4 py-2.5 text-[13px] font-bold">Akuntabilitas SLA</Link>
        <Link href="/laporan" className="rounded-xl border border-[#5f3d4e] px-4 py-2.5 text-[13px] font-bold text-[#5f3d4e]">Laporan Pelayanan</Link>
        <Link href="/petugas" className="rounded-xl border border-[#e2c9b8] bg-white px-4 py-2.5 text-[13px] font-bold">Kelola Petugas</Link>
      </div>
    </div>
  );
}

function CamatDash({ apps }: any) {
  const waiting = apps.filter((a: any) => a.status === "MENUNGGU_CAMAT");
  return (
    <div className="space-y-4">
      <div className="card-blush rounded-[20px] p-6">
        <p className="font-extrabold">Persetujuan Camat (khusus Ahli Waris): {waiting.length} menunggu</p>
        <p className="text-[13px]">Anda hanya berwenang pada pengajuan yang memerlukan persetujuan Camat.</p>
        <Link href="/persetujuan" className="btn-primary mt-3 inline-block rounded-xl px-5 py-2.5 text-sm font-bold">Buka Persetujuan →</Link>
      </div>
      {waiting.map((a: any) => (
        <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 p-4">
          <span className="text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</span>
          <span className="ml-auto"><StatusBadge status={a.status} /></span>
        </Link>
      ))}
    </div>
  );
}
