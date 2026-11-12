"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Skeleton, EmptyState } from "@/components/ui";
import { formatDateWIB } from "@/lib/sla";

export default function PersetujuanPage() {
  const { me, loading, err } = useMe(["RT_RW", "LURAH", "CAMAT"]);
  const [apps, setApps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState("waiting");

  useEffect(() => {
    if (!me) return;
    mockApiFetch("/api/applications").then((r) => parseJsonResponse(r)).then((j) => {
      setApps(j.applications ?? []);
      setFetching(false);
    });
  }, [me]);

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  if (err) return <div className="grid min-h-screen place-items-center bg-[#f4e9de] p-4"><div className="card-soft max-w-md p-6 text-center"><p className="font-bold">{err}</p><Link href="/dashboard" className="font-bold text-[#c06b4a]">← Dashboard</Link></div></div>;

  const needMap: Record<string, string> = { RT_RW: "MENUNGGU_RT_RW", LURAH: "MENUNGGU_LURAH", CAMAT: "MENUNGGU_CAMAT" };
  const waiting = apps.filter((a) => a.status === needMap[me.role]);
  const history = apps.filter((a) => a.status !== needMap[me.role]).slice(0, 20);
  const list = tab === "waiting" ? waiting : history;

  return (
    <AppShell user={me} title={me.role === "RT_RW" ? "Pengajuan Menunggu ACC" : me.role === "LURAH" ? "Persetujuan Surat" : "Persetujuan Camat"} subtitle={me.role === "CAMAT" ? "Khusus layanan yang memerlukan persetujuan Camat (Ahli Waris)." : "Setujui atau kembalikan dengan alasan tertulis. Semua tercatat."}>
      <div className="flex gap-2">
        <button onClick={() => setTab("waiting")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "waiting" ? "bg-[#5f3d4e] text-white" : "bg-white border border-[#e2c9b8]"}`}>Menunggu ({waiting.length})</button>
        <button onClick={() => setTab("history")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "history" ? "bg-[#5f3d4e] text-white" : "bg-white border border-[#e2c9b8]"}`}>Riwayat</button>
      </div>
      {fetching ? <div className="mt-3 space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        : list.length === 0 ? <div className="mt-3"><EmptyState title={tab === "waiting" ? "Tidak ada antrean" : "Belum ada riwayat"} desc="Semua clear. Notifikasi akan masuk saat ada pengajuan baru." /></div>
        : (
          <div className="mt-3 space-y-2.5">
            {list.map((a) => (
              <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex flex-col gap-2 p-4 hover:shadow-md sm:flex-row sm:items-center">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</span>
                  <span className="text-[12px] text-[#7a6f6a]">{a.ownerName} • {formatDateWIB(a.submittedAt)}</span>
                </span>
                <span className="flex gap-1.5 sm:ml-auto"><PriorityBadge isPriority={a.isPriority} priorityStatus={a.priorityStatus} /><StatusBadge status={a.status} /></span>
              </Link>
            ))}
          </div>
        )}
    </AppShell>
  );
}
