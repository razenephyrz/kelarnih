"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutLocal, mockApiFetch } from "@/lib/mock-api";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  Files,
  Radar,
  Bell,
  User,
  ShieldCheck,
  ClipboardCheck,
  Zap,
  BarChart3,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Search,
  Home,
} from "lucide-react";
import { cx, parseJsonResponse } from "@/lib/utils";
import { ToastHost } from "./ui";

export type ShellUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const MENUS: Record<string, Array<{ href: string; label: string; icon: any }>> = {
  WARGA: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pengajuan/baru", label: "Buat Pengajuan", icon: FilePlus2 },
    { href: "/pengajuan", label: "Pengajuan Saya", icon: Files },
    { href: "/tracking", label: "Tracking", icon: Radar },
    { href: "/akuntabilitas", label: "Akuntabilitas", icon: BarChart3 },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
    { href: "/profil", label: "Profil", icon: User },
  ],
  PETUGAS: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pengajuan", label: "Pengajuan Masuk", icon: Files },
    { href: "/verifikasi", label: "Verifikasi Berkas", icon: ClipboardCheck },
    { href: "/prioritas", label: "Antrean Prioritas", icon: Zap },
    { href: "/monitoring", label: "Monitoring", icon: Radar },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
    { href: "/profil", label: "Profil", icon: User },
  ],
  RT_RW: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/persetujuan", label: "Menunggu ACC", icon: ShieldCheck },
    { href: "/pengajuan", label: "Riwayat Persetujuan", icon: Files },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
    { href: "/profil", label: "Profil", icon: User },
  ],
  LURAH: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/persetujuan", label: "Persetujuan Surat", icon: ShieldCheck },
    { href: "/monitoring", label: "Monitoring", icon: Radar },
    { href: "/akuntabilitas", label: "Akuntabilitas SLA", icon: BarChart3 },
    { href: "/laporan", label: "Laporan", icon: FileText },
    { href: "/petugas", label: "Manajemen Petugas", icon: Users },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
    { href: "/profil", label: "Profil", icon: User },
  ],
  CAMAT: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/persetujuan", label: "Persetujuan Camat", icon: ShieldCheck },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
    { href: "/profil", label: "Profil", icon: User },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  WARGA: "Warga",
  PETUGAS: "Petugas",
  RT_RW: "RT/RW",
  LURAH: "Lurah",
  CAMAT: "Camat",
};

