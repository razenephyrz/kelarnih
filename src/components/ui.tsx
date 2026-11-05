"use client";

import React from "react";
import Link from "next/link";
import { STATUS_META, type RequestStatus } from "@/types";
import { formatDate, isOverdue, progressForStatus, timeAgo } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Check, Clock } from "lucide-react";

export function StatusPill({ status, size = "md" }: { status: RequestStatus; size?: "sm" | "md" }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      }`}
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.dot}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

export function OverdueFlag({ targetAt, status }: { targetAt: string; status: RequestStatus }) {
  if (!isOverdue(targetAt, status)) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3DEDE] px-2.5 py-1 text-[11px] font-semibold text-[#8E4444] border border-[#B85C5C33]">
      <AlertTriangle size={12} /> Past sample target
    </span>
  );
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#DCE4E9" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#274C77" />
            <stop offset="100%" stopColor="#6096BA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-[#1D2C3B]">{label ?? `${Math.round(value)}%`}</span>
        {sub && <span className="text-[11px] text-[#647587]">{sub}</span>}
      </div>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7ECEF]">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: "linear-gradient(90deg, #274C77, #6096BA)",
          transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  copy?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6096BA]">{eyebrow}</p>
      <h2 className="font-display mt-3 text-3xl leading-[1.1] font-medium text-[#1D2C3B] sm:text-4xl">{title}</h2>
      {copy && <p className="mt-3 text-[15px] leading-relaxed text-[#647587]">{copy}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#DCE4E9] bg-white px-8 py-12 text-center">
      <div className="blob h-40 w-40 rounded-full bg-gradient-to-br from-[#E7ECEF] to-[#A3CEF1] opacity-60 blur-2xl left-1/2 top-0 -translate-x-1/2" />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E7ECEF]">
          <Clock size={20} className="text-[#274C77]" />
        </div>
        <h3 className="font-display text-xl text-[#1D2C3B]">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#647587]">{copy}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#1D2C3B]">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-[#647587]">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-[#B85C5C]">{error}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-[#DCE4E9] bg-white px-3.5 py-2.5 text-sm text-[#1D2C3B] placeholder:text-[#9AA9B7] focus:border-[#6096BA] focus:outline-none focus:ring-2 focus:ring-[#A3CEF155] transition";

export function TicketCard({
  id,
  title,
  docType,
  status,
  updatedAt,
  targetAt,
  department,
}: {
  id: string;
  title: string;
  docType: string;
  status: RequestStatus;
  updatedAt: string;
  targetAt: string;
  department: string;
}) {
  const pct = progressForStatus(status, "", "");
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#DCE4E9] bg-white transition hover:border-[#6096BA66] hover:shadow-[0_16px_40px_rgba(39,76,119,0.10)]">
      <div className="flex">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#274C77] to-[#6096BA] py-4 text-white">
          <span className="text-[10px] font-bold tracking-widest opacity-70" style={{ writingMode: "vertical-rl" }}>
            CIVICFLOW
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#274C77]">{id}</span>
            <StatusPill status={status} size="sm" />
            <OverdueFlag targetAt={targetAt} status={status} />
          </div>
          <h3 className="mt-1.5 truncate text-[15px] font-semibold text-[#1D2C3B]">{title}</h3>
          <p className="truncate text-xs text-[#647587]">
            {docType} · {department}
          </p>
          <div className="ticket-divider my-3" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#647587]">Updated {timeAgo(updatedAt)}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#274C77]">
              Open <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={pct} />
          </div>
        </div>
      </div>
      {/* notches */}
      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-r border-[#DCE4E9] bg-[#F7F9FA]" />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  copy,
  actions,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mesh-header grain relative overflow-hidden rounded-[28px] border border-[#DCE4E9] px-6 py-8 sm:px-10">
      <div className="blob -right-16 -top-20 h-64 w-64 rounded-[46%_54%_52%_48%/48%_46%_54%_52%] bg-gradient-to-br from-[#A3CEF1] to-[#6096BA55] opacity-50 blur-2xl" />
      <div className="blob -left-10 bottom-0 h-40 w-72 rounded-[58%_42%_55%_45%/45%_55%_45%_55%] bg-white/60 blur-xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#274C77]">{eyebrow}</p>
          <h1 className="font-display mt-2 text-3xl font-medium text-[#1D2C3B] sm:text-[2.6rem] sm:leading-[1.05]">{title}</h1>
          {copy && <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4A5C6E]">{copy}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-dashed border-[#6096BA66] bg-[#E7ECEF66] px-4 py-3 text-xs leading-relaxed text-[#4A5C6E]">
      <Check size={14} className="mt-0.5 shrink-0 text-[#39856A]" />
      <span>
        <strong className="font-semibold text-[#274C77]">Demonstration data.</strong> Records, dates and processing
        targets on this page are illustrative samples — not official service standards.{" "}
        <Link href="/dashboard/documents" className="font-semibold text-[#274C77] underline underline-offset-2">
          Verify in the procedure guide
        </Link>
        .
      </span>
    </div>
  );
}
