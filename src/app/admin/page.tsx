"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Flag,
  RotateCcw,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { DashboardShell } from "@/components/shell";
import { useCivic } from "@/lib/store";
import { STATUS_META, type RequestStatus } from "@/types";
import { daysUntil, formatDate, formatDateTime, isOverdue, timeAgo } from "@/lib/utils";
import { OverdueFlag, PageHeader, StatusPill } from "@/components/ui";

const ALL_STATUSES: RequestStatus[] = ["submitted", "under_review", "action_required", "approved", "completed", "draft", "rejected"];

function AdminInner() {
  const { user, ready, requests, history, changeStatus, resetDemo } = useCivic();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | RequestStatus | "overdue">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>("under_review");
  const [explanation, setExplanation] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [flag, setFlag] = useState(false);
  const [reqActions, setReqActions] = useState("");
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  React.useEffect(() => {
    if (ready && !user) router.replace("/login");
    if (ready && user && user.role !== "admin") router.replace("/dashboard");
  }, [ready, user, router]);

  const stats = useMemo(() => {
    const total = requests.length;
    const processing = requests.filter((r) => ["submitted", "under_review"].includes(r.status)).length;
    const attention = requests.filter((r) => r.status === "action_required" || r.escalationFlag).length;
    const overdue = requests.filter((r) => isOverdue(r.targetCompletionAt, r.status));
    const completed = requests.filter((r) => r.status === "completed");
    const avgDays =
      completed.length === 0
        ? 0
        : completed.reduce((acc, r) => acc + (+new Date(r.updatedAt) - +new Date(r.createdAt)) / 86400000, 0) / completed.length;
    const dist = ALL_STATUSES.map((s) => ({ status: s, count: requests.filter((r) => r.status === s).length }));
    return { total, processing, attention, overdue, avgDays, dist, completedCount: completed.length };
  }, [requests]);

  const filtered = useMemo(() => {
    let list = [...requests].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      list = list.filter((r) => r.id.toLowerCase().includes(n) || r.title.toLowerCase().includes(n) || r.documentType.toLowerCase().includes(n));
    }
    if (status === "overdue") list = list.filter((r) => isOverdue(r.targetCompletionAt, r.status));
    else if (status !== "all") list = list.filter((r) => r.status === status);
    return list;
  }, [requests, q, status]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;
  const selectedHistory = useMemo(
    () => (selected ? history.filter((h) => h.requestId === selected.id).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)) : []),
    [history, selected]
  );

  React.useEffect(() => {
    if (selected) {
      setNewStatus(selected.status === "submitted" ? "under_review" : selected.status);
      setExplanation("");
      setDelayReason(selected.delayReason ?? "");
      setFlag(selected.escalationFlag ?? false);
      setReqActions((selected.requiredActions ?? []).join("\n"));
      setFormError("");
    }
  }, [selected?.id]);

  const applyChange = () => {
    if (!selected || !user) return;
    if (!explanation.trim() || explanation.trim().length < 8) {
      setFormError("Please add an explanation of at least 8 characters — it becomes part of the audit history.");
      return;
    }
    if (newStatus === "action_required" && !reqActions.trim()) {
      setFormError("When requesting action, list the missing items (one per line) so the citizen knows what to provide.");
      return;
    }
    setFormError("");
    changeStatus(selected.id, newStatus, explanation.trim(), {
      delayReason: delayReason.trim() || undefined,
      escalationFlag: flag,
      requiredActions: newStatus === "action_required" ? reqActions.split("\n").map((s) => s.trim()).filter(Boolean) : selected.requiredActions,
    });
    setNotice(`Request ${selected.id} updated to ${STATUS_META[newStatus].label}. Citizen notified.`);
    setTimeout(() => setNotice(""), 4000);
  };

  if (!ready || !user) {
    return <div className="grid min-h-screen place-items-center text-sm text-[#647587]">Loading operations…</div>;
  }
  if (user.role !== "admin") return null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration · mock operations"
        title="Operations & accountability"
        copy="Review every file, record status changes with explanations, and track sample processing targets. Overdue flags are for review — never automatic blame."
        actions={
          <>
            <button onClick={() => { resetDemo(); setNotice("Demo dataset restored."); setTimeout(() => setNotice(""), 3500); }} className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4E9] bg-white px-4 py-2 text-[13px] font-semibold text-[#4A5C6E] hover:border-[#6096BA]">
              <RotateCcw size={14} /> Reset demo
            </button>
            <Link href="/dashboard" className="cut-corner-sm inline-flex items-center gap-1.5 bg-white/80 px-4 py-2 text-[13px] font-semibold text-[#274C77] ring-1 ring-[#DCE4E9]">
              Citizen view <ArrowRight size={14} />
            </Link>
          </>
        }
      />

      {notice && <p role="status" className="rounded-2xl border border-[#39856A44] bg-[#EFF6F1] px-4 py-3 text-[13px] font-medium text-[#2E6B57]">{notice}</p>}

      {/* metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cut-corner-sm bg-[#274C77] p-5 text-white">
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-[#A3CEF1] uppercase"><FileText size={13} /> Total files</p>
          <p className="font-display mt-1 text-4xl font-semibold">{stats.total}</p>
          <p className="mt-1 text-xs text-white/70">{stats.completedCount} completed · live from store</p>
        </div>
        <div className="rounded-[22px] border border-[#DCE4E9] bg-white p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-[#6096BA] uppercase"><Clock size={13} /> In processing</p>
          <p className="font-display mt-1 text-4xl font-semibold text-[#274C77]">{stats.processing}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7ECEF]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#274C77] to-[#6096BA]" style={{ width: `${stats.total ? Math.round((stats.processing / stats.total) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="rounded-full border border-[#E8D9B5] bg-[#FFFBF0] p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-[#7A5A1F] uppercase"><Flag size={13} /> Needs attention</p>
          <p className="font-display mt-1 text-4xl font-semibold text-[#7A5A1F]">{stats.attention}</p>
          <p className="mt-1 text-xs text-[#7A5A1F99]">Action-required + flagged</p>
        </div>
        <div className={`p-5 ${stats.overdue.length ? "rounded-2xl border border-[#B85C5C55] bg-[#F3DEDE66]" : "rounded-2xl border border-[#DCE4E9] bg-white"}`}>
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: stats.overdue.length ? "#8E4444" : "#647587" }}><AlertTriangle size={13} /> Past sample target</p>
          <p className="font-display mt-1 text-4xl font-semibold" style={{ color: stats.overdue.length ? "#8E4444" : "#1D2C3B" }}>{stats.overdue.length}</p>
          <p className="mt-1 text-xs text-[#647587]">Avg. completion {stats.avgDays ? `${stats.avgDays.toFixed(1)}d` : "—"} (sample)</p>
        </div>
      </div>

      {/* distribution + overdue */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-[#DCE4E9] bg-white p-5">
          <h3 className="text-sm font-bold">Status distribution</h3>
          <div className="mt-3 space-y-2">
            {stats.dist.filter((d) => d.count > 0).map((d) => (
              <div key={d.status} className="flex items-center gap-3">
                <span className="w-28 text-xs font-medium text-[#4A5C6E]">{STATUS_META[d.status].label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E7ECEF]">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((d.count / Math.max(1, stats.total)) * 100)}%`, background: STATUS_META[d.status].dot }} />
                </div>
                <span className="w-6 text-right font-mono text-xs font-bold">{d.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#647587]"><Timer size={12} /> Processing-time analytics use demonstration targets only.</p>
        </div>
        <div className="rounded-3xl border border-[#DCE4E9] bg-white p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-bold"><ShieldCheck size={15} className="text-[#39856A]" /> Accountability workflow</h3>
          <ol className="mt-2.5 space-y-1.5 text-[13px] text-[#4A5C6E]">
            <li>1 · Targets are <strong>sample values</strong>, flagged when exceeded.</li>
            <li>2 · Every change requires a written explanation for the audit trail.</li>
            <li>3 · Delay reasons + follow-up flags add context — never misconduct labels.</li>
          </ol>
          {stats.overdue.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {stats.overdue.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSelectedId(r.id)} className="flex w-full items-center gap-2 rounded-2xl bg-[#F3DEDE66] px-3.5 py-2.5 text-left text-[13px] transition hover:bg-[#F3DEDE]">
                    <AlertTriangle size={14} className="shrink-0 text-[#B85C5C]" />
                    <span className="font-mono text-xs font-bold text-[#8E4444]">{r.id}</span>
                    <span className="truncate font-medium">{r.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-2xl bg-[#EFF6F1] px-3.5 py-2.5 text-[13px] text-[#2E6B57]">No files past their sample targets right now.</p>
          )}
        </div>
      </div>

      {/* management table + editor */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-3xl border border-[#DCE4E9] bg-white">
          <div className="border-b border-[#DCE4E9] bg-[#F7F9FA] p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-44 flex-1">
                <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9AA9B7]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all files…" className="w-full rounded-full border border-[#DCE4E9] bg-white py-1.5 pr-3 pl-9 text-[13px] focus:border-[#6096BA] focus:outline-none" aria-label="Search all requests" />
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-full border border-[#DCE4E9] bg-white px-3 py-1.5 text-xs font-semibold" aria-label="Filter status">
                <option value="all">All statuses</option>
                <option value="overdue">Past sample target</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-[11px] text-[#647587]">Showing {filtered.length} of {requests.length} mock files</p>
          </div>
          <ul className="nice-scroll max-h-[560px] divide-y divide-[#EDF1F4] overflow-y-auto">
            {filtered.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelectedId(r.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${selectedId === r.id ? "bg-[#E7ECEF88]" : "hover:bg-[#F7F9FA]"}`}>
                  <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: STATUS_META[r.status].dot }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#274C77]">{r.id}</span>
                      <StatusPill status={r.status} size="sm" />
                      <OverdueFlag targetAt={r.targetCompletionAt} status={r.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] font-semibold">{r.title}</span>
                    <span className="block truncate text-[11px] text-[#647587]">{r.documentType} · {r.assignedDepartment} · {timeAgo(r.updatedAt)}</span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#9AA9B7]" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="h-fit rounded-3xl border border-[#274C77] bg-white p-5 lg:sticky lg:top-20" aria-label="Status editor">
          {!selected ? (
            <div className="py-8 text-center">
              <ShieldCheck size={26} className="mx-auto text-[#9AA9B7]" />
              <p className="font-display mt-2 text-lg font-semibold">Select a file to manage</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] text-[#647587]">Change status, record delay reasons, set follow-up flags, and write the audit explanation.</p>
            </div>
          ) : (
            <div>
              <p className="font-mono text-[11px] font-bold text-[#274C77]">{selected.id}</p>
              <h3 className="font-display text-lg leading-snug font-semibold">{selected.title}</h3>
              <p className="mt-0.5 text-xs text-[#647587]">{selected.documentType} · filed {formatDate(selected.createdAt)} · sample target {formatDate(selected.targetCompletionAt)} ({daysUntil(selected.targetCompletionAt)}d)</p>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[13px] font-semibold">New status</span>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as RequestStatus)} className="w-full rounded-xl border border-[#DCE4E9] bg-white px-3 py-2.5 text-sm focus:border-[#6096BA] focus:outline-none" aria-label="New status">
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[13px] font-semibold">Explanation (required, shown to citizen)</span>
                <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="e.g. Verification passed. Moved to Residency Unit review queue." className="min-h-20 w-full rounded-xl border border-[#DCE4E9] px-3 py-2.5 text-sm focus:border-[#6096BA] focus:outline-none" aria-label="Status explanation" />
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[13px] font-semibold">Delay reason (for overdue review)</span>
                <input value={delayReason} onChange={(e) => setDelayReason(e.target.value)} placeholder="e.g. Awaiting archival confirmation" className="w-full rounded-xl border border-[#DCE4E9] px-3 py-2.5 text-sm focus:border-[#6096BA] focus:outline-none" aria-label="Delay reason" />
              </label>
              {newStatus === "action_required" && (
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Missing items (one per line)</span>
                  <textarea value={reqActions} onChange={(e) => setReqActions(e.target.value)} placeholder={"Upload clearer scan\nConfirm spelling"} className="min-h-20 w-full rounded-xl border border-[#DCE4E9] px-3 py-2.5 text-sm focus:border-[#6096BA] focus:outline-none" aria-label="Required actions" />
                </label>
              )}
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-2xl bg-[#F7F9FA] px-3.5 py-2.5 text-[13px] font-medium">
                <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} className="h-4 w-4 accent-[#274C77]" />
                Flag for follow-up / escalation review
              </label>
              {formError && <p role="alert" className="mt-2.5 rounded-xl bg-[#F3DEDE] px-3.5 py-2.5 text-xs font-medium text-[#8E4444]">{formError}</p>}
              <button onClick={applyChange} className="cut-corner-sm mt-3 w-full bg-[#274C77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3c5e]">
                Apply & notify citizen
              </button>
              <Link href={`/dashboard/requests/${selected.id}`} className="mt-2 block text-center text-[13px] font-semibold text-[#274C77] underline underline-offset-2">Open citizen timeline view</Link>

              <div className="mt-4 border-t border-[#DCE4E9] pt-3">
                <p className="text-[11px] font-bold tracking-[0.16em] text-[#647587] uppercase">Audit history ({selectedHistory.length})</p>
                <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto nice-scroll">
                  {selectedHistory.map((h) => (
                    <li key={h.id} className="rounded-xl bg-[#F7F9FA] p-2.5 text-xs">
                      <p className="font-semibold">{h.actorName} · {h.actorRole} · {formatDateTime(h.timestamp)}</p>
                      <p className="mt-0.5 text-[#4A5C6E]">{h.previousStatus} → {h.newStatus}: {h.explanation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
      <p className="text-xs text-[#9AA9B7]">All administrator actions update the shared mock store immediately and appear in citizen timelines, inboxes, and dashboard metrics.</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <DashboardShell>
      <AdminInner />
    </DashboardShell>
  );
}
