"use client";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/workflow";
import { cx } from "@/lib/utils";

const toneMap: Record<string, string> = {
  amber: "badge-amber",
  red: "badge-red",
  green: "badge-green",
  blue: "badge-blue",
  orange: "badge-orange",
  mauve: "badge-mauve",
  muted: "badge-muted",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = STATUS_LABEL[status] ?? status;
  const tone = STATUS_TONE[status] ?? "muted";
  return <span className={cx("badge", toneMap[tone], className)}>{label}</span>;
}

export function PriorityBadge({ priorityStatus, isPriority }: { priorityStatus?: string; isPriority?: boolean }) {
  if (!isPriority) return null;
  if (priorityStatus === "APPROVED")
    return <span className="badge badge-orange">⚡ Prioritas disetujui</span>;
  if (priorityStatus === "PENDING")
    return <span className="badge badge-amber">⚡ Menunggu keputusan prioritas</span>;
  if (priorityStatus === "REJECTED")
    return <span className="badge badge-muted">Prioritas ditolak • antrean normal</span>;
  return <span className="badge badge-amber">⚡ Prioritas</span>;
}
