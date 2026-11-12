"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Search, FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Skeleton, EmptyState } from "@/components/ui";
import { formatDateWIB } from "@/lib/sla";

const ALL_STATUS = ["", "MENUNGGU_VERIFIKASI", "MENUNGGU_WARGA", "TERVERIFIKASI", "SEDANG_DIPROSES", "MENUNGGU_RT_RW", "MENUNGGU_LURAH", "MENUNGGU_CAMAT", "FINALISASI", "SELESAI", "DITOLAK"];

function Inner() {
  const { me, loading } = useMe();
  const sp = useSearchParams();
  const [apps, setApps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState("");

  async function load(query = q, st = status) {
    setFetching(true);
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (st) p.set("status", st);
    const r = await mockApiFetch(`/api/applications?${p.toString()}`);
    const j = await parseJsonResponse(r);
    setApps(j.applications ?? []);
    setFetching(false);
  }

  useEffect(() => {
    if (me) queueMicrotask(() => { void load(sp.get("q") ?? "", ""); });
    // eslint-disable-next-line
  }, [me]);

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;

  const titles: Record<string, [string, string]> = {
    WARGA: ["Pengajuan Saya", "Semua permohonan milik Anda. Klik untuk tracking, perbaikan, unduh & rating."],
    PETUGAS: ["Pengajuan Masuk", "Verifikasi, proses, kelola prioritas & finalisasi dari sini."],
    RT_RW: ["Riwayat & Persetujuan", "Pengajuan yang membutuhkan / pernah ditangani lingkungan."],
    LURAH: ["Monitoring Pengajuan", "Seluruh pengajuan warga untuk pemantauan."],
    CAMAT: ["Pengajuan Ahli Waris", "Hanya pengajuan yang memerlukan persetujuan Camat."],
  };
  const [title, sub] = titles[me.role] ?? titles.WARGA;

  return (
    <AppShell user={me} title={title} subtitle={sub}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89a93]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor / layanan / nama…" className="input-soft pl-10" />
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); load(q, e.target.value); }} className="input-soft sm:w-60">
          <option value="">Semua status</option>
          {ALL_STATUS.filter(Boolean).map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
        {me.role === "WARGA" && <Link href="/pengajuan/baru" className="btn-terra rounded-xl px-4 py-2.5 text-center text-sm font-bold"><FilePlus2 size={15} className="mr-1 inline" /> Buat</Link>}
      </div>

      {fetching ? (
        <div className="mt-4 space-y-2.5"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : apps.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Tidak ada pengajuan" desc={q || status ? "Coba ubah kata kunci atau filter status." : "Belum ada data pada filter ini."} action={me.role === "WARGA" ? <Link href="/pengajuan/baru" className="btn-terra rounded-xl px-5 py-2.5 text-sm font-bold">Buat Pengajuan</Link> : undefined} />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {apps.map((a) => (
            <Link key={a.id} href={`/pengajuan/${a.id}`} className="card-soft flex flex-col gap-2 p-4 hover:shadow-md sm:flex-row sm:items-center">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f7e8df] text-xl">📄</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-extrabold">{a.serviceName} • {a.applicationNumber}</span>
                <span className="block truncate text-[12px] text-[#7a6f6a]">{a.ownerName} • diajukan {formatDateWIB(a.submittedAt)} • estimasi {a.dueAt ? formatDateWIB(a.dueAt) : "setelah verifikasi"}</span>
              </span>
              <span className="flex shrink-0 flex-wrap gap-1.5 sm:ml-auto sm:justify-end">
                <PriorityBadge isPriority={a.isPriority} priorityStatus={a.priorityStatus} />
                <StatusBadge status={a.status} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function PengajuanList() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center">Memuat…</div>}><Inner /></Suspense>;
}
