"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Radar, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge } from "@/components/StatusBadge";
import { formatWIB } from "@/lib/sla";
import { timelineForStatus } from "@/lib/workflow";

export default function TrackingPage() {
  const { me, loading } = useMe();
  const [apps, setApps] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (me) mockApiFetch("/api/applications").then((r) => parseJsonResponse(r)).then((j) => {
      setApps(j.applications ?? []);
      if (j.applications?.[0]) select(j.applications[0]);
    });
  }, [me]);

  async function select(a: any) {
    setSelected(a);
    const r = await mockApiFetch(`/api/applications/${a.id}`);
    const j = await parseJsonResponse(r);
    setDetail(j);
  }

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  const filtered = apps.filter((a) => !q || (a.applicationNumber + a.serviceName).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell user={me} title="Tracking Pengajuan" subtitle="Pantau tahap, aktor, waktu & estimasi secara transparan.">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89a93]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor / layanan…" className="input-soft pl-10" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => select(a)} className={`w-full rounded-2xl border p-3.5 text-left ${selected?.id === a.id ? "border-[#5f3d4e] bg-white shadow-md" : "border-[#e9d5c6] bg-[#fffdfb]"}`}>
              <p className="truncate text-[14px] font-extrabold">{a.serviceName}</p>
              <p className="text-[12px] text-[#7a6f6a]">{a.applicationNumber}</p>
              <span className="mt-1 inline-block"><StatusBadge status={a.status} /></span>
            </button>
          ))}
          {filtered.length === 0 && <div className="card-soft p-6 text-center text-sm text-[#7a6f6a]">Tidak ada hasil.</div>}
        </div>
        <div className="lg:col-span-2">
          {!detail ? (
            <div className="card-soft grid place-items-center p-12 text-sm text-[#7a6f6a]"><Radar size={28} className="mb-2" /> Pilih pengajuan untuk melihat timeline.</div>
          ) : (
            <div className="card-soft p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold">{detail.application.serviceName} • {detail.application.applicationNumber}</p>
                <span className="ml-auto"><StatusBadge status={detail.application.status} /></span>
              </div>
              <p className="mt-1 text-[13px] text-[#7a6f6a]">Estimasi: {detail.application.dueAt ? formatWIB(detail.application.dueAt) : "setelah verifikasi"} {detail.application.delayReason ? `• ${detail.application.delayReason}` : ""}</p>
              {/* stepper */}
              <div className="mt-3 flex gap-1 overflow-x-auto no-scrollbar">
                {timelineForStatus(detail.application.status, detail.application.requiresCamat).map((step, i, arr) => {
                  const activeIdx = arr.findIndex((s) => {
                    const map: Record<string, string[]> = {
                      PENGAJUAN: ["MENUNGGU_VERIFIKASI"], VERIFIKASI: ["MENUNGGU_WARGA", "TERVERIFIKASI"],
                      PROSES: ["SEDANG_DIPROSES"], RT_RW: ["MENUNGGU_RT_RW"], LURAH: ["MENUNGGU_LURAH"],
                      CAMAT: ["MENUNGGU_CAMAT"], FINAL: ["FINALISASI"], SELESAI: ["SELESAI"],
                    };
                    return false;
                  });
                  return <span key={step} className="whitespace-nowrap rounded-full bg-[#faf5ef] px-3 py-1.5 text-[11px] font-bold text-[#5f3d4e]">{i + 1}. {step}</span>;
                })}
              </div>
              <div className="mt-4 space-y-0">
                {(detail.events ?? []).map((e: any, i: number, arr: any[]) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-[12px] font-black ${i === arr.length - 1 ? "bg-[#5f3d4e] text-white" : "bg-[#f7e8df]"}`}>{i + 1}</span>
                      {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-[#e9d5c6]" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-[13px] font-extrabold">{e.title}</p>
                      <p className="text-[12px] text-[#7a6f6a]">{e.actorName} • {formatWIB(e.createdAt)}</p>
                      {e.description && <p className="text-[13px] text-[#5f5752]">{e.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <Link href={`/pengajuan/${detail.application.id}`} className="mt-2 inline-block text-[13px] font-bold text-[#c06b4a]">Buka detail lengkap →</Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
