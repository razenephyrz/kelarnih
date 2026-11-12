import { PublicNav, PublicFooter } from "@/components/Public";
export default function TentangPage() {
  return (
    <div className="min-h-screen bg-[#faf5ef]"><PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-[28px] font-extrabold">Tentang kelar.in</h1>
        <div className="card-soft mt-4 space-y-3 p-6 text-[14px] leading-relaxed text-[#5f5752]">
          <p><b className="text-[#2b2320]">kelar.in</b> adalah prototipe Public Service Management System untuk mendemonstrasikan alur pelayanan kelurahan end-to-end: warga mengajukan surat, petugas memverifikasi, RT/RW & Lurah (→ Camat khusus ahli waris) menyetujui, hingga surat simulasi diterbitkan dan dinilai.</p>
          <p>Fitur inti: katalog dinamis, upload tervalidasi, tracking timeline, SLA transparan (mulai setelah verifikasi, jeda saat menunggu warga), antrean prioritas, notifikasi berbasis event, rating, dan dashboard akuntabilitas dari data database.</p>
          <p>Seluruh institusi, nama, dan dokumen adalah <b>simulasi</b>. Tidak terintegrasi dengan sistem pemerintahan resmi dan tidak memakai tanda tangan elektronik resmi.</p>
          <p>Aksesibilitas: kontras teks ditingkatkan, target sentuh memadai, navigasi keyboard & label form, layout responsif 375px–1440px.</p>
        </div>
      </main><PublicFooter /></div>
  );
}
