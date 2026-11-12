import { PublicNav, PublicFooter } from "@/components/Public";
export default function KontakPage() {
  return (
    <div className="min-h-screen bg-[#faf5ef]"><PublicNav />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-[28px] font-extrabold">Kontak (simulasi)</h1>
        <p className="mt-1 text-sm text-[#7a6f6a]">Jangan gunakan data di bawah untuk keperluan resmi. Ini data demo.</p>
        <div className="card-soft mt-5 space-y-2 p-6 text-[14px]">
          <p><b>Kelurahan Contoh (simulasi)</b></p>
          <p>Jl. Contoh No. 1, Kecamatan Contoh, Kota Contoh</p>
          <p>Jam layanan: Senin–Jumat, 08.00–15.00 WIB (ilustratif)</p>
          <p>Email: halo@kelar-in.demo • Telp: (021) 000-0000</p>
        </div>
      </main><PublicFooter /></div>
  );
}
