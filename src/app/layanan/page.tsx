"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Zap } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/Public";

export default function LayananPage() {
  const [services, setServices] = useState<any[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  useEffect(() => {
    mockApiFetch("/api/services").then((r) => parseJsonResponse(r)).then((j) => { setServices(j.services ?? []); setCats(j.categories ?? []); });
  }, []);
  const filtered = services.filter((s) => {
    if (cat && s.category !== cat) return false;
    if (q && !(s.name + " " + s.description).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="min-h-screen bg-[#faf5ef]">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-[28px] font-extrabold tracking-tight">Daftar Layanan</h1>
        <p className="mt-1 text-sm text-[#7a6f6a]">Persyaratan berasal dari konfigurasi layanan di database. KTP/KK adalah syarat, bukan layanan tersendiri.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89a93]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari layanan…" className="input-soft pl-10" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input-soft sm:w-56">
            <option value="">Semua kategori</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <article key={s.slug} className="card-soft flex flex-col p-5">
              <h3 className="text-[15px] font-extrabold">{s.name}</h3>
              <p className="text-[11px] font-bold text-[#a8552f]">{s.category} • ±{s.baseSlaDays} hari kerja {s.requiresCamat ? "• via Camat" : ""}</p>
              <p className="mt-2 text-[13px] text-[#5f5752]">{s.description}</p>
              <ul className="mt-2 space-y-1 text-[12px] text-[#5f5752]">
                {s.requirements.slice(0, 4).map((r: any) => (
                  <li key={r.key}>• {r.name} <span className="text-[#a89a93]">({r.requirementType})</span></li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Link href={`/layanan/${s.slug}`} className="flex-1 rounded-xl border border-[#5f3d4e] px-3 py-2 text-center text-[13px] font-bold text-[#5f3d4e]">Lihat Persyaratan</Link>
                <Link href={`/pengajuan/baru?layanan=${s.slug}`} className="btn-terra flex-1 rounded-xl px-3 py-2 text-center text-[13px] font-bold">Ajukan</Link>
              </div>
              {s.priorityEnabled && <span className="badge badge-orange mt-2 w-fit"><Zap size={12} /> Bisa prioritas</span>}
            </article>
          ))}
        </div>
        {filtered.length === 0 && <div className="card-soft mt-4 p-8 text-center text-sm text-[#7a6f6a]">Tidak ada hasil. Coba kata kunci lain.</div>}
      </main>
      <PublicFooter />
    </div>
  );
}
