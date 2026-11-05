"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Search } from "lucide-react";
import { useCivic } from "@/lib/store";
import { PageHeader, DemoBanner } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export default function DocumentsPage() {
  const { procedures } = useCivic();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const cats = useMemo(() => ["all", ...Array.from(new Set(procedures.map((p) => p.category)))], [procedures]);
  const filtered = useMemo(() => {
    return procedures.filter((p) => {
      const matchQ = !q.trim() || (p.name + p.description + p.responsibleDepartment).toLowerCase().includes(q.trim().toLowerCase());
      const matchC = cat === "all" || p.category === cat;
      return matchQ && matchC;
    });
  }, [procedures, q, cat]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Document guide"
        title="Procedures, in plain language"
        copy="Illustrative mock entries — eligibility, checklists, steps, and sample targets. Always labeled as demonstration content."
      />
      <DemoBanner />

      <div className="rounded-3xl border border-[#DCE4E9] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9AA9B7]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search procedures…" className="w-full rounded-full border border-[#DCE4E9] bg-[#F7F9FA] py-2 pr-4 pl-10 text-sm focus:border-[#6096BA] focus:bg-white focus:outline-none" aria-label="Search procedures" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${cat === c ? "bg-[#274C77] text-white" : "border border-[#DCE4E9] text-[#4A5C6E] hover:border-[#6096BA]"}`}>
              {c === "all" ? "All categories" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((p, i) => (
          <Link
            key={p.id}
            href={`/dashboard/documents/${p.id}`}
            className={`group relative overflow-hidden border border-[#DCE4E9] bg-white p-6 transition hover:border-[#6096BA66] hover:shadow-[0_16px_40px_rgba(39,76,119,0.10)] ${
              i % 3 === 0 ? "cut-corner-sm" : i % 3 === 1 ? "rounded-[26px_8px_26px_26px]" : "rounded-3xl"
            }`}
          >
            {i % 3 === 0 && <span className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-bl from-[#A3CEF1] to-transparent" aria-hidden />}
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#E7ECEF] text-[#274C77]"><BookOpenText size={17} /></span>
              <span className="rounded-full bg-[#E7ECEF] px-2.5 py-1 text-[11px] font-semibold text-[#4A5C6E]">{p.category}</span>
              <span className="ml-auto text-[11px] text-[#9AA9B7]">Verified {timeAgo(p.lastVerifiedAt)}</span>
            </div>
            <h3 className="font-display mt-3 text-xl font-semibold group-hover:text-[#274C77]">{p.name}</h3>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#647587]">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#647587]">
              <span><strong className="text-[#1D2C3B]">{p.requiredDocuments.length}</strong> documents</span>
              <span><strong className="text-[#1D2C3B]">{p.procedureSteps.length}</strong> steps</span>
              <span>Sample target: <strong className="text-[#274C77]">{p.processingTarget}</strong></span>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#274C77]">
              Read procedure <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="rounded-3xl border border-[#DCE4E9] bg-white p-8 text-center text-sm text-[#647587]">No procedures match your search.</p>}
    </div>
  );
}
