"use client";
import { useEffect, useState } from "react";
import { cx } from "@/lib/utils";

// Toast
export type Toast = { id: number; msg: string; tone: "ok" | "err" | "info" };
let pushFn: ((t: Omit<Toast, "id">) => void) | null = null;
export function toast(msg: string, tone: Toast["tone"] = "info") {
  pushFn?.({ msg, tone });
}
export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    pushFn = ({ msg, tone }) => {
      const id = Date.now() + Math.random();
      setItems((p) => [...p, { id, msg, tone }]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 3800);
    };
    return () => {
      pushFn = null;
    };
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cx(
            "animate-fade rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl",
            t.tone === "ok" && "border-green-200 bg-green-50 text-green-900",
            t.tone === "err" && "border-red-200 bg-red-50 text-red-900",
            t.tone === "info" && "border-[#e5c2ae] bg-[#fffdfb] text-[#4a2f3d]"
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-soft flex flex-col items-center px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f7e8df] text-2xl">📥</div>
      <h3 className="mt-4 text-lg font-bold text-[#2b2320]">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-[#7a6f6a]">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-xl", className)} />;
}

export function ConfirmModal({
  open,
  title,
  desc,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  loading,
  onConfirm,
  onClose,
  tone = "primary",
}: {
  open: boolean;
  title: string;
  desc?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  tone?: "primary" | "danger";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="card-soft w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-[#2b2320]">{title}</h3>
        {desc && <p className="mt-2 text-sm leading-relaxed text-[#7a6f6a]">{desc}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#e2c9b8] bg-white px-4 py-2.5 text-sm font-bold text-[#5f3d4e]"
          >
            {cancelLabel}
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className={cx(
              "rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60",
              tone === "danger" ? "bg-[#b3261e]" : "btn-primary"
            )}
          >
            {loading ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-[#2b2320]">
        {label} {required && <span className="text-[#c06b4a]">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-[#7a6f6a]">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-[#b3261e]">{error}</span>}
    </label>
  );
}
