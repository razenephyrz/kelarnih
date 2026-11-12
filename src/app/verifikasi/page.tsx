"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton, EmptyState } from "@/components/ui";

export default function VerifikasiPage() {
  const { me, loading, err } = useMe(["PETUGAS"]);
  const [apps, setApps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState("MENUNGGU_VERIFIKASI");

  useEffect(() => {
    if (me) mockApiFetch("/api/applications").then((r) => parseJsonResponse(r)).then((j) => { setApps(j.applications ?? []); setFetching(false); });
  }, [me]);

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  if (err) return <div className="grid min-h-screen place-items-center p-4"><div className="card-soft p-6">{err}</div></div>;

  const tabs = [
    ["MENUNGGU_VERIFIKASI", "Perlu verifikasi"],
    ["TERVERIFIKASI", "Terverifikasi"],
    ["SEDANG_DIPROSES", "Diproses"],
    ["FINALISASI", "Finalisasi"],
  ];
  const list = apps.filter((a) => a.status === tab);

  return (
    <AppShell user={me} title="Verifikasi & Proses Surat" subtitle="Verifikasi berkas → proses → teruskan ke RT/RW → finalisasi. SLA mulai saat verifikasi.">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map(([v, l]) => {
          const c = apps.filter((a) => a.status === v).length;
          return <button key={v} onClick={() => setTab(v)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold ${tab === v ? "bg-[#5f3d4e] text-white" : "border border-[#e2c9b8] bg-white"}`}>{l} ({c})</button>;
        })}
      </div>
      {fetching ? <div className="mt-3 space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        : list.length === 0 ? <div className="mt-3"><EmptyState title="Tidak ada pada tahap ini" desc="Pilih tab lain atau tunggu pengajuan masuk." /></div>
        : (
          <div className="mt-3 space-y-2.5">
            {list.map((a) => (
              <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 p-4 hover:shadow-md">
                <span><span className="block text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</span><span className="text-[12px] text-[#7a6f6a]">{a.ownerName} {a.isPriority ? "• ⚡ Prioritas" : ""}</span></span>
                <span className="ml-auto"><StatusBadge status={a.status} /></span>
              </Link>
            ))}
          </div>
        )}
    </AppShell>
  );
}
