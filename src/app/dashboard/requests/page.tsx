"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, Plus, Search, Trash2 } from "lucide-react";
import { useCivic } from "@/lib/store";
import { STATUS_META, type RequestStatus } from "@/types";
import { PageHeader, StatusPill, OverdueFlag, EmptyState } from "@/components/ui";
import { timeAgo, formatDate } from "@/lib/utils";

const STATUS_FILTERS: ("all" | RequestStatus)[] = ["all", "draft", "submitted", "under_review", "action_required", "approved", "completed", "rejected"];

function RequestsInner() {
  const { myRequests, procedures, deleteRequest } = useCivic();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [docType, setDocType] = useState("all");
  const [sort, setSort] = useState<"updated" | "created" | "target">("updated");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const docTypes = useMemo(() => ["all", ...Array.from(new Set(myRequests.map((r) => r.documentType)))], [myRequests]);

  const filtered = useMemo(() => {
    let list = [...myRequests];
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((r) => r.id.toLowerCase().includes(needle) || r.title.toLowerCase().includes(needle));
    }
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (docType !== "all") list = list.filter((r) => r.documentType === docType);
    list.sort((a, b) => {
      if (sort === "created") return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === "target") return +new Date(a.targetCompletionAt) - +new Date(b.targetCompletionAt);
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
    return list;
  }, [myRequests, q, status, docType, sort]);

  const doDelete = (id: string) => {
    const res = deleteRequest(id);
    setConfirmDelete(null);
    setNotice(res.ok ? `Request ${id} deleted.` : (res.error ?? "Could not delete."));
    setTimeout(() => setNotice(""), 3500);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Request management"
        title="My requests"
        copy="Search, filter, and open any file. All counts update live from your stored records."
        actions={
          <Link href="/dashboard/requests/new" className="cut-corner-sm inline-flex items-center gap-2 bg-[#274C77] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1e3c5e]">
            <Plus size={15} /> New request
          </Link>
        }
      />

      {notice && (
        <p role="status" className="rounded-2xl border border-[#39856A44] bg-[#EFF6F1] px-4 py-3 text-[13px] font-medium text-[#2E6B57]">
          {notice}
        </p>
      )}

      {/* controls */}
      <div className="rounded-3xl border border-[#DCE4E9] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9AA9B7]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID or title…"
              className="w-full rounded-full border border-[#DCE4E9] bg-[#F7F9FA] py-2 pr-4 pl-10 text-sm focus:border-[#6096BA] focus:bg-white focus:ring-2 focus:ring-[#A3CEF155] focus:outline-none"
              aria-label="Search requests"
            />
          </div>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="rounded-full border border-[#DCE4E9] bg-white px-4 py-2 text-[13px] font-medium" aria-label="Filter by document type">
            {docTypes.map((d) => (
              <option key={d} value={d}>{d === "all" ? "All types" : d}</option>
            ))}
          </select>
          <button
            onClick={() => setSort(sort === "updated" ? "created" : sort === "created" ? "target" : "updated")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4E9] bg-white px-4 py-2 text-[13px] font-medium text-[#4A5C6E] hover:border-[#6096BA]"
            title="Change sort"
          >
            <ArrowUpDown size={14} /> {sort === "updated" ? "Last updated" : sort === "created" ? "Submission date" : "Target date"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                status === s ? "bg-[#274C77] text-white shadow-[0_8px_20px_rgba(39,76,119,0.25)]" : "border border-[#DCE4E9] bg-[#F7F9FA] text-[#4A5C6E] hover:border-[#6096BA]"
              }`}
            >
              {s === "all" ? "All" : STATUS_META[s].label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#647587]">
          Showing <strong className="text-[#1D2C3B]">{filtered.length}</strong> of {myRequests.length} requests · {procedures.length} procedure guides available
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No requests match"
          copy="Try clearing a filter, or file a new request to start tracking."
          action={
            <Link href="/dashboard/requests/new" className="inline-flex items-center gap-2 rounded-full bg-[#274C77] px-5 py-2.5 text-[13px] font-semibold text-white">
              <Plus size={14} /> New request
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#DCE4E9] bg-white">
          <div className="hidden grid-cols-[1.1fr_1fr_0.9fr_0.9fr_0.5fr] gap-4 border-b border-[#DCE4E9] bg-[#F7F9FA] px-6 py-3 text-[11px] font-bold tracking-[0.12em] text-[#647587] uppercase md:grid">
            <span>Request</span><span>Status</span><span>Submitted</span><span>Target (sample)</span><span className="text-right">Actions</span>
          </div>
          <ul className="divide-y divide-[#EDF1F4]">
            {filtered.map((r) => (
              <li key={r.id} className="px-5 py-4 transition hover:bg-[#F7F9FA] sm:px-6 md:grid md:grid-cols-[1.1fr_1fr_0.9fr_0.9fr_0.5fr] md:items-center md:gap-4">
                <div className="min-w-0">
                  <Link href={`/dashboard/requests/${r.id}`} className="font-mono text-xs font-bold text-[#274C77] hover:underline">{r.id}</Link>
                  <Link href={`/dashboard/requests/${r.id}`} className="mt-0.5 block truncate text-sm font-semibold">{r.title}</Link>
                  <p className="truncate text-xs text-[#647587]">{r.documentType}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 md:mt-0">
                  <StatusPill status={r.status} size="sm" />
                  <OverdueFlag targetAt={r.targetCompletionAt} status={r.status} />
                </div>
                <p className="mt-1.5 text-xs text-[#647587] md:mt-0">{formatDate(r.createdAt)}<span className="block text-[11px] text-[#9AA9B7]">{timeAgo(r.updatedAt)} update</span></p>
                <p className="mt-1.5 text-xs text-[#647587] md:mt-0">{formatDate(r.targetCompletionAt)}</p>
                <div className="mt-2 flex justify-start gap-2 md:mt-0 md:justify-end">
                  <Link href={`/dashboard/requests/${r.id}`} className="rounded-full border border-[#DCE4E9] px-3.5 py-1.5 text-xs font-semibold text-[#274C77] hover:border-[#6096BA]">Open</Link>
                  {["draft", "submitted", "action_required"].includes(r.status) && (
                    <button onClick={() => setConfirmDelete(r.id)} className="rounded-full border border-[#DCE4E9] p-1.5 text-[#9AA9B7] transition hover:border-[#B85C5C] hover:text-[#B85C5C]" title={`Delete ${r.id}`} aria-label={`Delete ${r.id}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Confirm deletion">
          <div className="absolute inset-0 bg-[#1D2C3B66]" onClick={() => setConfirmDelete(null)} />
          <div className="rise relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-semibold">Delete this request?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#647587]">
              <code className="font-mono text-xs text-[#274C77]">{confirmDelete}</code> will be removed from your local demo store, along with its history. Completed or approved files cannot be deleted.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-full border border-[#DCE4E9] px-4 py-2.5 text-sm font-semibold text-[#4A5C6E] hover:bg-[#F7F9FA]">Keep it</button>
              <button onClick={() => doDelete(confirmDelete)} className="flex-1 rounded-full bg-[#B85C5C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#9c4c4c]">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#647587]">Loading requests…</div>}>
      <RequestsInner />
    </Suspense>
  );
}
