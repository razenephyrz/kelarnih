"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { useCivic } from "@/lib/store";
import { Field, PageHeader, inputCls } from "@/components/ui";

export default function NewRequestPage() {
  const { procedures, createRequest, user } = useCivic();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState(procedures[0]?.name ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meta1, setMeta1] = useState("");
  const [meta2, setMeta2] = useState("");
  const [delivery, setDelivery] = useState("Pickup");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const proc = useMemo(() => procedures.find((p) => p.name === docType), [procedures, docType]);

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s >= 1 && !docType) e.docType = "Choose a document type.";
    if (s >= 2) {
      if (title.trim().length < 6) e.title = "Give a clear title (min. 6 characters).";
      if (description.trim().length < 12) e.description = "Describe the purpose (min. 12 characters).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((v) => Math.min(3, v + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      const created = createRequest({
        documentType: docType,
        title,
        description,
        assignedDepartment: proc?.responsibleDepartment ?? "Front Office",
        targetDays: proc?.processingDays ?? 7,
        metadata: {
          detail: meta1 || "—",
          reference: meta2 || "—",
          delivery,
          procedure: proc?.id ?? "",
        },
      });
      router.push(`/dashboard/requests/${created.id}?fresh=1`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Create request"
        title="File a new request"
        copy="Three quick steps. A unique tracking ID, an initial status, and an inbox confirmation are generated automatically."
        actions={
          <Link href="/dashboard/requests" className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4E9] bg-white px-4 py-2 text-[13px] font-semibold text-[#4A5C6E] hover:border-[#6096BA]">
            <ArrowLeft size={14} /> Back to list
          </Link>
        }
      />

      {/* stepper */}
      <ol className="flex items-center gap-2" aria-label="Progress">
        {["Document", "Details", "Review"].map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold ${done ? "bg-[#39856A] text-white" : active ? "bg-[#274C77] text-white" : "bg-[#E7ECEF] text-[#647587]"}`}>
                {done ? "✓" : n}
              </span>
              <span className={`text-[13px] font-semibold ${active ? "text-[#274C77]" : "text-[#647587]"} hidden sm:block`}>{label}</span>
              {n < 3 && <span className="mx-1 h-px flex-1 bg-[#DCE4E9]" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-[#DCE4E9] bg-white p-6 sm:p-7">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Which document do you need?</h2>
              <div className="grid gap-2.5">
                {procedures.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setDocType(p.name)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      docType === p.name ? "border-[#274C77] bg-[#E7ECEF55] ring-2 ring-[#A3CEF144]" : "border-[#DCE4E9] hover:border-[#6096BA]"
                    }`}
                    aria-pressed={docType === p.name}
                  >
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${docType === p.name ? "bg-[#274C77] text-white" : "bg-[#E7ECEF] text-[#274C77]"}`}>
                      <FileText size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{p.name}</span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-[#647587]">{p.responsibleDepartment} · sample target {p.processingTarget}</span>
                    </span>
                    {docType === p.name && <CheckCircle2 size={18} className="ml-auto shrink-0 text-[#39856A]" />}
                  </button>
                ))}
              </div>
              {errors.docType && <p className="text-xs font-medium text-[#B85C5C]">{errors.docType}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Describe your need</h2>
              <Field label="Request title or purpose" error={errors.title}>
                <input className={inputCls} placeholder="e.g. Residence certificate for school enrollment" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Request title" />
              </Field>
              <Field label="Description" error={errors.description} hint="Include the purpose and any reference that helps the officer route your file.">
                <textarea className={`${inputCls} min-h-28 resize-y`} placeholder="Explain why you need this document and any relevant context…" value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Additional detail (optional)">
                  <input className={inputCls} placeholder="e.g. 14 Harbor Lane, Apt 4B" value={meta1} onChange={(e) => setMeta1(e.target.value)} aria-label="Additional detail" />
                </Field>
                <Field label="Reference (optional)">
                  <input className={inputCls} placeholder="e.g. School file #2026-118" value={meta2} onChange={(e) => setMeta2(e.target.value)} aria-label="Reference" />
                </Field>
              </div>
              <Field label="Preferred delivery">
                <div className="flex gap-2">
                  {["Pickup", "Download", "Email + pickup"].map((d) => (
                    <button key={d} type="button" onClick={() => setDelivery(d)} className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${delivery === d ? "bg-[#274C77] text-white" : "border border-[#DCE4E9] text-[#4A5C6E] hover:border-[#6096BA]"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Review before submitting</h2>
              <div className="overflow-hidden rounded-2xl border border-[#DCE4E9]">
                <div className="bg-gradient-to-r from-[#274C77] to-[#6096BA] px-5 py-4 text-white">
                  <p className="text-xs opacity-80">New file · ID assigned on submit</p>
                  <p className="font-display text-lg font-semibold">{title || "Untitled request"}</p>
                </div>
                <dl className="divide-y divide-[#EDF1F4] bg-white px-5 text-sm">
                  {[
                    ["Document type", docType],
                    ["Purpose", description || "—"],
                    ["Department", proc?.responsibleDepartment ?? "—"],
                    ["Sample target", proc?.processingTarget ?? "—"],
                    ["Delivery", delivery],
                    ["Detail", meta1 || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-2.5">
                      <dt className="text-xs font-semibold text-[#647587] uppercase tracking-wide">{k}</dt>
                      <dd className="text-[13px]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="rounded-2xl bg-[#E7ECEF66] px-4 py-3 text-xs leading-relaxed text-[#4A5C6E]">
                Submitting creates a <strong>Submitted</strong> status, a history entry, and an inbox notification. Your file will appear in the dashboard immediately and persist across refreshes.
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-2.5">
            {step > 1 && (
              <button onClick={() => setStep((v) => v - 1)} className="rounded-full border border-[#DCE4E9] px-5 py-2.5 text-sm font-semibold text-[#4A5C6E] hover:bg-[#F7F9FA]">
                Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={next} className="cut-corner-sm inline-flex flex-1 items-center justify-center gap-2 bg-[#274C77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3c5e]">
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button onClick={submit} disabled={busy} className="cut-corner-sm inline-flex flex-1 items-center justify-center gap-2 bg-[#39856A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2e6b57] disabled:opacity-60">
                {busy ? "Submitting…" : <><CheckCircle2 size={15} /> Submit request</>}
              </button>
            )}
          </div>
        </div>

        {/* side guide */}
        <aside className="h-fit rounded-3xl border border-[#DCE4E9] bg-[#E7ECEF66] p-6">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#274C77] uppercase">What happens next</p>
          <ol className="mt-3 space-y-3 text-[13px] leading-relaxed text-[#4A5C6E]">
            <li className="flex gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#274C77] text-[11px] font-bold text-white">1</span> Front office verifies your submission.</li>
            <li className="flex gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#6096BA] text-[11px] font-bold text-white">2</span> The responsible unit reviews the dossier.</li>
            <li className="flex gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-[#274C77] ring-1 ring-[#DCE4E9]">3</span> You are notified of decisions or missing items.</li>
          </ol>
          {proc && (
            <div className="mt-5 rounded-2xl bg-white p-4">
              <p className="text-[13px] font-bold">{proc.name}</p>
              <p className="mt-1 text-xs text-[#647587]">{proc.requiredDocuments.length} items on the checklist · {proc.procedureSteps.length} steps</p>
              <Link href={`/dashboard/documents/${proc.id}`} className="mt-2 inline-block text-xs font-semibold text-[#274C77] underline underline-offset-2">Read the full procedure</Link>
            </div>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-[#9AA9B7]">Signed in as {user?.name} · demonstration store, local only.</p>
        </aside>
      </div>
    </div>
  );
}
