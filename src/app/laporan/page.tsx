"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { formatDateWIB } from "@/lib/sla";
import { STATUS_LABEL } from "@/lib/workflow";

export default function LaporanPage() {
  const { me, loading, err } = useMe(["LURAH", "PETUGAS"]);
  const [stats, setStats] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  useEffect(() => {
    if (!me) return;
    mockApiFetch("/api/dashboard/stats?range=all").then((r) => parseJsonResponse(r)).then(setStats);
    mockApiFetch("/api/applications").then((r) => parseJsonResponse(r)).then((j) => setApps(j.applications ?? []));
  }, [me]);
  if (loading || !me) return <div className="grid min-h-screen place-items-center">Memuat…</div>;
  if (err) return <div className="grid min-h-screen place-items-center p-4"><div className="card-soft p-6">{err}</div></div>;

  function exportCsv() {
    const rows = [["Nomor", "Layanan", "Pemohon", "Status", "Prioritas", "Diajukan", "Estimasi", "Selesai", "Keterlambatan"]];
    for (const a of apps) rows.push([a.applicationNumber, a.serviceName, a.ownerName, STATUS_LABEL[a.status] ?? a.status, a.isPriority ? `${a.priorityStatus}` : "-", formatDateWIB(a.submittedAt), a.dueAt ? formatDateWIB(a.dueAt) : "-", a.completedAt ? formatDateWIB(a.completedAt) : "-", a.delayReason ?? ""]);
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = "laporan-kelarin.csv"; el.click();
  }

  function printReport() { window.print(); }

  const s = stats?.summary ?? {};
  return (
    <AppShell user={me} title="Laporan Pelayanan" subtitle="Rekap untuk monitoring lurah. Unduh CSV atau cetak.">
      <div className="card-soft grid gap-3 p-5 sm:grid-cols-4">
        {[["Total", s.total ?? 0], ["Selesai", s.selesai ?? 0], ["Tepat waktu", `${s.onTimePct ?? 0}%`], ["Rata-rata", `${s.avgDays ?? 0} hari`]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl bg-[#faf5ef] p-4 text-center"><p className="text-xl font-extrabold">{v}</p><p className="text-[12px] font-bold text-[#7a6f6a]">{l}</p></div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={exportCsv} className="btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold"><Download size={15} /> Unduh CSV</button>
        <button onClick={printReport} className="rounded-xl border border-[#5f3d4e] px-4 py-2.5 text-[13px] font-bold text-[#5f3d4e]">Cetak</button>
      </div>
      <div className="card-soft mt-3 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead><tr className="border-b border-[#e9d5c6] bg-[#faf5ef] text-left text-[12px] uppercase text-[#7a6f6a]">
            <th className="px-4 py-3">Nomor</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Pemohon</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Estimasi</th><th className="px-4 py-3">Keterlambatan</th>
          </tr></thead>
          <tbody>
            {apps.slice(0, 50).map((a) => (
              <tr key={a.id} className="border-b border-[#f4e9de]">
                <td className="px-4 py-2.5 font-bold">{a.applicationNumber}</td>
                <td className="px-4 py-2.5">{a.serviceName}</td>
                <td className="px-4 py-2.5">{a.ownerName}</td>
                <td className="px-4 py-2.5">{STATUS_LABEL[a.status]}</td>
                <td className="px-4 py-2.5">{a.dueAt ? formatDateWIB(a.dueAt) : "-"}</td>
                <td className="px-4 py-2.5 text-[#991b1b]">{a.delayReason ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-[#7a6f6a]">Menampilkan 50 terbaru • total {apps.length} • data simulasi.</p>
    </AppShell>
  );
}
