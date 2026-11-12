"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/#beranda", label: "Beranda" },
    { href: "/layanan", label: "Daftar Layanan" },
    { href: "/#cara-kerja", label: "Cara Kerja" },
    { href: "/faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5cbb8] bg-[#faf5ef]/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5f3d4e] text-lg font-black text-white">k.</span>
          <span className="text-[19px] font-extrabold tracking-tight text-[#2b2320]">kelar.in</span>
          <span className="hidden rounded-full bg-[#f7e8df] px-2 py-0.5 text-[11px] font-bold text-[#a8552f] sm:inline">demo simulasi</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 text-[14px] font-bold text-[#5f3d4e] md:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-[#c06b4a]">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-xl border border-[#5f3d4e] px-4 py-2 text-sm font-bold text-[#5f3d4e]">Login</Link>
          <Link href="/pengajuan/baru" className="btn-terra rounded-xl px-4 py-2 text-sm font-bold">Mulai Pengajuan</Link>
        </div>
        <button className="ml-auto rounded-xl border border-[#e2c9b8] bg-white p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[#e5cbb8] bg-[#faf5ef] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#5f3d4e] hover:bg-white">{l.label}</Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-[#5f3d4e] px-4 py-2.5 text-center text-sm font-bold text-[#5f3d4e]">Login</Link>
              <Link href="/pengajuan/baru" onClick={() => setOpen(false)} className="btn-terra flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold">Mulai Pengajuan</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="hero-plum mt-0 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg font-black text-[#5f3d4e]">k.</span>
            <span className="text-lg font-extrabold">kelar.in</span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-white/75">
            Platform pelayanan publik digital untuk pengajuan surat kelurahan yang mudah dan transparan. Seluruh data pada situs ini adalah <b>simulasi demo</b>.
          </p>
        </div>
        <div>
          <p className="text-sm font-extrabold">Layanan</p>
          <ul className="mt-3 space-y-2 text-[13px] text-white/75">
            <li><Link href="/layanan" className="hover:underline">Semua layanan</Link></li>
            <li><Link href="/layanan/domisili" className="hover:underline">Domisili</Link></li>
            <li><Link href="/layanan/kematian" className="hover:underline">Kematian</Link></li>
            <li><Link href="/layanan/ahli-waris" className="hover:underline">Ahli Waris</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-extrabold">Bantuan</p>
          <ul className="mt-3 space-y-2 text-[13px] text-white/75">
            <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
            <li><Link href="/bantuan" className="hover:underline">Pusat Bantuan</Link></li>
            <li><Link href="/tentang" className="hover:underline">Tentang kelar.in</Link></li>
            <li><Link href="/kontak" className="hover:underline">Kontak (simulasi)</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-extrabold">Kelurahan Contoh (simulasi)</p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-white/75">
            <li>Jl. Contoh No. 1, Kec. Contoh</li>
            <li>Senin–Jumat 08.00–15.00 WIB</li>
            <li>halo@kelar-in.demo (simulasi)</li>
            <li>(021) 000-0000 (simulasi)</li>
          </ul>
          <div className="mt-3 flex gap-3 text-[12px]">
            <Link href="/privasi" className="hover:underline">Privasi</Link>
            <Link href="/ketentuan" className="hover:underline">Ketentuan</Link>
            <Link href="/tentang" className="hover:underline">Aksesibilitas</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4 text-[12px] text-white/60 sm:px-6">
          <span>© 2026 kelar.in • Data simulasi — bukan layanan resmi pemerintah.</span>
          <span className="ml-auto">v1.0-demo</span>
        </div>
      </div>
    </footer>
  );
}
