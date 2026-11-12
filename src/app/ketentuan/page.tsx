import { PublicNav, PublicFooter } from "@/components/Public";
export default function KetentuanPage() {
  return (
    <div className="min-h-screen bg-[#faf5ef]"><PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-[28px] font-extrabold">Ketentuan Penggunaan (simulasi)</h1>
        <div className="card-soft mt-4 space-y-3 p-6 text-[14px] leading-relaxed text-[#5f5752]">
          <p>1. kelar.in pada demo ini adalah prototipe; surat yang dihasilkan ber-watermark SIMULASI dan tidak berlaku resmi.</p>
          <p>2. Pengguna wajib memberikan data contoh yang tidak melanggar privasi orang lain.</p>
          <p>3. Penyalahgunaan (akses pengajuan orang lain, manipulasi status via API) dicegah dengan otorisasi server; pelanggaran tercatat di audit log.</p>
          <p>4. Estimasi SLA bersifat ilustratif (hari kerja Senin–Jumat) karena durasi resmi tiap layanan belum ditentukan.</p>
          <p>5. Versi demo v1.0 — fitur dapat berubah tanpa pemberitahuan.</p>
        </div>
      </main><PublicFooter /></div>
  );
}
