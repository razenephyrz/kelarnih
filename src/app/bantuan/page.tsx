import Link from "next/link";
import { PublicNav, PublicFooter } from "@/components/Public";

export default function BantuanPage() {
  const cards = [
    { t: "Mengajukan surat", d: "Pilih layanan → isi kondisional → unggah PDF/JPG/PNG → kirim.", href: "/layanan" },
    { t: "Memperbaiki dokumen", d: "Buka pengajuan Perlu Perbaikan → unggah berkas baru → kirim ulang.", href: "/tracking" },
    { t: "Melacak status", d: "Timeline + estimasi SLA + alasan keterlambatan transparan.", href: "/tracking" },
    { t: "Prioritas", d: "Khusus Domisili & Kematian, dengan bukti & keputusan tertulis.", href: "/faq" },
    { t: "Mengunduh surat", d: "Tombol unduh aktif setelah SELESAI (ber-watermark SIMULASI).", href: "/pengajuan" },
    { t: "Memberi rating", d: "Satu kali per pengajuan selesai: kecepatan/keramahan/kejelasan.", href: "/pengajuan" },
  ];
  return (
    <div className="min-h-screen bg-[#faf5ef]"><PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-[28px] font-extrabold">Pusat Bantuan</h1>
        <p className="text-sm text-[#7a6f6a]">Panduan penggunaan kelar.in (simulasi). Pilih topik di bawah.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.t} href={c.href} className="card-soft p-5 hover:shadow-lg">
              <p className="font-extrabold">{c.t}</p>
              <p className="mt-1 text-[13px] text-[#5f5752]">{c.d}</p>
              <p className="mt-2 text-[13px] font-bold text-[#c06b4a]">Pelajari →</p>
            </Link>
          ))}
        </div>
        <div className="card-soft mt-5 p-5 text-[13px] text-[#5f5752]">
          <p className="font-extrabold text-[#2b2320]">Butuh bantuan langsung? (simulasi)</p>
          <p className="mt-1">Kantor Kelurahan Contoh, Jl. Contoh No. 1 • Senin–Jumat 08.00–15.00 WIB • halo@kelar-in.demo • (021) 000-0000. Ini data simulasi, bukan kontak resmi.</p>
        </div>
      </main><PublicFooter /></div>
  );
}
