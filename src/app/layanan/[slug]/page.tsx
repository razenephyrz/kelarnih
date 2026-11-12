"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Clock, Zap, Info } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/Public";

export default function LayananDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [svc, setSvc] = useState<any>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    mockApiFetch(`/api/services/${slug}`).then(async (r) => {
      const j = await parseJsonResponse(r);
      if (!r.ok) setErr(j.error ?? "Tidak ditemukan");
      else setSvc(j.service);
    });
  }, [slug]);
  if (err) return <div className="min-h-screen bg-[#faf5ef]"><PublicNav /><main className="mx-auto max-w-2xl px-4 py-16 text-center"><p className="font-bold">{err}</p><Link href="/layanan" className="text-[#c06b4a] font-bold">← Kembali</Link></main><PublicFooter /></div>;
  if (!svc) return <div className="min-h-screen bg-[#faf5ef]"><PublicNav /><main className="mx-auto max-w-3xl px-4 py-10"><div className="skeleton h-64 w-full" /></main><PublicFooter /></div>;
  return (
    <div className="min-h-screen bg-[#faf5ef]">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/layanan" className="flex items-center gap-1 text-sm font-bold text-[#5f3d4e]"><ArrowLeft size={16} /> Semua layanan</Link>
        <h1 className="mt-3 text-[28px] font-extrabold tracking-tight">{svc.name}</h1>
        <p className="mt-1 text-sm text-[#7a6f6a]">{svc.category} • {svc.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge badge-blue"><Clock size={12} /> Estimasi ±{svc.baseSlaDays} hari kerja (ilustratif)</span>
          {svc.priorityEnabled && <span className="badge badge-orange"><Zap size={12} /> Bisa prioritas (±{svc.prioritySlaDays} hari)</span>}
          {svc.requiresCamat && <span className="badge badge-mauve">Memerlukan persetujuan Camat</span>}
        </div>
        <div className="card-soft mt-5 flex gap-2.5 p-4 text-[13px] text-[#5f5752]">
          <Info size={18} className="mt-0.5 shrink-0 text-[#c06b4a]" />
          <p>SLA mulai dihitung <b>setelah dokumen terverifikasi</b>. Waktu menunggu kelengkapan dari warga dijeda dan tidak dihitung. Estimasi memakai hari kerja Senin–Jumat, zona Asia/Jakarta.</p>
        </div>
        <h2 className="mt-6 text-lg font-extrabold">Persyaratan</h2>
        <div className="mt-3 space-y-2.5">
          {(svc.requirements ?? []).map((r: any) => (
            <div key={r.key} className="card-soft p-4">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-extrabold">{r.name}</p>
                <span className={`badge ml-auto ${r.requirementType === "WAJIB" ? "badge-red" : r.requirementType === "KONDISIONAL" ? "badge-amber" : "badge-muted"}`}>{r.requirementType}</span>
              </div>
              {r.description && <p className="mt-1 text-[13px] text-[#5f5752]">{r.description}</p>}
              {r.whyNeeded && <p className="mt-1 text-[12px] text-[#7a6f6a]">Mengapa dibutuhkan: {r.whyNeeded}</p>}
              {r.requirementType === "KONDISIONAL" && <p className="mt-1 text-[12px] font-bold text-[#a8552f]">Hanya jika {r.conditionField} = {(r.conditionValues ?? []).join(" / ")}</p>}
            </div>
          ))}
        </div>
        {svc.conditions?.length > 0 && (
          <div className="card-soft mt-4 p-4">
            <p className="text-sm font-extrabold">Pertanyaan kondisional pada formulir</p>
            <ul className="mt-1 text-[13px] text-[#5f5752]">
              {(svc.conditions as any[]).map((c: any, i: number) => <li key={i}>• {c.label} ({(c.options ?? []).join(" / ")})</li>)}
            </ul>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Link href={`/pengajuan/baru?layanan=${svc.slug}`} className="btn-terra flex-1 rounded-2xl px-5 py-3.5 text-center text-[15px] font-extrabold">Ajukan Sekarang</Link>
        </div>
        <p className="mt-3 text-[12px] text-[#a89a93]">Format: PDF/JPG/JPEG/PNG, maks 5 MB per file. Dokumen kondisional hanya diminta bila relevan.</p>
      </main>
      <PublicFooter />
    </div>
  );
}
