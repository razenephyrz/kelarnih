"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { Skeleton } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/workflow";

const TONE: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "#d97706", MENUNGGU_WARGA: "#b3261e", TERVERIFIKASI: "#2563eb",
  SEDANG_DIPROSES: "#7d5a6b", MENUNGGU_RT_RW: "#c06b4a", MENUNGGU_LURAH: "#c06b4a",
  MENUNGGU_CAMAT: "#c06b4a", FINALISASI: "#7d5a6b", SELESAI: "#15803d", DITOLAK: "#991b1b",
};

export default function AkuntabilitasPage() {
  const { me, loading } = useMe();
  const [stats, setStats] = useState<any>(null);
  const [range, setRange] = useState("6m");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!me) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setFetching(true);
      mockApiFetch(`/api/dashboard/stats?range=${range}`).then((r) => parseJsonResponse(r)).then((j) => {
        if (active) { setStats(j); setFetching(false); }
      });
    });
    return () => { active = false; };
  }, [me, range]);

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  const s = stats?.summary ?? {};

  return (
    <AppShell user={me} title="Akuntabilitas Pelayanan" subtitle="Seluruh angka dihitung dari database (agregasi live), bukan hardcode. Contoh ilustratif untuk demo.">
      <div className="flex gap-2">
        {[["1m", "1 bln"], ["3m", "3 bln"], ["6m", "6 bln"], ["12m", "12 bln"]].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)} className={`rounded-xl px-4 py-2 text-[13px] font-bold ${range === v ? "bg-[#5f3d4e] text-white" : "border border-[#e2c9b8] bg-white"}`}>{l}</button>
        ))}
      </div>
      {fetching ? <div className="mt-4 grid gap-3 sm:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-soft p-4"><p className="text-[28px] font-extrabold text-[#5f3d4e]">{s.onTimePct ?? 0}%</p><p className="text-[13px] font-bold">Tepat waktu</p><p className={`text-[12px] font-bold ${(s.delta ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{(s.delta ?? 0) >= 0 ? "▲" : "▼"} {(s.delta ?? 0)}% vs 30 hari sebelumnya</p></div>
            <div className="card-soft p-4"><p className="text-[28px] font-extrabold text-[#5f3d4e]">{s.avgDays ?? 0} hari</p><p className="text-[13px] font-bold">Rata-rata proses</p><p className="text-[12px] text-[#7a6f6a]">verified → completed</p></div>
            <div className="card-soft p-4"><p className="flex items-center gap-1 text-[28px] font-extrabold text-[#5f3d4e]"><Star size={22} className="fill-amber-400 text-amber-400" /> {s.lurahAvg ?? 0}/5</p><p className="text-[13px] font-bold">Rating Lurah ({s.lurahCount ?? 0} penilaian)</p><p className="text-[12px] text-[#7a6f6a]">Selalu tampil dengan jumlah penilai</p></div>
            <div className="card-soft p-4"><p className="flex items-center gap-1 text-[28px] font-extrabold text-[#5f3d4e]"><Star size={22} className="fill-amber-400 text-amber-400" /> {s.ratingAvg ?? 0}/5</p><p className="text-[13px] font-bold">Rating layanan ({s.ratingCount ?? 0})</p><p className="text-[12px] text-[#7a6f6a]">{s.selesai ?? 0} selesai • {s.terlambat ?? 0} terlambat • {s.priorityCount ?? 0} prioritas</p></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Trend */}
            <div className="card-soft p-5">
              <p className="font-extrabold">Tren pengajuan per bulan</p>
              <p className="text-[12px] text-[#7a6f6a]">Periode {range} • tooltip: total vs selesai</p>
              <div className="mt-3 flex h-44 items-end gap-2">
                {(stats?.trend ?? []).map((t: any) => {
                  const max = Math.max(1, ...(stats?.trend ?? []).map((x: any) => x.total));
                  return (
                    <div key={t.month} className="flex flex-1 flex-col items-center gap-1" title={`${t.month}: ${t.total} pengajuan, ${t.selesai} selesai`}>
                      <span className="text-[10px] font-bold">{t.total}</span>
                      <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 120 }}>
                        <div className="w-1/2 rounded-t-lg bg-[#c9a0a0]" style={{ height: `${(t.total / max) * 100}%` }} />
                        <div className="w-1/2 rounded-t-lg bg-[#5f3d4e]" style={{ height: `${(t.selesai / max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-[#7a6f6a]">{t.month}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[12px]"><span className="mr-3">■ <span className="text-[#c9a0a0]">■</span> Total</span> ■ <span className="text-[#5f3d4e]">■</span> Selesai</p>
            </div>
            {/* Status dist */}
            <div className="card-soft p-5">
              <p className="font-extrabold">Distribusi status</p>
              <p className="text-[12px] text-[#7a6f6a]">Periode {range}</p>
              <div className="mt-3 space-y-2">
                {(stats?.statusDist ?? []).map((d: any) => {
                  const max = Math.max(1, ...(stats?.statusDist ?? []).map((x: any) => x.count));
                  return (
                    <div key={d.status} title={`${STATUS_LABEL[d.status]}: ${d.count}`}>
                      <div className="flex justify-between text-[12px] font-bold"><span>{STATUS_LABEL[d.status] ?? d.status}</span><span>{d.count}</span></div>
                      <div className="mt-0.5 h-2.5 rounded-full bg-[#f4e9de]"><div className="h-2.5 rounded-full" style={{ width: `${(d.count / max) * 100}%`, background: TONE[d.status] ?? "#999" }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Avg per service */}
            <div className="card-soft p-5">
              <p className="font-extrabold">Rata-rata penyelesaian per layanan</p>
              <div className="mt-3 space-y-2">
                {(stats?.perService ?? []).map((p: any) => (
                  <div key={p.slug} title={`${p.name}: ${p.avgDays} hari dari ${p.count} selesai`}>
                    <div className="flex justify-between text-[12px] font-bold"><span className="truncate">{p.name} ({p.count})</span><span>{p.avgDays} hr</span></div>
                    <div className="mt-0.5 h-2.5 rounded-full bg-[#f4e9de]"><div className="h-2.5 rounded-full bg-[#c06b4a]" style={{ width: `${Math.min(100, (p.avgDays / 7) * 100)}%` }} /></div>
                  </div>
                ))}
                {(stats?.perService ?? []).length === 0 && <p className="text-sm text-[#7a6f6a]">Belum ada data selesai.</p>}
              </div>
            </div>
            {/* Rating */}
            <div className="card-soft p-5">
              <p className="font-extrabold">Rating pelayanan</p>
              <div className="mt-3 space-y-1.5">
                {(stats?.ratingDist ?? []).map((d: any) => {
                  const total = (stats?.ratingDist ?? []).reduce((a: number, x: any) => a + x.count, 0) || 1;
                  return (
                    <div key={d.stars} className="flex items-center gap-2 text-[12px] font-bold">
                      <span className="w-8">{d.stars}★</span>
                      <div className="h-2.5 flex-1 rounded-full bg-[#f4e9de]"><div className="h-2.5 rounded-full bg-amber-400" style={{ width: `${(d.count / total) * 100}%` }} /></div>
                      <span className="w-8 text-right">{d.count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {Object.entries(stats?.ratingByCat ?? {}).map(([k, v]: any) => (
                  <div key={k} className="rounded-xl bg-[#faf5ef] p-2.5"><p className="text-[15px] font-extrabold">{v.avg}/5</p><p className="text-[10px] font-bold text-[#7a6f6a]">{k} ({v.count})</p></div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#7a6f6a]">Rating rendah akibat dokumen tak lengkap diberi label konteks “dokumen sempat dikembalikan”.</p>
            </div>
          </div>

          {/* Late list */}
          <div className="card-soft p-5">
            <p className="font-extrabold">Keterlambatan & penyebab ({(stats?.lateList ?? []).length})</p>
            {(stats?.lateList ?? []).length === 0 ? <p className="mt-1 text-sm text-[#7a6f6a]">Tidak ada yang terlambat pada periode ini. 🎉</p> : (
              <div className="mt-2 space-y-1.5">
                {(stats?.lateList ?? []).map((a: any) => (
                  <div key={a.id} className="rounded-xl bg-red-50 p-3 text-[13px]"><b>{a.serviceName} • {a.applicationNumber}</b> — {a.delayReason ?? "belum ada alasan, segera perbarui estimasi"}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
