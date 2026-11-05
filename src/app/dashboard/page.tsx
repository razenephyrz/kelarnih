"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CircleAlert, FileText, Inbox, Plus } from "lucide-react";
import { useCivic } from "@/lib/store";
import { STATUS_META, statusToStageIndex, PIPELINE_STAGES } from "@/types";
import { daysUntil, formatDate, isOverdue, progressForStatus, timeAgo } from "@/lib/utils";
import { DemoBanner, OverdueFlag, ProgressBar, ProgressRing, StatusPill } from "@/components/ui";

export default function DashboardOverview() {
  const { user, myRequests, myNotifications, unreadCount } = useCivic();
  if (!user) return null;

  const total = myRequests.length;
  const inProgress = myRequests.filter((r) => ["submitted", "under_review"].includes(r.status)).length;
  const actionNeeded = myRequests.filter((r) => r.status === "action_required").length;
  const completed = myRequests.filter((r) => ["completed", "approved"].includes(r.status)).length;
  const recent = [...myRequests].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);
  const actionList = myRequests.filter((r) => r.status === "action_required");
  const latest = myRequests.find((r) => !["draft"].includes(r.status)) ?? myRequests[0];
  const latestNotifs = myNotifications.slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* welcome */}
      <div className="mesh-header grain relative overflow-hidden rounded-[28px] border border-[#DCE4E9] px-6 py-7 sm:px-9">
        <div className="blob -right-14 -top-16 h-60 w-60 rounded-[46%_54%_52%_48%/48%_46%_54%_52%] bg-gradient-to-br from-[#A3CEF1] to-transparent opacity-60 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6096BA]">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="font-display mt-1.5 text-3xl font-medium sm:text-4xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4A5C6E]">
              {total === 0
                ? "You have no requests yet — file your first one and watch it move."
                : `You have ${total} request${total === 1 ? "" : "s"} · ${inProgress} in progress${actionNeeded ? ` · ${actionNeeded} need${actionNeeded === 1 ? "s" : ""} your attention` : ""}.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href="/dashboard/requests/new" className="cut-corner-sm inline-flex items-center gap-2 bg-[#274C77] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1e3c5e]">
                <Plus size={15} /> New request
              </Link>
              <Link href="/dashboard/requests" className="inline-flex items-center gap-2 rounded-full border border-[#274C77] bg-white/70 px-5 py-2.5 text-[13px] font-semibold text-[#274C77] hover:bg-white">
                View all <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          {/* metric orbit strip */}
          <div className="flex items-center gap-5 rounded-3xl border border-white/60 bg-white/70 px-6 py-4 backdrop-blur">
            {[
              { v: total, l: "Total", c: "#274C77" },
              { v: inProgress, l: "In progress", c: "#6096BA" },
              { v: actionNeeded, l: "Action", c: "#B78032" },
              { v: completed, l: "Done", c: "#39856A" },
            ].map((m) => (
              <div key={m.l} className="text-center">
                <p className="font-display text-2xl font-semibold" style={{ color: m.c }}>{m.v}</p>
                <p className="text-[11px] font-medium text-[#647587]">{m.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DemoBanner />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* recent requests */}
        <section className="rounded-3xl border border-[#DCE4E9] bg-white p-5 sm:p-6" aria-label="Recent requests">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent requests</h2>
            <Link href="/dashboard/requests" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#274C77]">
              All requests <ArrowUpRight size={14} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-[#F7F9FA] p-8 text-center">
              <FileText size={22} className="mx-auto text-[#9AA9B7]" />
              <p className="mt-2 text-sm font-semibold">No requests yet</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] text-[#647587]">Create your first administrative request to see tracking, timelines, and reminders here.</p>
              <Link href="/dashboard/requests/new" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#274C77] px-5 py-2.5 text-[13px] font-semibold text-white">
                <Plus size={14} /> Create request
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#EDF1F4]">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/dashboard/requests/${r.id}`} className="group flex items-center gap-4 py-3.5">
                    <span className="hidden h-10 w-1.5 shrink-0 rounded-full sm:block" style={{ background: STATUS_META[r.status].dot }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#274C77]">{r.id}</span>
                        <StatusPill status={r.status} size="sm" />
                        <OverdueFlag targetAt={r.targetCompletionAt} status={r.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-[#1D2C3B] group-hover:text-[#274C77]">{r.title}</p>
                      <p className="truncate text-xs text-[#647587]">{r.documentType} · updated {timeAgo(r.updatedAt)}</p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-[#9AA9B7] transition group-hover:translate-x-1 group-hover:text-[#274C77]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* latest progress */}
        <section className="cut-corner relative overflow-hidden bg-gradient-to-br from-[#274C77] to-[#3f6d9e] p-6 text-white" aria-label="Latest progress">
          <div className="grain absolute inset-0" />
          <div className="absolute -right-16 -bottom-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A3CEF1]">Now tracking</p>
            {latest ? (
              <>
                <p className="font-mono mt-2 text-xs text-white/70">{latest.id}</p>
                <h3 className="font-display mt-1 text-xl font-semibold leading-snug">{latest.title}</h3>
                <div className="mt-4 flex items-center gap-5">
                  <ProgressRing value={progressForStatus(latest.status, latest.createdAt, latest.targetCompletionAt)} size={108} stroke={10} label={`${progressForStatus(latest.status, latest.createdAt, latest.targetCompletionAt)}%`} sub={STATUS_META[latest.status].label} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-white/80">{STATUS_META[latest.status].description}</p>
                    <p className="mt-2 text-xs text-[#A3CEF1]">
                      {isOverdue(latest.targetCompletionAt, latest.status)
                        ? "Past sample target — flagged for review"
                        : `Sample estimate: ${formatDate(latest.targetCompletionAt)} (${daysUntil(latest.targetCompletionAt)}d)`}
                    </p>
                    <Link href={`/dashboard/requests/${latest.id}`} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#274C77]">
                      Open timeline <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
                {/* mini stages */}
                <div className="mt-5 flex items-center gap-1.5" aria-hidden>
                  {PIPELINE_STAGES.map((s, i) => {
                    const idx = statusToStageIndex(latest.status);
                    return (
                      <span key={s.key} className="flex flex-1 items-center gap-1.5">
                        <span className={`h-2 flex-1 rounded-full ${i <= idx ? "bg-[#A3CEF1]" : "bg-white/20"}`} />
                      </span>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-white/60">
                  <span>Received</span><span>Issuance</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-white/80">No active file yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* action required */}
        <section className="rounded-3xl border border-[#DCE4E9] bg-white p-5 sm:p-6" aria-label="Action required">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F7EBCF] text-[#7A5A1F]"><CircleAlert size={17} /></span>
            <div>
              <h2 className="font-display text-lg font-semibold">Action required</h2>
              <p className="text-xs text-[#647587]">{actionList.length ? `${actionList.length} file${actionList.length === 1 ? "" : "s"} waiting on you` : "Nothing waiting on you right now"}</p>
            </div>
          </div>
          {actionList.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-[#EFF6F1] px-4 py-3.5 text-[13px] text-[#2E6B57]">All clear — no missing documents or confirmations pending.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {actionList.map((r) => (
                <li key={r.id} className="rounded-2xl border border-[#E8D9B5] bg-[#FFFaf0] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#7A5A1F]">{r.id}</span>
                    <OverdueFlag targetAt={r.targetCompletionAt} status={r.status} />
                  </div>
                  <p className="mt-1 text-sm font-semibold">{r.title}</p>
                  <ul className="mt-2 space-y-1">
                    {r.requiredActions.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-[13px] text-[#5c4a1f]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B78032]" />{a}</li>
                    ))}
                  </ul>
                  <Link href={`/dashboard/requests/${r.id}`} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#274C77] px-4 py-2 text-xs font-semibold text-white">
                    Resolve now <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* notifications */}
        <section className="rounded-3xl border border-[#DCE4E9] bg-white p-5 sm:p-6" aria-label="Recent notifications">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E7ECEF] text-[#274C77]"><Inbox size={17} /></span>
              <div>
                <h2 className="font-display text-lg font-semibold">Recent notifications</h2>
                <p className="text-xs text-[#647587]">{unreadCount} unread · prototype messages</p>
              </div>
            </div>
            <Link href="/dashboard/inbox" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#274C77]">Inbox <ArrowUpRight size={14} /></Link>
          </div>
          {latestNotifs.length === 0 ? (
            <p className="mt-4 text-sm text-[#647587]">No messages yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {latestNotifs.map((n) => (
                <li key={n.id}>
                  <Link href={n.requestId ? `/dashboard/requests/${n.requestId}` : "/dashboard/inbox"} className="flex gap-3 rounded-2xl border border-[#EDF1F4] bg-[#F7F9FA] p-3.5 transition hover:border-[#6096BA66] hover:bg-white">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-[#DCE4E9]" : "bg-[#6096BA]"}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{n.title}</span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-[#647587]">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-[#9AA9B7]">{timeAgo(n.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <ProgressBar value={total ? Math.round((completed / Math.max(1, total)) * 100) : 0} />
            <p className="mt-1.5 text-[11px] text-[#647587]">{completed} of {total} requests completed or approved · derived live from your files</p>
          </div>
        </section>
      </div>
    </div>
  );
}