export function AppShell({
  user,
  children,
  title,
  subtitle,
}: {
  user: ShellUser;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState("");

  const menus = MENUS[user.role] ?? MENUS.WARGA;

  useEffect(() => {
    mockApiFetch("/api/notifications?unread=1")
      .then((r) => parseJsonResponse(r))
      .then((j) => setUnread(j.unread ?? 0))
      .catch(() => {});
    const t = setInterval(() => {
      mockApiFetch("/api/notifications?unread=1")
        .then((r) => parseJsonResponse(r))
        .then((j) => setUnread(j.unread ?? 0))
        .catch(() => {});
    }, 20000);
    return () => clearInterval(t);
  }, []);

  async function logout() {
    logoutLocal();
    router.push("/login");
    router.refresh();
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/pengajuan?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="min-h-screen bg-[#f4e9de]">
      <ToastHost />
      {/* Sidebar desktop */}
      <aside className="sidebar-rose fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col px-4 py-6 text-white lg:flex">
        <Link href={user.role === "WARGA" ? "/" : "/dashboard"} className="flex items-center gap-2.5 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/95 text-xl font-black text-[#5f3d4e]">
            k.
          </span>
          <span className="leading-tight">
            <span className="block text-[19px] font-extrabold tracking-tight">kelar.in</span>
            <span className="block text-[11px] font-medium text-white/80">Pelayanan Kelurahan • Demo</span>
          </span>
        </Link>
        <nav className="mt-7 flex flex-1 flex-col gap-1.5">
          {menus.map((m) => {
            const active = pathname === m.href || (m.href !== "/dashboard" && pathname.startsWith(m.href));
            const Icon = m.icon;
            return (
              <Link
                key={m.href + m.label}
                href={m.href}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-bold transition",
                  active
                    ? "bg-[#4a2f3d] text-white shadow-lg"
                    : "bg-white/15 text-white hover:bg-white/25"
                )}
              >
                <Icon size={18} strokeWidth={2.2} />
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-2xl bg-black/15 p-3 text-[12px] leading-relaxed text-white/90">
          <p className="font-bold text-white">Data simulasi</p>
          <p>Seluruh nama, alamat & dokumen adalah contoh untuk demo.</p>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#4a2f3d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3a2530]"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setDrawer(false)} />
          <div className="sidebar-rose absolute inset-y-0 left-0 flex w-[280px] flex-col px-4 py-6 text-white">
            <div className="flex items-center justify-between px-2">
              <span className="text-lg font-extrabold">kelar.in</span>
              <button onClick={() => setDrawer(false)} aria-label="Tutup menu" className="rounded-lg bg-white/20 p-2">
                <X size={18} />
              </button>
            </div>
            <nav className="mt-6 flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {menus.map((m) => {
                const Icon = m.icon;
                const active = pathname === m.href;
                return (
                  <Link
                    key={m.href + m.label}
                    href={m.href}
                    onClick={() => setDrawer(false)}
                    className={cx(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold",
                      active ? "bg-[#4a2f3d] text-white" : "bg-white/15 text-white"
                    )}
                  >
                    <Icon size={18} /> {m.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#4a2f3d] px-4 py-3 text-sm font-bold"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-[#e5cbb8] bg-[#f4e9de]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              className="rounded-xl border border-[#e2c9b8] bg-white p-2.5 lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label="Buka menu"
            >
              <Menu size={18} />
            </button>
            <form onSubmit={submitSearch} className="relative hidden flex-1 sm:block">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89a93]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari pengajuan (nomor / layanan)…"
                className="input-soft pl-10"
              />
            </form>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/notifikasi"
                className="relative rounded-xl border border-[#e2c9b8] bg-white p-2.5"
                aria-label="Notifikasi"
              >
                <Bell size={18} className="text-[#5f3d4e]" />
                {unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#c06b4a] px-1 text-[11px] font-extrabold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profil"
                className="flex items-center gap-2.5 rounded-2xl border border-[#e2c9b8] bg-white py-1.5 pl-1.5 pr-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#5f3d4e] text-[13px] font-extrabold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block max-w-[120px] truncate text-[13px] font-extrabold text-[#2b2320]">
                    {user.name}
                  </span>
                  <span className="block text-[11px] font-bold text-[#c06b4a]">{ROLE_LABEL[user.role]}</span>
                </span>
              </Link>
            </div>
          </div>
          {/* mobile search */}
          <div className="px-4 pb-3 sm:hidden">
            <form onSubmit={submitSearch} className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89a93]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari pengajuan…"
                className="input-soft pl-10"
              />
            </form>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          {(title || subtitle) && (
            <div className="mb-5">
              {title && <h1 className="text-[26px] font-extrabold tracking-tight text-[#2b2320]">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-[#7a6f6a]">{subtitle}</p>}
            </div>
          )}
          {children}
          <footer className="mt-10 border-t border-[#e2c9b8] pt-5 text-[12px] text-[#7a6f6a]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-extrabold text-[#5f3d4e]">kelar.in v1.0-demo</span>
              <span>© 2026 kelar.in • Data simulasi, bukan layanan resmi pemerintah</span>
              <span className="ml-auto flex gap-3">
                <Link href="/bantuan" className="hover:underline">Bantuan</Link>
                <Link href="/privasi" className="hover:underline">Privasi</Link>
                <Link href="/ketentuan" className="hover:underline">Ketentuan</Link>
              </span>
            </div>
          </footer>
        </main>

        {/* Bottom nav mobile for warga */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5cbb8] bg-[#fffdfb]/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {[
              { href: "/dashboard", icon: Home, label: "Home" },
              { href: "/pengajuan", icon: Files, label: "Pengajuan" },
              { href: "/pengajuan/baru", icon: FilePlus2, label: "Buat" },
              { href: "/tracking", icon: Radar, label: "Tracking" },
              { href: "/profil", icon: User, label: "Profil" },
            ].map((m) => {
              const Icon = m.icon;
              const active = pathname === m.href;
              return (
                <Link
                  key={m.href + m.label}
                  href={m.href}
                  className={cx(
                    "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold",
                    active ? "text-[#5f3d4e]" : "text-[#a89a93]"
                  )}
                >
                  <Icon size={20} />
                  {m.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
