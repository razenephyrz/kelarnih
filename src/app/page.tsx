import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpenText,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Radar,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

const stages = [
  { label: "Received", state: "done", note: "CF-2026-481201 · intake" },
  { label: "Verification", state: "done", note: "Address matched" },
  { label: "Department review", state: "current", note: "Residency Unit · now" },
  { label: "Decision", state: "next", note: "Signing" },
  { label: "Issuance", state: "next", note: "Pickup" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#1D2C3B] overflow-x-clip">
      {/* top nav */}
      <header className="sticky top-0 z-30 border-b border-[#DCE4E9] bg-[#F7F9FAD9] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#274C77] to-[#6096BA] text-white shadow-[0_10px_24px_rgba(39,76,119,0.3)]">
              <Landmark size={17} />
            </span>
            <span className="font-display text-lg font-semibold">CivicFlow</span>
          </Link>
          <nav className="ml-8 hidden items-center gap-6 text-sm font-medium text-[#4A5C6E] md:flex" aria-label="Primary">
            <a href="#how" className="transition hover:text-[#274C77]">How it works</a>
            <a href="#features" className="transition hover:text-[#274C77]">Features</a>
            <a href="#timeline" className="transition hover:text-[#274C77]">Live tracking</a>
            <a href="#transparency" className="transition hover:text-[#274C77]">Transparency</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-[#274C77] transition hover:bg-[#E7ECEF]">
              Sign in
            </Link>
            <Link href="/register" className="cut-corner-sm bg-[#274C77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e3c5e]">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mesh-header grain relative overflow-hidden">
        <div className="blob left-[-80px] top-[-60px] h-72 w-72 rounded-[46%_54%_52%_48%/48%_46%_54%_52%] bg-gradient-to-br from-[#A3CEF1] to-[#E7ECEF] opacity-70 blur-2xl" />
        <div className="blob right-[6%] top-[18%] hidden h-56 w-56 rounded-[58%_42%_55%_45%/45%_55%_45%_55%] bg-white/70 blur-xl lg:block" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pt-14 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20 lg:pb-24">
          <div className="rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#6096BA44] bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-[#274C77]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39856A] pulse-dot" /> Demonstration prototype · sample data
            </p>
            <h1 className="font-display mt-5 text-[2.6rem] leading-[1.02] font-medium tracking-tight sm:text-6xl">
              Every document.
              <br />
              Every step.{" "}
              <em className="bg-gradient-to-r from-[#274C77] to-[#6096BA] bg-clip-text text-transparent not-italic font-semibold">
                Clear progress.
              </em>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[#4A5C6E]">
              CivicFlow helps citizens track administrative requests, understand what happens next, and see exactly
              where their file stands — from intake to issuance.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="cut-corner inline-flex items-center gap-2 bg-[#274C77] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(39,76,119,0.3)] transition hover:bg-[#1e3c5e]"
              >
                Track Your Request <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard/documents"
                className="inline-flex items-center gap-2 rounded-full border border-[#274C77] bg-white/70 px-7 py-3.5 text-sm font-semibold text-[#274C77] transition hover:bg-white"
              >
                <BookOpenText size={16} /> Explore Procedures
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#647587]">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#39856A]" /> Live status timeline</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#39856A]" /> Action reminders</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#39856A]" /> Sample targets, honestly labeled</span>
            </div>
          </div>

          {/* hero visual: layered docs + orbital */}
          <div className="rise rise-1 relative mx-auto w-full max-w-[440px]">
            <div className="relative">
              {/* orbit backdrop */}
              <div className="absolute -top-10 -right-6 h-44 w-44 rounded-full border border-dashed border-[#6096BA88] orbit-slow" />
              <div className="absolute -top-14 -right-10 h-56 w-56 rounded-full border border-[#A3CEF166] orbit-slower" />
              {/* layered sheets */}
              <div className="absolute top-8 left-6 h-[380px] w-[300px] rotate-[-7deg] rounded-2xl border border-[#DCE4E9] bg-white/60" />
              <div className="absolute top-4 left-10 h-[380px] w-[300px] rotate-[-3deg] rounded-2xl border border-[#DCE4E9] bg-white/85 shadow-sm" />
              {/* main ticket */}
              <div className="relative ml-14 w-[300px] overflow-hidden rounded-2xl border border-[#DCE4E9] bg-white shadow-[0_30px_70px_rgba(39,76,119,0.18)]">
                <div className="bg-gradient-to-r from-[#274C77] to-[#6096BA] px-5 py-4 text-white">
                  <p className="font-mono text-[11px] tracking-wider opacity-80">CF-2026-481201</p>
                  <p className="mt-1 text-[15px] font-semibold">Certificate of Residence</p>
                  <p className="text-xs opacity-80">School enrollment · Residency Unit</p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    {/* orbital progress */}
                    <div className="relative h-20 w-20 shrink-0">
                      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                        <circle cx="40" cy="40" r="32" stroke="#E7ECEF" strokeWidth="9" fill="none" />
                        <circle cx="40" cy="40" r="32" stroke="url(#heroGrad)" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="201" strokeDashoffset="80" />
                        <defs>
                          <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#274C77" />
                            <stop offset="100%" stopColor="#6096BA" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute inset-0 grid place-items-center text-sm font-bold text-[#274C77]">60%</span>
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#6096BA] ring-4 ring-[#A3CEF144]" />
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#D8E8F5] px-2.5 py-1 text-[11px] font-semibold text-[#274C77]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#6096BA] pulse-dot" /> Under Review
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#647587]">Step 3 of 5 · Decision expected in ~2 days (sample estimate)</p>
                    </div>
                  </div>
                  <div className="ticket-divider my-3.5" />
                  <div className="space-y-2">
                    {stages.slice(0, 3).map((s) => (
                      <div key={s.label} className="flex items-center gap-2.5 text-xs">
                        <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${s.state === "done" ? "bg-[#39856A] text-white" : s.state === "current" ? "bg-[#274C77] text-white" : "bg-[#E7ECEF] text-[#647587]"}`}>
                          {s.state === "done" ? "✓" : s.state === "current" ? "3" : "·"}
                        </span>
                        <span className={s.state === "current" ? "font-semibold text-[#1D2C3B]" : "text-[#4A5C6E]"}>{s.label}</span>
                        <span className="ml-auto text-[11px] text-[#9AA9B7]">{s.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* floating chip */}
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 rounded-2xl border border-[#DCE4E9] bg-white/95 px-4 py-2.5 text-xs shadow-[0_14px_30px_rgba(39,76,119,0.14)] backdrop-blur">
                <BellRing size={14} className="text-[#B78032]" />
                <span className="font-medium text-[#1D2C3B]">Reminder sent</span>
                <span className="text-[#647587]">· attestation scan needed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6096BA]">How it works</p>
          <h2 className="font-display mt-3 text-3xl font-medium sm:text-4xl">From submission to issuance, without the fog.</h2>
        </div>
        <div className="relative mt-10 grid gap-8 md:grid-cols-4">
          <div className="absolute top-7 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-[#274C77] via-[#6096BA] to-[#A3CEF1] md:block" aria-hidden />
          {[
            { n: "01", t: "File in minutes", d: "Pick a document type, describe your need, attach the checklist items.", icon: <FileCheck2 size={18} /> },
            { n: "02", t: "Follow the path", d: "Watch your file move through verification, review, and decision.", icon: <Radar size={18} /> },
            { n: "03", t: "Act when asked", d: "Get a clear notice if a scan or confirmation is missing.", icon: <BellRing size={18} /> },
            { n: "04", t: "Collect with proof", d: "See the full history — who did what, and when — at issuance.", icon: <ShieldCheck size={18} /> },
          ].map((s, i) => (
            <div key={s.n} className={`relative ${i % 2 === 1 ? "md:pt-8" : ""}`}>
              <div className="relative z-10 mb-4 inline-grid h-14 w-14 place-items-center rounded-full bg-white text-[#274C77] shadow-[0_12px_30px_rgba(39,76,119,0.12)] ring-1 ring-[#DCE4E9]">
                {s.icon}
                <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[#274C77] font-mono text-[10px] font-bold text-white">{s.n}</span>
              </div>
              <h3 className="font-display text-lg font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#647587]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES — asymmetric */}
      <section id="features" className="border-y border-[#DCE4E9] bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6096BA]">Key features</p>
            <h2 className="font-display mt-3 text-3xl font-medium sm:text-4xl">Designed for calm, accountable public service.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#647587]">
              No dense enterprise grids. Each capability answers one citizen question: where is my file, what do I do
              next, and who is accountable for delays?
            </p>
            <Link href="/register" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#274C77]">
              Create a free demo account <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="cut-corner bg-[#274C77] p-6 text-white">
              <SearchCheck size={20} />
              <h3 className="font-display mt-3 text-lg font-semibold">Live tracking</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">Stage timelines, history entries, and honest sample estimates — never fake guarantees.</p>
            </div>
            <div className="rounded-[26px_8px_26px_26px] border border-[#DCE4E9] bg-[#F7F9FA] p-6 sm:mt-8">
              <BookOpenText size={20} className="text-[#6096BA]" />
              <h3 className="font-display mt-3 text-lg font-semibold">Procedure guide</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#647587]">Eligibility, checklists, and pitfalls for each document — labeled as demo content.</p>
            </div>
            <div className="rounded-full border border-[#DCE4E9] bg-white p-6">
              <BellRing size={20} className="text-[#B78032]" />
              <h3 className="font-display mt-3 text-lg font-semibold">Smart reminders</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#647587]">Prototype inbox flags action-needed files and sample overdue targets.</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#E7ECEF] to-[#A3CEF1] p-6 sm:mt-8">
              <ShieldCheck size={20} className="text-[#274C77]" />
              <h3 className="font-display mt-3 text-lg font-semibold">Accountability</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3A4E61]">Delay reasons, escalation flags, and audit trails — review, never blame.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE TIMELINE */}
      <section id="timeline" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6096BA]">Sample tracking timeline</p>
            <h2 className="font-display mt-3 text-3xl font-medium sm:text-4xl">See what “under review” actually means.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#647587]">
              Every request carries a connected path of completed, current, and upcoming stages — plus a written history
              of each handoff. Below is a realistic sample from the demo dataset.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="cut-corner-sm inline-flex items-center gap-2 bg-[#274C77] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1e3c5e]">
                Open the live demo <ArrowRight size={15} />
              </Link>
              <span className="inline-flex items-center rounded-full border border-[#DCE4E9] bg-white px-4 py-2.5 text-xs text-[#647587]">
                citizen@example.com · password <code className="ml-1 rounded bg-[#E7ECEF] px-1.5 py-0.5 font-mono text-[#274C77]">civic1234</code>
              </span>
            </div>
          </div>
          <div className="relative rounded-[28px] border border-[#DCE4E9] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-semibold text-[#274C77]">CF-2026-377450</p>
                <p className="font-display text-lg font-semibold">Family Card Update</p>
              </div>
              <span className="rounded-full bg-[#F7EBCF] px-3 py-1.5 text-xs font-semibold text-[#7A5A1F]">Action Required</span>
            </div>
            <div className="timeline-spine relative mt-6 space-y-5 pl-12">
              {[
                { done: true, t: "Submitted", d: "Filed with birth attestation · 14 days ago" },
                { done: true, t: "Verification passed", d: "Move letter accepted · 10 days ago" },
                { done: false, current: true, t: "Awaiting clearer scan", d: "Upload attestation + confirm spelling ‘Elio’" },
                { done: false, t: "Department review", d: "Family Records · upcoming" },
                { done: false, t: "Issuance", d: "New card printing · upcoming" },
              ].map((s, i) => (
                <div key={i} className="relative">
                  <span className={`absolute -left-12 grid h-10 w-10 place-items-center rounded-full border-2 ${s.done ? "border-[#39856A] bg-[#39856A] text-white" : s.current ? "border-[#B78032] bg-white text-[#B78032]" : "border-[#DCE4E9] bg-white text-[#9AA9B7]"}`}>
                    {s.done ? <CheckCircle2 size={17} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </span>
                  <p className={`text-sm font-semibold ${s.current ? "text-[#7A5A1F]" : "text-[#1D2C3B]"}`}>{s.t}</p>
                  <p className="text-xs text-[#647587]">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRANSPARENCY */}
      <section id="transparency" className="mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
        <div className="cut-both relative overflow-hidden bg-gradient-to-br from-[#274C77] to-[#6096BA] px-6 py-12 text-white sm:px-12">
          <div className="grain absolute inset-0" />
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A3CEF1]">Transparency, honestly</p>
              <h2 className="font-display mt-3 text-3xl font-medium sm:text-4xl">Status history you can audit. Targets you can question.</h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/80">
                CivicFlow records every status change with actor, timestamp, and explanation. Sample processing targets
                are always labeled as demonstration values — and overdue files are flagged for review with documented
                reasons, never automatic blame.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { v: "100%", l: "History logged" },
                { v: "5", l: "Stages per file" },
                { v: "0", l: "Hidden steps" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-white/10 px-2 py-5 backdrop-blur border border-white/15">
                  <p className="font-display text-2xl font-semibold">{s.v}</p>
                  <p className="mt-1 text-[11px] text-white/70">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-[32px] border border-[#DCE4E9] bg-white px-6 py-12 text-center sm:px-12">
          <div className="blob left-1/2 top-0 h-48 w-[560px] -translate-x-1/2 rounded-[50%] bg-gradient-to-r from-[#E7ECEF] via-[#A3CEF1] to-[#E7ECEF] opacity-70 blur-2xl" />
          <div className="relative">
            <h2 className="font-display mx-auto max-w-xl text-3xl font-medium sm:text-4xl">Start tracking your first document today.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#647587]">Join the demo in seconds. No real personal data — everything stays in your browser.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="cut-corner inline-flex items-center gap-2 bg-[#274C77] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#1e3c5e]">
                Create account <ArrowRight size={15} />
              </Link>
              <Link href="/login" className="rounded-full border border-[#DCE4E9] px-7 py-3.5 text-sm font-semibold text-[#274C77] hover:border-[#6096BA]">
                Sign in to demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#DCE4E9] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-semibold">CivicFlow</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[#647587]">A calm, transparent prototype for tracking public administration requests. All content is demonstration data.</p>
          </div>
          {[
            { h: "Platform", links: [["About", "/about"], ["Help", "/help"], ["Document guide", "/dashboard/documents"]] },
            { h: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Transparency", "/#transparency"]] },
            { h: "Access", links: [["Sign in", "/login"], ["Register", "/register"], ["Admin demo", "/login"]] },
          ].map((c) => (
            <div key={c.h}>
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#9AA9B7] uppercase">{c.h}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {c.links.map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-[#4A5C6E] transition hover:text-[#274C77]">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#DCE4E9]">
          <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-[#9AA9B7]">© 2026 CivicFlow prototype. Mock authentication — not production-secure. Data persists locally in your browser.</p>
        </div>
      </footer>
    </div>
  );
}
