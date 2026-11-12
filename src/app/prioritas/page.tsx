"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton, EmptyState } from "@/components/ui";
import { formatWIB } from "@/lib/sla";

export default function PrioritasPage() {
  const { me, loading, err } = useMe(["PETUGAS"]);
  const [apps, setApps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  useEffect(() => {
    if (me) mockApiFetch("/api/applications").then((r) => parseJsonResponse(r)).then((j) => { setApps((j.applications ?? []).filter((a: any) => a.isPriority)); setFetching(false); });
  }, [me]);
  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  if (err) return <div className="grid min-h-screen place-items-center p-4"><div className="card-soft p-6">{err}</div></div>;
  const pending = apps.filter((a) => a.priorityStatus === "PENDING");
  const decided = apps.filter((a) => a.priorityStatus !== "PENDING");
  return (
    <AppShell user={me} title="Antrean Prioritas" subtitle="Hanya layanan prioritas-enabled (Domisili & Kematian). Keputusan wajib beralasan tertulis.">
      <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold"><Zap size={16} className="text-[#c06b4a]" /> Menunggu keputusan ({pending.length})</h2>
      {fetching ? <Skeleton className="mt-2 h-24" />
        : pending.length === 0 ? <div className="mt-2"><EmptyState title="Tidak ada permintaan pending" desc="Permintaan prioritas baru akan muncul di sini." /></div>
        : <div className="mt-2 space-y-2">{pending.map((a) => (
          <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft block border-orange-200 p-4">
            <p className="text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</p>
            <p className="text-[12px] text-[#7a6f6a]">{a.ownerName} • alasan: {a.priorityReason} • {formatWIB(a.submittedAt)}</p>
            <span className="mt-1 inline-block"><StatusBadge status={a.status} /></span>
          </Link>
        ))}</div>}
      <h2 className="mt-5 text-[15px] font-extrabold">Sudah diputuskan ({decided.length})</h2>
      <div className="mt-2 space-y-2">{decided.map((a) => (
        <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex items-center gap-3 p-3.5 opacity-90">
          <span className="text-[14px] font-bold">{a.serviceName} • {a.applicationNumber}</span>
          <span className={`badge ml-auto ${a.priorityStatus === "APPROVED" ? "badge-orange" : "badge-muted"}`}>{a.priorityStatus}</span>
        </Link>
      ))}</div>
    </AppShell>
  );
}
