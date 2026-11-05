"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, CircleAlert, FileCheck2, ListChecks, Timer } from "lucide-react";
import { useCivic } from "@/lib/store";
import { DemoBanner } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function ProcedureDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { procedures } = useCivic();
  const [openStep, setOpenStep] = useState<number | null>(0);

  const proc = procedures.find((p) => p.id === id);
  if (!proc) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/documents" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#274C77]"><ArrowLeft size={15} /> Back to guide</Link>
        <div className="rounded-3xl border bg-white p-10 text-center"><h1 className="font-display text-2xl">Procedure not found</h1></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#647587]">
        <Link href="/dashboard" className="hover:text-[#274C77]">Overview</Link><span>/</span>
        <Link href="/dashboard/documents" className="hover:text-[#274C77]">Document guide</Link><span>/</span>
        <span className="font-semibold text-[#274C77]">{proc.name}</span>
      </div>

      <div className="mesh-header grain relative overflow-hidden rounded-[28px] border border-[#DCE4E9] p-6 sm:p-9">
        <div className="blob -right-10 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-[#A3CEF1] to-transparent opacity-60 blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#274C77] px-3 py-1 text-[11px] font-bold text-white">{proc.category}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#2E6B57] ring-1 ring-[#DCE4E9]"><BadgeCheck size={12} /> Illustrative mock entry</span>
          </div>
          <h1 className="font-display mt-3 max-w-2xl text-3xl font-medium sm:text-4xl">{proc.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A5C6E]">{proc.description}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#4A5C6E]">
            <span className="inline-flex items-center gap-1.5"><Building2 size={14} className="text-[#6096BA]" /> {proc.responsibleDepartment}</span>
            <span className="inline-flex items-center gap-1.5"><Timer size={14} className="text-[#6096BA]" /> Sample target: <strong>{proc.processingTarget}</strong></span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/dashboard/requests/new" className="cut-corner-sm inline-flex items-center gap-2 bg-[#274C77] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1e3c5e]">
              Start this request <ArrowRight size={15} />
            </Link>
            <Link href="/dashboard/documents" className="inline-flex items-center gap-2 rounded-full border border-[#DCE4E9] bg-white px-5 py-3 text-sm font-semibold text-[#4A5C6E] hover:border-[#6096BA]">
              <ArrowLeft size={14} /> All procedures
            </Link>
          </div>
        </div>
      </div>

      <DemoBanner />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-[#DCE4E9] bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><ListChecks size={18} className="text-[#6096BA]" /> Step-by-step procedure</h2>
            <div className="mt-4 space-y-2.5">
              {proc.procedureSteps.map((s, i) => {
                const open = openStep === i;
                return (
                  <div key={i} className={`overflow-hidden rounded-2xl border transition ${open ? "border-[#274C77] bg-[#F7F9FA]" : "border-[#DCE4E9]"}`}>
                    <button onClick={() => setOpenStep(open ? null : i)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold ${open ? "bg-[#274C77] text-white" : "bg-[#E7ECEF] text-[#274C77]"}`}>{i + 1}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{s.title}</span>
                        <span className="block text-xs text-[#647587]">{s.duration}</span>
                      </span>
                      <span className={`text-[#647587] transition ${open ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {open && <p className="px-4 pb-4 text-[13px] leading-relaxed text-[#4A5C6E]" style={{ paddingLeft: "3.75rem" }}>{s.detail}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCE4E9] bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><FileCheck2 size={18} className="text-[#39856A]" /> Required documents</h2>
            <ul className="mt-3 space-y-2">
              {proc.requiredDocuments.map((d) => (
                <li key={d} className="flex items-start gap-2.5 rounded-2xl bg-[#F7F9FA] px-4 py-2.5 text-[13px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#39856A] text-[10px] font-bold text-white">✓</span>{d}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 flex items-center gap-2 text-sm font-bold text-[#7A5A1F]"><CircleAlert size={15} /> Common reasons files stall</h3>
            <ul className="mt-2 space-y-1.5">
              {proc.commonPitfalls.map((c) => (
                <li key={c} className="flex items-start gap-2 text-[13px] text-[#5c4a1f]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B78032]" />{c}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <section className="cut-corner bg-[#274C77] p-6 text-white">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#A3CEF1] uppercase">Eligibility</p>
            <ul className="mt-3 space-y-2">
              {proc.eligibility.map((e) => (
                <li key={e} className="flex items-start gap-2 text-[13px] text-white/85"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A3CEF1]" />{e}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-[#DCE4E9] bg-white p-6 text-[13px]">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#647587] uppercase">Verification</p>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3"><dt className="text-[#647587]">Source</dt><dd className="text-right font-medium">{proc.sourceReference}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#647587]">Last verified</dt><dd className="font-medium">{formatDate(proc.lastVerifiedAt)} (sample)</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#647587]">Department</dt><dd className="text-right font-medium">{proc.responsibleDepartment}</dd></div>
            </dl>
            <p className="mt-3 rounded-2xl bg-[#E7ECEF66] p-3 text-xs leading-relaxed text-[#4A5C6E]">Treat this page as demonstration content, not verified procedure. Confirm requirements with the responsible unit before relying on them.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
