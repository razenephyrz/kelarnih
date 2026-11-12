"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { formatDateWIB } from "@/lib/sla";

export default function MonitoringPage() {
  const { me, loading, err } = useMe(["PETUGAS", "LURAH"]);
  const [stats, setStats] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!me) return;
    mockApiFetch("/api/dashboard/stats").then((r) => parseJsonResponse(r)).then(setStats);
    mockApiFetch("/api/applications").then((r) => parseJsonResponse(r)).then((j) => setApps(j.applications ?? []));
  }, [me]);
  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  if (err) return <div className="grid min-h-screen place-items-center p-4"><div className="card-soft p-6">{err}</div></div>;
  const filtered = status ? apps.filter((a) => a.status === status) : apps;
  const s = stats?.summary ?? {};
  return (
    <AppShell user={me} title="Monitoring Pengajuan" subtitle="Pantau seluruh antrean, keterlambatan & estimasi.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[["Total", s.total ?? apps.length], ["Selesai", s.selesai ?? 0], ["Terlambat", s.terlambat ?? 0], ["Prioritas", s.priorityCount ?? 0], ["Perlu verifikasi", s.needVerify ?? 0]].map(([l, v]) => (
          <div key={l as string} className="card-soft p-3.5 text-center"><p className="text-xl font-extrabold text-[#5f3d4e]">{v}</p><p className="text-[11px] font-bold text-[#7a6f6a]">{l}</p></div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-soft sm:w-64">
          <option value="">Semua status</option>
          {["MENUNGGU_VERIFIKASI", "MENUNGGU_WARGA", "TERVERIFIKASI", "SEDANG_DIPROSES", "MENUNGGU_RT_RW", "MENUNGGU_LURAH", "MENUNGGU_CAMAT", "FINALISASI", "SELESAI", "DITOLAK"].map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <div className="mt-3 space-y-2">
        {filtered.slice(0, 40).map((a) => (
          <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex flex-col gap-1.5 p-3.5 sm:flex-row sm:items-center">
            <span className="text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber} <span className="font-normal text-[#7a6f6a]">— {a.ownerName} • est. {a.dueAt ? formatDateWIB(a.dueAt) : "-"}</span></span>
            <span className="flex gap-1.5 sm:ml-auto"><PriorityBadge isPriority={a.isPriority} priorityStatus={a.priorityStatus} /><StatusBadge status={a.status} /></span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
