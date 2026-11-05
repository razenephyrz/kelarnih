"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpenText,
  ChevronLeft,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCivic } from "@/lib/store";
import { initials } from "@/lib/utils";

function NavItem({
  href,
  icon,
  label,
  active,
  badge,
  collapsed,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-gradient-to-r from-[#274C77] to-[#3d6390] text-white shadow-[0_10px_24px_rgba(39,76,119,0.28)]"
          : "text-[#4A5C6E] hover:bg-[#E7ECEF] hover:text-[#274C77]"
      } ${collapsed ? "justify-center px-2" : ""}`}
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && typeof badge === "number" && badge > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-[#B7803222] text-[#7A5A1F]"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, unreadCount, logout, ready } = useCivic();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  React.useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F9FA]">
        <div className="flex items-center gap-3 text-sm text-[#647587]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#DCE4E9] border-t-[#274C77]" />
          Loading CivicFlow…
        </div>
      </div>
    );
  }
  if (!user) return null;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dashboard/requests?q=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${collapsed ? "justify-center px-2" : ""}`}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#274C77] to-[#6096BA] text-white shadow-[0_10px_24px_rgba(39,76,119,0.3)]">
          <span className="font-display text-lg font-semibold">C</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-[17px] leading-none font-semibold text-[#1D2C3B]">CivicFlow</p>
            <p className="mt-1 text-[11px] tracking-wide text-[#647587]">Public administration tracking</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-2">
          <Link
            href="/dashboard/requests/new"
            className="cut-corner-sm flex items-center justify-center gap-2 bg-[#274C77] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e3c5e]"
          >
            <Plus size={16} /> New request
          </Link>
        </div>
      )}

      <nav className="nice-scroll flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Dashboard">
        <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" active={isActive("/dashboard") && pathname === "/dashboard"} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        <NavItem href="/dashboard/requests" icon={<FileText size={18} />} label="My Requests" active={pathname.startsWith("/dashboard/requests")} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        <NavItem href="/dashboard/documents" icon={<BookOpenText size={18} />} label="Document Guide" active={pathname.startsWith("/dashboard/documents")} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        <NavItem href="/dashboard/inbox" icon={<Inbox size={18} />} label="Inbox" active={pathname.startsWith("/dashboard/inbox")} collapsed={collapsed} badge={unreadCount} onClick={() => setMobileOpen(false)} />
        <NavItem href="/dashboard/profile" icon={<Settings2 size={18} />} label="Profile" active={pathname.startsWith("/dashboard/profile")} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        {user.role === "admin" && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold tracking-[0.18em] text-[#9AA9B7] uppercase">Operations</p>
            )}
            <NavItem href="/admin" icon={<ShieldCheck size={18} />} label="Administration" active={pathname.startsWith("/admin")} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          </>
        )}
      </nav>

      <div className={`border-t border-[#DCE4E9] p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#E7ECEF66] p-3">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
              style={{ background: user.avatarColor ?? "#274C77" }}
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#1D2C3B]">{user.name}</p>
              <p className="truncate text-[11px] text-[#647587] capitalize">{user.role} · demo session</p>
            </div>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="rounded-xl p-2 text-[#647587] transition hover:bg-white hover:text-[#B85C5C]"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="rounded-xl p-2.5 text-[#647587] hover:bg-[#E7ECEF] hover:text-[#B85C5C]"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-[#DCE4E9] bg-[#FFFFFFF2] backdrop-blur transition-all md:block ${
          collapsed ? "w-[76px]" : "w-[264px]"
        }`}
      >
        {sidebar}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 grid h-6 w-6 place-items-center rounded-full border border-[#DCE4E9] bg-white text-[#647587] shadow-sm transition hover:text-[#274C77]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={14} className={`transition ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-[#1D2C3B66]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-[#DCE4E9] bg-white shadow-2xl">
            <button
              className="absolute top-4 right-4 rounded-lg p-1.5 text-[#647587] hover:bg-[#E7ECEF]"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className={`transition-all ${collapsed ? "md:pl-[76px]" : "md:pl-[264px]"}`}>
        {/* topbar */}
        <header className="sticky top-0 z-20 border-b border-[#DCE4E9] bg-[#F7F9FACC] backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button className="rounded-xl p-2 text-[#4A5C6E] hover:bg-[#E7ECEF] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <form onSubmit={submitSearch} className="relative max-w-md flex-1" role="search">
              <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9AA9B7]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by request ID or title…"
                className="w-full rounded-full border border-[#DCE4E9] bg-white py-2 pr-4 pl-10 text-sm placeholder:text-[#9AA9B7] focus:border-[#6096BA] focus:ring-2 focus:ring-[#A3CEF155] focus:outline-none"
                aria-label="Search requests"
              />
            </form>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/dashboard/inbox"
                className="relative rounded-full border border-[#DCE4E9] bg-white p-2.5 text-[#274C77] transition hover:border-[#6096BA]"
                aria-label={`Inbox, ${unreadCount} unread`}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#B78032] px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard/profile"
                className="hidden items-center gap-2.5 rounded-full border border-[#DCE4E9] bg-white py-1.5 pr-4 pl-1.5 transition hover:border-[#6096BA] sm:flex"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: user.avatarColor ?? "#274C77" }}
                >
                  {initials(user.name)}
                </span>
                <span className="max-w-28 truncate text-[13px] font-semibold text-[#1D2C3B]">{user.name.split(" ")[0]}</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
