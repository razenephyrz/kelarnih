import { PublicNav, PublicFooter } from "@/components/Public";
export default function PrivasiPage() {
  return (
    <div className="min-h-screen bg-[#faf5ef]"><PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-[28px] font-extrabold">Kebijakan Privasi (simulasi)</h1>
        <div className="card-soft mt-4 space-y-3 p-6 text-[14px] leading-relaxed text-[#5f5752]">
          <p>1. Data yang disimpan: identitas akun, pengajuan, dokumen persyaratan, riwayat aktivitas, notifikasi, dan rating — hanya untuk keperluan demo alur pelayanan.</p>
          <p>2. Password di-hash (bcrypt) dan tidak disimpan plain-text. Sesi memakai cookie httpOnly. Akses data dibatasi per role di sisi server.</p>
          <p>3. File dibatasi jenis (PDF/JPG/PNG) dan ukuran (5 MB), divalidasi di server.</p>
          <p>4. Data demo dapat di-reset sewaktu-waktu. Jangan unggah dokumen asli/ sensitif ke lingkungan demo.</p>
          <p>5. Audit log mencatat aksi penting (login, transisi status, prioritas, rating) untuk akuntabilitas demo.</p>
        </div>
      </main><PublicFooter /></div>
  );
}
