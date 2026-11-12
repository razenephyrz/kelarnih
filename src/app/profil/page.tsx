"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { initials, parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";

export default function ProfilPage() {
  const { me, loading } = useMe();
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    mockApiFetch("/api/dashboard/stats").then((r) => parseJsonResponse(r)).then(setStats).catch(() => {});
  }, []);
  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  const roleLabel: Record<string, string> = { WARGA: "Warga", PETUGAS: "Petugas Kelurahan", RT_RW: "Ketua RT/RW", LURAH: "Lurah", CAMAT: "Camat" };
  return (
    <AppShell user={me} title="Profil" subtitle="Informasi akun Anda pada demo kelar.in.">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-soft p-6 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#5f3d4e] text-2xl font-black text-white">{initials(me.name)}</span>
          <p className="mt-3 text-lg font-extrabold">{me.name}</p>
          <p className="text-sm text-[#7a6f6a]">{me.email}</p>
          <span className="badge badge-mauve mt-2">{roleLabel[me.role] ?? me.role}</span>
          <div className="mt-4 rounded-2xl bg-[#faf5ef] p-3 text-left text-[13px]">
            <p>📞 {me.phone ?? "-"}</p>
            <p className="mt-1">📍 {me.address ?? "-"}</p>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="card-soft p-6">
            <p className="font-extrabold">Ringkasan aktivitas</p>
            {me.role === "WARGA" && stats?.mine ? (
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {[["Total", stats.mine.total], ["Selesai", stats.mine.selesai], ["Diproses", stats.mine.proses]].map(([l, v]) => (
                  <div key={l as string} className="rounded-2xl bg-[#faf5ef] p-4"><p className="text-2xl font-extrabold text-[#5f3d4e]">{v}</p><p className="text-[12px] font-bold text-[#7a6f6a]">{l}</p></div>
                ))}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {[["Total", stats?.summary?.total ?? 0], ["Selesai", stats?.summary?.selesai ?? 0], ["Terlambat", stats?.summary?.terlambat ?? 0]].map(([l, v]) => (
                  <div key={l as string} className="rounded-2xl bg-[#faf5ef] p-4"><p className="text-2xl font-extrabold text-[#5f3d4e]">{v}</p><p className="text-[12px] font-bold text-[#7a6f6a]">{l}</p></div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-2xl bg-[#2b2320] p-4 text-[13px] text-white">
              <p className="font-extrabold text-[#e9b48c]">Keamanan demo</p>
              <p className="mt-1 text-white/75">Password di-hash (bcrypt), sesi httpOnly, otorisasi per-role di server. Jangan unggah dokumen asli ke demo.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
