"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/Public";

const FAQS = [
  { q: "Bagaimana cara mengajukan surat?", a: "Login sebagai warga, buka Buat Pengajuan, pilih layanan, isi formulir & unggah persyaratan, lalu kirim. Sistem membuat ID pengajuan unik dan notifikasi." },
  { q: "Apa yang terjadi jika dokumen saya kurang?", a: "Petugas mengembalikan ke status Perlu Perbaikan (MENUNGGU_WARGA) dengan alasan. SLA dijeda. Unggah perbaikan via detail pengajuan, lalu kirim ulang untuk verifikasi." },
  { q: "Kapan estimasi pelayanan mulai dihitung?", a: "Sejak verified_at (dokumen terverifikasi). Rumus ilustratif: SLA dasar + tahap approval + penyesuaian antrean, hari kerja Senin–Jumat, zona Asia/Jakarta." },
  { q: "Bagaimana cara mengetahui status pengajuan?", a: "Menu Tracking / Pengajuan Saya → klik pengajuan → timeline menampilkan tahap, waktu, aktor, catatan, tahap aktif & selanjutnya." },
  { q: "Apakah saya bisa meminta pengajuan prioritas?", a: "Hanya untuk layanan prioritas-enabled (Domisili & Kematian). Pilih alasan; duka/medis/sekolah wajib bukti. Petugas menyetujui/menolak dengan alasan tertulis. Target ilustratif: hari ini sebelum 15.00." },
  { q: "Bagaimana jika estimasi berubah?", a: "Petugas/lurah wajib memberi alasan (mis. menunggu tanda tangan lurah). Perubahan tercatat di audit log, notifikasi, dan dashboard akuntabilitas. Tidak diubah diam-diam." },
  { q: "Apakah surat unduhan resmi?", a: "Bukan. Semua surat demo ber-watermark SIMULASI / BUKAN DOKUMEN RESMI tanpa tanda tangan elektronik resmi." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const filtered = FAQS.filter((f) => !q || (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="min-h-screen bg-[#faf5ef]"><PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-[28px] font-extrabold">FAQ</h1>
        <p className="text-sm text-[#7a6f6a]">Jawaban atas pertanyaan umum seputar alur kelar.in (data simulasi).</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pertanyaan…" className="input-soft mt-4" />
        <div className="mt-4 space-y-2.5">
          {filtered.map((f, i) => (
            <div key={i} className="card-soft overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <span className="flex-1 text-[14px] font-extrabold">{f.q}</span>
                <ChevronDown size={18} className={open === i ? "rotate-180" : ""} />
              </button>
              {open === i && <p className="border-t border-[#e9d5c6] px-5 py-4 text-[13px] leading-relaxed text-[#5f5752]">{f.a}</p>}
            </div>
          ))}
          {filtered.length === 0 && <div className="card-soft p-6 text-center text-sm text-[#7a6f6a]">Tidak ada hasil untuk “{q}”.</div>}
        </div>
        <Link href="/bantuan" className="mt-4 inline-block text-sm font-bold text-[#c06b4a] hover:underline">← Ke Pusat Bantuan</Link>
      </main><PublicFooter /></div>
  );
}
