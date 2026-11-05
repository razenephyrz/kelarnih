"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock,
  Flag,
  Pencil,
  Trash2,
  Send,
  Building2,
  CalendarDays,
} from "lucide-react";
import { useCivic } from "@/lib/store";
import { PIPELINE_STAGES, STATUS_META, statusToStageIndex, type RequestStatus } from "@/types";
import { daysUntil, formatDate, formatDateTime, isOverdue, progressForStatus } from "@/lib/utils";
import { Field, OverdueFlag, ProgressRing, StatusPill, inputCls } from "@/components/ui";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const search = useSearchParams();
  const isFresh = search.get("fresh") === "1";
  const { myRequests, requests, history, notifications, user, updateRequest, deleteRequest, resolveAction, changeStatus } = useCivic();
  const router = useRouter();

  const request = myRequests.find((r) => r.id === id) ?? (user?.role === "admin" ? requests.find((r) => r.id === id) : undefined);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState(isFresh ? "Request submitted — tracking is now live below." : "");
  const [editError, setEditError] = useState("");

  const reqHistory = useMemo(
    () => history.filter((h) => h.requestId === id).sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)),
    [history, id]
  );
  const reqNotifs = useMemo(
    () => notifications.filter((n) => n.requestId === id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [notifications, id]
  );

  React.useEffect(() => {
    if (request) {
      setTitle(request.title);
      setDescription(request.description);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  React.useEffect(() => {
    if (isFresh) {
      const t = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(t);
    }
  }, [isFresh]);

  if (!request) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/requests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#274C77]"><ArrowLeft size={15} /> Back to requests</Link>
        <div className="rounded-3xl border border-[#DCE4E9] bg-white p-10 text-center">
          <h1 className="font-display text-2xl">Request not found</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#647587]">No file with ID <code className="font-mono text-xs">{id}</code> belongs to your account. It may have been deleted, or the link is incorrect.</p>
          <Link href="/dashboard/requests" className="mt-5 inline-block rounded-full bg-[#274C77] px-6 py-2.5 text-sm font-semibold text-white">View my requests</Link>
        </div>
      </div>
    );
  }

  const stageIdx = statusToStageIndex(request.status);
  const pct = progressForStatus(request.status, request.createdAt, request.targetCompletionAt);
  const overdue = isOverdue(request.targetCompletionAt, request.status);
  const editable = ["draft", "submitted", "action_required"].includes(request.status);
  const isOwner = user && request.ownerId === user.id;
  const canEdit = (isOwner && editable) || user?.role === "admin";

  const saveEdit = () => {
    if (title.trim().length < 6) {
      setEditError("Title must be at least 6 characters.");
      return;
    }
    if (description.trim().length < 12) {
      setEditError("Description must be at least 12 characters.");
      return;
    }
    setEditError("");
    updateRequest(request.id, { title: title.trim(), description: description.trim() }, `Details edited by ${user?.name}.`);
    setEditing(false);
    setNotice("Details updated. History entry recorded.");
    setTimeout(() => setNotice(""), 3500);
  };

  const doResolve = () => {
    if (!resolveNote.trim() && request.requiredActions.length > 0) {
      setNotice("Please describe what you resubmitted so the reviewer has context.");
      return;
    }
    resolveAction(request.id, resolveNote.trim() || "Applicant resubmitted requested information.");
    setResolving(false);
    setResolveNote("");
    setNotice("Resubmitted — your file is back in the review queue.");
    setTimeout(() => setNotice(""), 4000);
  };

  const doDelete = () => {
    const res = deleteRequest(request.id);
    if (!res.ok) {
      setNotice(res.error ?? "Could not delete.");
      setConfirmDelete(false);
      return;
    }
    router.push("/dashboard/requests");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#647587]">
        <Link href="/dashboard" className="hover:text-[#274C77]">Overview</Link>
        <span>/</span>
        <Link href="/dashboard/requests" className="hover:text-[#274C77]">Requests</Link>
        <span>/</span>
        <span className="font-mono font-semibold text-[#274C77]">{request.id}</span>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-[#39856A44] bg-[#EFF6F1] px-4 py-3 text-[13px] font-medium text-[#2E6B57]">
          <CheckCircle2 size={15} /> {notice}
        </p>
      )}

      {/* header panel */}
      <div className="mesh-header grain relative overflow-hidden rounded-[28px] border border-[#DCE4E9] p-6 sm:p-8">
        <div className="blob -right-12 -top-14 h-52 w-52 rounded-[46%_54%_52%_48%/48%_46%_54%_52%] bg-gradient-to-br from-[#A3CEF1] to-transparent opacity-60 blur-2xl" />
        <div className="relative flex flex-wrap gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#274C77]">{request.id}</span>
              <StatusPill status={request.status} />
              <OverdueFlag targetAt={request.targetCompletionAt} status={request.status} />
              {request.escalationFlag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#274C77] px-2.5 py-1 text-[11px] font-semibold text-white"><Flag size={11} /> Follow-up flagged</span>
              )}
            </div>
            {!editing ? (
              <>
                <h1 className="font-display mt-2 text-2xl font-medium leading-tight sm:text-3xl">{request.title}</h1>
                <p className="mt-1 text-sm font-medium text-[#4A5C6E]">{request.documentType}</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4A5C6E]">{request.description}</p>
              </>
            ) : (
              <div className="mt-3 max-w-2xl space-y-3 rounded-2xl bg-white/80 p-4">
                <Field label="Title">
                  <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Edit title" />
                </Field>
                <Field label="Description">
                  <textarea className={`${inputCls} min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Edit description" />
                </Field>
                {editError && <p className="text-xs font-medium text-[#B85C5C]">{editError}</p>}
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="rounded-full bg-[#274C77] px-4 py-2 text-[13px] font-semibold text-white">Save changes</button>
                  <button onClick={() => setEditing(false)} className="rounded-full border border-[#DCE4E9] bg-white px-4 py-2 text-[13px] font-semibold">Cancel</button>
                </div>
              </div>
            )}
            <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-3">
              <span className="flex items-center gap-2 text-[#4A5C6E]"><Building2 size={14} className="text-[#6096BA]" /> {request.assignedDepartment}</span>
              <span className="flex items-center gap-2 text-[#4A5C6E]"><CalendarDays size={14} className="text-[#6096BA]" /> Filed {formatDate(request.createdAt)}</span>
              <span className="flex items-center gap-2 text-[#4A5C6E]">
                <Clock size={14} className="text-[#6096BA]" />
                {overdue ? <strong className="text-[#8E4444]">Past sample target</strong> : <>Sample estimate: {formatDate(request.targetCompletionAt)} ({daysUntil(request.targetCompletionAt)}d)</>}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#647587]">{STATUS_META[request.status].description} Estimates are demonstration values, not guaranteed completion dates.</p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2 rounded-3xl border border-white/60 bg-white/80 px-6 py-5 backdrop-blur">
            <ProgressRing value={pct} size={124} stroke={11} label={`${pct}%`} sub={STATUS_META[request.status].label} />
            <p className="text-[11px] text-[#647587]">Stage {Math.min(5, stageIdx + 1)} of 5</p>
          </div>
        </div>

        {/* actions */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#274C77] ring-1 ring-[#DCE4E9] hover:ring-[#6096BA]">
              <Pencil size={14} /> Edit details
            </button>
          )}
          {request.status === "action_required" && isOwner && (
            <button onClick={() => setResolving((v) => !v)} className="cut-corner-sm inline-flex items-center gap-1.5 bg-[#B78032] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#96692a]">
              <Send size={14} /> Resubmit information
            </button>
          )}
          {editable && (
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#B85C5C] ring-1 ring-[#DCE4E9] hover:ring-[#B85C5C]">
              <Trash2 size={14} /> Delete
            </button>
          )}
          {!editable && isOwner && user?.role !== "admin" && (
            <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-2 text-xs text-[#647587] ring-1 ring-[#DCE4E9]">
              Editing locked — this file is past the editable stage. Contact the {request.assignedDepartment} for changes.
            </span>
          )}
        </div>

        {resolving && (
          <div className="relative mt-4 rounded-2xl border border-[#E8D9B5] bg-[#FFFBF0] p-4">
            <p className="text-sm font-semibold text-[#5c4a1f]">What did you provide?</p>
            <ul className="mt-1.5 space-y-1">
              {request.requiredActions.map((a) => (
                <li key={a} className="flex items-start gap-2 text-[13px] text-[#5c4a1f]"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#B78032]" />{a}</li>
              ))}
            </ul>
            <textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="e.g. Uploaded a 300dpi scan of the attestation; confirmed spelling is 'Elio'…" className={`${inputCls} mt-3 min-h-20`} aria-label="Resubmission note" />
            <div className="mt-2.5 flex gap-2">
              <button onClick={doResolve} className="rounded-full bg-[#274C77] px-4 py-2 text-[13px] font-semibold text-white">Submit & return to review</button>
              <button onClick={() => setResolving(false)} className="rounded-full border border-[#DCE4E9] bg-white px-4 py-2 text-[13px] font-semibold">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* timeline */}
        <section className="rounded-3xl border border-[#DCE4E9] bg-white p-6 sm:p-7" aria-label="Tracking timeline">
          <h2 className="font-display text-lg font-semibold">Tracking timeline</h2>
          <p className="text-xs text-[#647587]">Connected path of completed, current, and upcoming stages.</p>
          <div className="mt-5 flex items-center gap-1" aria-hidden>
            {PIPELINE_STAGES.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center gap-1">
                <div className="flex-1">
                  <div className={`h-2 rounded-full ${i < stageIdx ? "bg-[#39856A]" : i === stageIdx ? "bg-gradient-to-r from-[#274C77] to-[#6096BA]" : "bg-[#E7ECEF]"}`} />
                  <p className={`mt-1.5 hidden text-[10px] leading-tight font-semibold sm:block ${i <= stageIdx ? "text-[#274C77]" : "text-[#9AA9B7]"}`}>{s.label}</p>
                </div>
                {i < PIPELINE_STAGES.length - 1 && <span className={`h-px w-2 ${i < stageIdx ? "bg-[#39856A]" : "bg-[#DCE4E9]"}`} />}
              </div>
            ))}
          </div>
          <div className="timeline-spine relative mt-6 space-y-6 pl-12">
            {PIPELINE_STAGES.map((s, i) => {
              const done = i < stageIdx || request.status === "completed";
              const current = i === stageIdx && request.status !== "completed";
              return (
                <div key={s.key} className="relative">
                  <span className={`absolute -left-12 grid h-10 w-10 place-items-center rounded-full border-2 ${done ? "border-[#39856A] bg-[#39856A] text-white" : current ? "border-[#274C77] bg-white text-[#274C77]" : "border-[#DCE4E9] bg-[#F7F9FA] text-[#9AA9B7]"}`}>
                    {done ? <CheckCircle2 size={17} /> : current ? <span className="h-2.5 w-2.5 rounded-full bg-[#274C77] pulse-dot" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </span>
                  <p className={`text-sm font-semibold ${current ? "text-[#274C77]" : done ? "text-[#1D2C3B]" : "text-[#9AA9B7]"}`}>
                    {s.label} {current && <span className="ml-1 rounded-full bg-[#D8E8F5] px-2 py-0.5 text-[10px] font-bold">CURRENT</span>}
                  </p>
                  <p className="text-xs text-[#647587]">{s.hint}</p>
                  {current && <p className="mt-1 text-[13px] leading-relaxed text-[#4A5C6E]">{STATUS_META[request.status].description}</p>}
                </div>
              );
            })}
          </div>

          {/* history */}
          <h3 className="font-display mt-8 text-base font-semibold">Status history</h3>
          <p className="text-xs text-[#647587]">Chronological audit — actor, timestamp, and explanation for every change.</p>
          {reqHistory.length === 0 ? (
            <p className="mt-3 text-sm text-[#647587]">No history entries yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {[...reqHistory].reverse().map((h) => (
                <li key={h.id} className="rounded-2xl border border-[#EDF1F4] bg-[#F7F9FA] p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#E7ECEF] px-2 py-0.5 font-mono font-semibold text-[#4A5C6E]">{h.previousStatus === "—" ? "new" : (STATUS_META[h.previousStatus as RequestStatus]?.label ?? h.previousStatus)}</span>
                    <span className="text-[#9AA9B7]">→</span>
                    <StatusPill status={h.newStatus} size="sm" />
                    <span className="ml-auto text-[11px] text-[#9AA9B7]">{formatDateTime(h.timestamp)}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed">{h.explanation}</p>
                  <p className="mt-1 text-[11px] text-[#647587]">by {h.actorName} · {h.actorRole}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* side */}
        <div className="space-y-5">
          {request.requiredActions.length > 0 && (
            <section className="rounded-3xl border border-[#E8D9B5] bg-[#FFFBF0] p-5" aria-label="Required actions">
              <p className="flex items-center gap-2 text-sm font-bold text-[#7A5A1F]"><CircleAlert size={15} /> Missing items</p>
              <ul className="mt-2.5 space-y-1.5">
                {request.requiredActions.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-[13px] text-[#5c4a1f]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B78032]" />{a}</li>
                ))}
              </ul>
              {request.delayReason && <p className="mt-2.5 border-t border-[#E8D9B5] pt-2.5 text-xs text-[#7A5A1F]"><strong>Reviewer note:</strong> {request.delayReason}</p>}
            </section>
          )}

          <section className="cut-corner-sm bg-[#1D2C3B] p-5 text-white" aria-label="File facts">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#A3CEF1] uppercase">File facts</p>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              {[
                ["Submitted", formatDateTime(request.createdAt)],
                ["Last update", formatDateTime(request.updatedAt)],
                ["Sample target", `${formatDate(request.targetCompletionAt)}${overdue ? " — past target" : ""}`],
                ["Department", request.assignedDepartment],
                ...Object.entries(request.metadata).slice(0, 4).map(([k, v]) => [k, v] as [string, string]),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-white/10 pb-2">
                  <dt className="text-white/60 capitalize">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-3xl border border-[#DCE4E9] bg-white p-5" aria-label="Related notifications">
            <h3 className="font-display text-base font-semibold">Related notifications</h3>
            {reqNotifs.length === 0 ? (
              <p className="mt-2 text-[13px] text-[#647587]">No messages linked to this file yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {reqNotifs.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-[#F7F9FA] p-3">
                    <p className="text-[13px] font-semibold">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[#647587]">{n.message}</p>
                    <p className="mt-1 text-[11px] text-[#9AA9B7]">{formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/inbox" className="mt-3 inline-block text-[13px] font-semibold text-[#274C77] underline underline-offset-2">Open inbox</Link>
          </section>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Confirm deletion">
          <div className="absolute inset-0 bg-[#1D2C3B66]" onClick={() => setConfirmDelete(false)} />
          <div className="rise relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-semibold">Delete {request.id}?</h3>
            <p className="mt-2 text-sm text-[#647587]">This removes the file and its history from the local demo store. This cannot be undone.</p>
            <div className="mt-5 flex gap-2.5">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-full border border-[#DCE4E9] px-4 py-2.5 text-sm font-semibold">Keep it</button>
              <button onClick={doDelete} className="flex-1 rounded-full bg-[#B85C5C] px-4 py-2.5 text-sm font-semibold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
