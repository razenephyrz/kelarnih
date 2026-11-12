"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Clock, FileCheck2, BellRing, ChevronDown, ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/Public";

type Svc = { id: string; slug: string; name: string; description: string; category: string; baseSlaDays: number; priorityEnabled: boolean; requirements: any[] };

export default function Landing() {
  const [services, setServices] = useState<Svc[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    mockApiFetch("/api/services").then((r) => parseJsonResponse(r)).then((j) => { setServices(j.services ?? []); setCats(j.categories ?? []); }).catch(() => {});
  }, []);

  const filtered = services.filter((s) => {
    if (cat && s.category !== cat) return false;
    if (q && !(s.name + " " + s.description).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const faqs = [
    { q: "Bagaimana cara mengajukan surat?", a: "Login sebagai warga → menu Buat Pengajuan → pilih layanan → lengkapi formulir & unggah persyaratan (PDF/JPG/PNG maks 5 MB) → kirim. Anda akan menerima ID pengajuan unik dan notifikasi status." },
    { q: "Apa yang terjadi jika dokumen saya kurang?", a: "Petugas akan mengembalikan pengajuan ke status Perlu Perbaikan beserta alasan. SLA dijeda (tidak dihitung) hingga Anda mengunggah perbaikan dan dokumen terverifikasi. Riwayat perbaikan tercatat." },
    { q: "Kapan estimasi pelayanan mulai dihitung?", a: "SLA hanya berjalan setelah dokumen terverifikasi (verified_at). Waktu saat menunggu kelengkapan dari warga tidak dihitung. Estimasi = SLA dasar + tahap approval + penyesuaian antrean, memakai hari kerja Senin–Jumat (ilustratif)." },
    { q: "Bagaimana cara mengetahui status pengajuan?", a: "Buka menu Tracking atau Pengajuan Saya, klik pengajuan untuk melihat timeline lengkap: tahap, waktu, aktor, catatan, tahap aktif & tahap selanjutnya. Setiap perubahan status juga mengirim notifikasi." },
    { q: "Apakah saya bisa meminta pengajuan prioritas?", a: "Ya, khusus layanan yang dikonfigurasi bisa dipercepat (default: Domisili & Kematian). Pilih alasan (duka/medis/sekolah/ hukum/lainnya); sebagian alasan mewajibkan bukti. Petugas menyetujui/menolak dengan alasan tertulis. Target prioritas ilustratif: hari ini sebelum 15.00." },
    { q: "Apakah surat yang diunduh dokumen resmi?", a: "Tidak. Seluruh surat pada demo ini ber-watermark SIMULASI / BUKAN DOKUMEN RESMI dan tidak memiliki tanda tangan elektronik maupun integrasi pemerintah." },
  ];

  return (
    <div className="min-h-screen bg-[#faf5ef]">
      <PublicNav />
      {/* Hero */}
      <section id="beranda" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-2 lg:pt-16">
          <div className="animate-fade">
            <span className="badge badge-mauve">Pelayanan Kelurahan • Transparan & Terpantau</span>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight text-[#2b2320]">
              Urus Administrasi Kelurahan, <span className="text-[#c06b4a]">Lebih Mudah</span> dan Transparan.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#5f5752]">
              Ajukan surat secara digital, lengkapi persyaratan, dan pantau proses pelayanan tanpa harus terus-menerus datang ke kantor kelurahan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pengajuan/baru" className="btn-terra rounded-2xl px-6 py-3.5 text-[15px] font-extrabold shadow-lg">Ajukan Layanan <ArrowRight size={16} className="ml-1 inline" /></Link>
              <Link href="#cara-kerja" className="rounded-2xl border-2 border-[#5f3d4e] px-6 py-3.5 text-[15px] font-extrabold text-[#5f3d4e]">Lihat Cara Kerja</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-[13px] font-bold text-[#5f3d4e]">
              <span className="flex items-center gap-1.5"><Clock size={15} /> SLA transparan</span>
              <span className="flex items-center gap-1.5"><BellRing size={15} /> Notifikasi tiap tahap</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Approval berjenjang</span>
            </div>
            <p className="mt-4 text-[12px] text-[#a89a93]">Akun demo — warga@kelar.in / warga123 • petugas@kelar.in / petugas123 • rtrw@kelar.in / rtrw123 • lurah@kelar.in / lurah123 • camat@kelar.in / camat123</p>
          </div>
          {/* Visual dashboard mock */}
          <div className="animate-fade">
            <div className="hero-plum rounded-[24px] p-5 text-white shadow-2xl sm:p-6">
              <p className="text-[13px] font-bold text-white/70">Dashboard layanan publik Kelurahan Contoh</p>
              <p className="mt-2 text-[15px] text-white/85">Selamat Datang, <span className="text-[26px] font-extrabold text-white">Ibna</span></p>
              <p className="text-[13px] text-white/70">Semoga harimu menyenangkan</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <p className="text-[13px] font-extrabold">Pengajuan Terbaru</p>
                  {[["Domisili", "Menunggu Verifikasi", "amber"], ["Kematian", "Sedang Diproses", "blue"], ["SKTM", "Selesai", "green"]].map(([n, s, _t], i) => (
                    <div key={i} className="mt-2 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-[12px] font-bold">
                      <FileCheck2 size={14} /> {n} <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-[#f7e8df] p-4 text-[#2b2320]">
                  <p className="text-[13px] font-extrabold">Edukasi Terkait</p>
                  <div className="mt-2 flex gap-1.5 text-[11px] font-bold">
                    {["KTP", "KK", "Pengantar RT"].map((t) => <span key={t} className="rounded-full bg-white px-2 py-1 shadow">{t}</span>)}
                  </div>
                  <ul className="mt-2 space-y-1 bg-[#2b2320] rounded-xl p-3 text-[12px] text-white">
                    <li>☑ KTP-el</li><li>☑ KK</li><li>☐ Surat pernyataan bermaterai</li>
                  </ul>
                  <p className="mt-2 text-[12px] font-bold">Estimasi: 2 Hari <span className="font-normal text-[#7a6f6a]">• SLA setelah verifikasi</span></p>
                  <Link href="/layanan" className="btn-terra mt-2 inline-block rounded-xl px-3 py-1.5 text-[12px] font-bold">Ajukan Pengajuan</Link>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[["87%", "Tepat waktu"], ["1,6 hr", "Rata-rata"], ["4,5/5", "Rating"]].map(([v, l]) => (
                <div key={l} className="card-soft p-3 text-center"><p className="text-lg font-extrabold text-[#5f3d4e]">{v}</p><p className="text-[11px] font-bold text-[#7a6f6a]">{l} • ilustratif</p></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h2 className="text-[24px] font-extrabold tracking-tight">Daftar Layanan</h2>
            <p className="mt-1 text-sm text-[#7a6f6a]">Sembilan layanan keterangan • persyaratan dari konfigurasi layanan • estimasi ilustratif hari kerja.</p>
          </div>
          <Link href="/layanan" className="ml-auto text-sm font-bold text-[#c06b4a] hover:underline">Lihat semua →</Link>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89a93]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari layanan, mis. domisili, usaha, kematian…" className="input-soft pl-10" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input-soft sm:w-56">
            <option value="">Semua kategori</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="card-soft mt-4 p-8 text-center text-sm text-[#7a6f6a]">Tidak ada layanan yang cocok. Coba kata kunci lain.</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 6).map((s) => (
              <article key={s.slug} className="card-soft flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7e8df] text-lg">📄</span>
                  <div>
                    <h3 className="text-[15px] font-extrabold leading-tight">{s.name}</h3>
                    <p className="text-[11px] font-bold text-[#a8552f]">{s.category} • ±{s.baseSlaDays} hari kerja</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] text-[#5f5752]">{s.description}</p>
                <p className="mt-2 text-[12px] text-[#7a6f6a]">Syarat utama: {s.requirements.slice(0, 3).map((r: any) => r.name).join(", ")}{s.requirements.length > 3 ? "…" : ""}</p>
                <div className="mt-3 flex gap-2">
                  <Link href={`/layanan/${s.slug}`} className="flex-1 rounded-xl border border-[#5f3d4e] px-3 py-2 text-center text-[13px] font-bold text-[#5f3d4e]">Lihat Persyaratan</Link>
                  <Link href={`/pengajuan/baru?layanan=${s.slug}`} className="btn-terra flex-1 rounded-xl px-3 py-2 text-center text-[13px] font-bold">Ajukan</Link>
                </div>
                {s.priorityEnabled && <span className="badge badge-orange mt-2 w-fit"><Zap size={12} /> Bisa prioritas</span>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="border-y border-[#e5cbb8] bg-[#f4e9de]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-[24px] font-extrabold tracking-tight">Cara Kerja</h2>
          <p className="mt-1 text-sm text-[#7a6f6a]">Empat langkah dari pengajuan hingga surat terbit.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["1", "Pilih layanan", "Telusuri katalog, baca persyaratan & estimasi transparan."],
              ["2", "Lengkapi formulir & dokumen", "Jawab pertanyaan kondisional, unggah PDF/JPG/PNG. Validasi server."],
              ["3", "Verifikasi & persetujuan", "Petugas verifikasi → proses → RT/RW → Lurah (→ Camat khusus ahli waris)."],
              ["4", "Unduh surat", "Setelah diterbitkan (SIMULASI), unduh & beri rating pelayanan."],
            ].map(([n, t, d]) => (
              <div key={n} className="card-soft relative p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#5f3d4e] text-sm font-extrabold text-white">{n}</span>
                <h3 className="mt-3 text-[15px] font-extrabold">{t}</h3>
                <p className="mt-1 text-[13px] text-[#5f5752]">{d}</p>
              </div>
            ))}
          </div>
          {/* Transparency */}
          <div className="card-soft mt-6 grid gap-4 p-6 md:grid-cols-2">
            <div>
              <h3 className="text-[16px] font-extrabold">Transparansi SLA</h3>
              <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#5f5752]">
                <li><b>Estimasi =</b> SLA dasar + tahap approval + penyesuaian antrean (dapat diubah tanpa ubah kode via konfigurasi).</li>
                <li><b>SLA mulai berjalan</b> saat <i>verified_at</i> (dokumen terverifikasi), bukan saat kirim.</li>
                <li><b>Keterlambatan:</b> sistem menghitung estimasi baru + alasan wajib, tercatat di audit log & dashboard akuntabilitas.</li>
                <li><b>Zona waktu Asia/Jakarta,</b> hari kerja Senin–Jumat (ilustratif untuk demo).</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-[#2b2320] p-5 text-[13px] text-white">
              <p className="font-extrabold text-[#e9b48c]">Contoh transparansi</p>
              <p className="mt-2">“Estimasi diperbarui karena menunggu tanda tangan lurah.”</p>
              <p className="mt-2 text-white/70">Warga melihat alasan, waktu perubahan, dan estimasi baru pada timeline — tidak diubah diam-diam.</p>
              <div className="mt-3 flex items-center gap-1 text-[#ffd166]"><Star size={14} /> Rating & akuntabilitas dihitung dari database, bukan hardcode.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-[24px] font-extrabold tracking-tight">Pertanyaan Umum</h2>
        <div className="mt-4 space-y-2.5">
          {faqs.map((f, i) => (
            <div key={i} className="card-soft overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <span className="flex-1 text-[14px] font-extrabold">{f.q}</span>
                <ChevronDown size={18} className={`shrink-0 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="border-t border-[#e9d5c6] px-5 py-4 text-[13px] leading-relaxed text-[#5f5752]">{f.a}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/faq" className="rounded-xl border border-[#5f3d4e] px-5 py-2.5 text-sm font-bold text-[#5f3d4e]">Buka halaman FAQ</Link>
          <Link href="/login" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold">Login untuk mengajukan</Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
