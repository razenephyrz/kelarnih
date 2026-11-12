"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, UploadCloud, X, CheckCircle2, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { Field, ConfirmModal, toast } from "@/components/ui";
import { useRouter } from "next/navigation";

type DocState = { requirementKey: string; path: string; fileName: string; fileType: string; fileSize: number } | null;

function Inner() {
  const { me, loading, err } = useMe(["WARGA"]);
  const sp = useSearchParams();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [slug, setSlug] = useState(sp.get("layanan") ?? "");
  const [detail, setDetail] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ nama: "", nik: "", no_hp: "" });
  const [citizenNote, setCitizenNote] = useState("");
  const [docs, setDocs] = useState<Record<string, DocState>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [isPriority, setIsPriority] = useState(false);
  const [priorityReason, setPriorityReason] = useState("");
  const [priorityDetail, setPriorityDetail] = useState("");
  const [priorityEvidence, setPriorityEvidence] = useState<DocState>(null);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    mockApiFetch("/api/services").then((r) => parseJsonResponse(r)).then((j) => {
      setServices(j.services ?? []);
      if (!slug && j.services?.[0]) setSlug(j.services[0].slug);
      else if (sp.get("layanan")) setSlug(sp.get("layanan")!);
    });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!slug) return;
    mockApiFetch(`/api/services/${slug}`).then((r) => parseJsonResponse(r)).then((j) => {
      setDetail(j.service ?? null);
      setDocs({});
      setFormData((p: any) => ({ nama: p.nama, nik: p.nik, no_hp: p.no_hp }));
      setIsPriority(false);
    });
  }, [slug]);

  function visibleReqs() {
    if (!detail) return [];
    return (detail.requirements ?? []).filter((r: any) => {
      if (r.requirementType === "WAJIB" || r.requirementType === "OPSIONAL") return true;
      if (r.requirementType === "KONDISIONAL" && r.conditionField) {
        const v = formData[r.conditionField];
        return (r.conditionValues ?? []).includes(String(v));
      }
      return false;
    });
  }

  async function handleFile(key: string, file: File | undefined, isEvidence = false) {
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      toast("Jenis file harus PDF/JPG/PNG.", "err"); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast("Maksimal 5 MB.", "err"); return; }
    if (!isEvidence) setUploading((p) => ({ ...p, [key]: true }));
    else setUploading((p) => ({ ...p, __evidence: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await mockApiFetch("/api/upload", { method: "POST", body: fd });
      const j = await parseJsonResponse(r);
      if (!r.ok) { toast(j.error ?? "Upload gagal.", "err"); return; }
      const val = { requirementKey: key, path: j.path, fileName: j.fileName, fileType: j.fileType, fileSize: j.fileSize };
      if (isEvidence) setPriorityEvidence(val as any);
      else setDocs((p) => ({ ...p, [key]: val }));
      toast("File terunggah.", "ok");
    } catch { toast("Upload gagal.", "err"); }
    finally {
      if (!isEvidence) setUploading((p) => ({ ...p, [key]: false }));
      else setUploading((p) => ({ ...p, __evidence: false }));
    }
  }

  function validate(): string | null {
    if (!detail) return "Pilih layanan.";
    if (!formData.nama || !formData.nik) return "Nama & NIK wajib diisi.";
    const vis = visibleReqs();
    const missing = vis.filter((r: any) => r.requirementType === "WAJIB" && !docs[r.key]);
    // conditional wajib also
    const condMissing = vis.filter((r: any) => r.requirementType === "KONDISIONAL" && !docs[r.key]);
    // KONDISIONAL visible means required
    const allMissing = [...missing, ...condMissing];
    if (allMissing.length) return `Dokumen wajib belum lengkap: ${allMissing.map((r: any) => r.name).join(", ")}`;
    if (isPriority) {
      if (!detail.priorityEnabled) return "Layanan ini tidak mendukung prioritas.";
      if (!priorityReason) return "Alasan prioritas wajib dipilih.";
      if (["dika", "medis", "sekolah_kerja"].includes(priorityReason) && !priorityEvidence) return "Alasan ini mewajibkan bukti pendukung.";
    }
    return null;
  }

  async function submit() {
    const v = validate();
    if (v) { setError(v); setConfirm(false); return; }
    setError("");
    setSubmitting(true);
    try {
      const r = await mockApiFetch("/api/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: slug, formData, citizenNote,
          documents: Object.values(docs).filter(Boolean),
          isPriority, priorityReason: isPriority ? priorityReason : null,
          priorityDetail, priorityEvidencePath: priorityEvidence?.path ?? null,
        }),
      });
      const j = await parseJsonResponse(r);
      if (!r.ok) { setError(j.error ?? "Gagal mengirim."); setSubmitting(false); setConfirm(false); return; }
      toast("Pengajuan terkirim.", "ok");
      router.push(`/pengajuan/${j.application.id}`);
    } catch { setError("Jaringan bermasalah."); setSubmitting(false); setConfirm(false); }
  }

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  if (err) return <div className="grid min-h-screen place-items-center bg-[#f4e9de] p-4"><div className="card-soft max-w-md p-6 text-center"><p className="font-bold">{err}</p><Link href="/dashboard" className="text-[#c06b4a] font-bold">← Dashboard</Link></div></div>;

  const vis = visibleReqs();

  return (
    <AppShell user={me} title="Buat Pengajuan" subtitle="Pilih layanan, jawab pertanyaan kondisional, unggah persyaratan, lalu kirim.">
      <Link href="/pengajuan" className="flex items-center gap-1 text-sm font-bold text-[#5f3d4e]"><ArrowLeft size={15} /> Kembali</Link>
      <div className="mt-3 grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card-soft p-5">
            <Field label="Jenis layanan" required>
              <select value={slug} onChange={(e) => setSlug(e.target.value)} className="input-soft">
                {services.map((s) => <option key={s.slug} value={s.slug}>{s.name} — ±{s.baseSlaDays} hari {s.priorityEnabled ? "• bisa prioritas" : ""}</option>)}
              </select>
            </Field>
            {detail && <p className="mt-2 text-[13px] text-[#5f5752]">{detail.description} <Link href={`/layanan/${detail.slug}`} className="font-bold text-[#c06b4a]">Detail →</Link></p>}
          </div>

          <div className="card-soft p-5">
            <h3 className="font-extrabold">Data pemohon</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Nama lengkap" required><input className="input-soft" value={formData.nama ?? ""} onChange={(e) => setFormData((p: any) => ({ ...p, nama: e.target.value }))} placeholder="Sesuai KTP" /></Field>
              <Field label="NIK" required><input className="input-soft" value={formData.nik ?? ""} onChange={(e) => setFormData((p: any) => ({ ...p, nik: e.target.value }))} placeholder="16 digit" /></Field>
              <Field label="No. HP"><input className="input-soft" value={formData.no_hp ?? ""} onChange={(e) => setFormData((p: any) => ({ ...p, no_hp: e.target.value }))} placeholder="08xx" /></Field>
              <Field label="Catatan / keperluan"><input className="input-soft" value={citizenNote} onChange={(e) => setCitizenNote(e.target.value)} placeholder="Mis. untuk administrasi bank" /></Field>
            </div>
            {(detail?.conditions ?? []).length > 0 && (
              <div className="mt-3 grid gap-3 rounded-2xl bg-[#faf5ef] p-4 sm:grid-cols-2">
                {(detail.conditions as any[]).map((c: any) => (
                  <Field key={c.field} label={c.label} required hint="Menentukan dokumen kondisional yang muncul">
                    <select className="input-soft" value={formData[c.field] ?? ""} onChange={(e) => setFormData((p: any) => ({ ...p, [c.field]: e.target.value }))}>
                      <option value="">— Pilih —</option>
                      {(c.options ?? []).map((o: string) => <option key={o} value={o}>{o.replaceAll("_", " ")}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
            )}
          </div>

          <div className="card-soft p-5">
            <h3 className="font-extrabold">Dokumen persyaratan <span className="font-normal text-[#7a6f6a]">• PDF/JPG/PNG maks 5 MB</span></h3>
            <div className="mt-3 space-y-3">
              {vis.map((r: any) => (
                <div key={r.key} className="rounded-2xl border border-[#e9d5c6] p-3.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-extrabold">{r.name}</p>
                    <span className={`badge ml-auto ${r.requirementType === "WAJIB" ? "badge-red" : r.requirementType === "KONDISIONAL" ? "badge-amber" : "badge-muted"}`}>{r.requirementType}</span>
                  </div>
                  {r.whyNeeded && <p className="mt-0.5 text-[12px] text-[#7a6f6a]">Mengapa: {r.whyNeeded}</p>}
                  {docs[r.key] ? (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-[13px] font-bold text-green-900">
                      <CheckCircle2 size={16} /> <span className="truncate">{docs[r.key]!.fileName}</span>
                      <button onClick={() => setDocs((p) => ({ ...p, [r.key]: null }))} className="ml-auto rounded-lg bg-white px-2 py-1 text-[12px] text-[#991b1b]">Ganti</button>
                    </div>
                  ) : (
                    <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-[#e2c9b8] px-3 py-3 text-[13px] font-bold text-[#5f3d4e] hover:bg-[#faf5ef]">
                      <UploadCloud size={18} /> {uploading[r.key] ? "Mengunggah…" : "Pilih / seret file"}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFile(r.key, e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              ))}
              {vis.length === 0 && <p className="text-sm text-[#7a6f6a]">Lengkapi pertanyaan kondisional untuk melihat dokumen yang relevan.</p>}
            </div>
          </div>

          {detail?.priorityEnabled ? (
            <div className="card-soft border-orange-200 p-5">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={isPriority} onChange={(e) => setIsPriority(e.target.checked)} className="h-5 w-5 accent-[#c06b4a]" />
                <span className="font-extrabold"><Zap size={14} className="mr-1 inline text-[#c06b4a]" /> Ajukan Prioritas <span className="font-normal text-[#7a6f6a]">• target ilustratif hari ini sebelum 15.00</span></span>
              </label>
              {isPriority && (
                <div className="mt-3 grid gap-3">
                  <Field label="Alasan prioritas" required>
                    <select value={priorityReason} onChange={(e) => setPriorityReason(e.target.value)} className="input-soft">
                      <option value="">— Pilih alasan —</option>
                      <option value="dika">Kematian / duka (wajib bukti)</option>
                      <option value="medis">Kebutuhan medis (wajib bukti)</option>
                      <option value="sekolah_kerja">Pendaftaran sekolah/pekerjaan bertenggat (wajib bukti)</option>
                      <option value="hukum">Urusan hukum</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </Field>
                  <Field label="Rincian alasan"><textarea rows={2} value={priorityDetail} onChange={(e) => setPriorityDetail(e.target.value)} className="input-soft" placeholder="Jelaskan tenggat / kebutuhan…" /></Field>
                  {["dika", "medis", "sekolah_kerja"].includes(priorityReason) && (
                    <div>
                      <p className="mb-1.5 text-[13px] font-bold">Bukti pendukung * <span className="font-normal text-[#7a6f6a]">wajib untuk alasan ini</span></p>
                      {priorityEvidence ? (
                        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-[13px] font-bold text-green-900"><CheckCircle2 size={16} /> <span className="truncate">{priorityEvidence.fileName}</span><button onClick={() => setPriorityEvidence(null)} className="ml-auto"><X size={15} /></button></div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-[#e2c9b8] px-3 py-3 text-[13px] font-bold">
                          <UploadCloud size={18} /> {uploading["__evidence"] ? "Mengunggah…" : "Unggah bukti"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFile("evidence", e.target.files?.[0], true)} />
                        </label>
                      )}
                    </div>
                  )}
                  <p className="text-[12px] text-[#7a6f6a]">Prioritas diputuskan petugas dengan alasan tertulis. Penolakan tidak membatalkan pengajuan utama.</p>
                </div>
              )}
            </div>
          ) : detail ? (
            <div className="card-soft p-4 text-[13px] text-[#7a6f6a]">Layanan ini memakai antrean normal (tidak dapat prioritas).</div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="card-soft p-5">
            <p className="font-extrabold">Ringkasan</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-[#5f5752]">
              <li>Layanan: <b>{detail?.name ?? "-"}</b></li>
              <li>Dokumen wajib terisi: <b>{vis.filter((r: any) => r.requirementType !== "OPSIONAL" && docs[r.key]).length}/{vis.filter((r: any) => r.requirementType !== "OPSIONAL").length}</b></li>
              <li>Estimasi: <b>±{detail?.baseSlaDays ?? "-"} hari kerja setelah verifikasi</b></li>
              <li>Prioritas: <b>{isPriority ? "Ya" : "Tidak"}</b></li>
            </ul>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-bold text-[#991b1b]">{error}</p>}
            <button onClick={() => { const v = validate(); if (v) { setError(v); window.scrollTo({ top: 0, behavior: "smooth" }); } else { setError(""); setConfirm(true); } }} className="btn-terra mt-3 w-full rounded-xl px-4 py-3 text-sm font-extrabold">Periksa & Kirim</button>
            <p className="mt-2 text-[12px] text-[#7a6f6a]">Dengan mengirim, Anda menyatakan data contoh benar untuk demo.</p>
          </div>
        </div>
      </div>
      <ConfirmModal open={confirm} title="Kirim permohonan?" desc={`Pengajuan ${detail?.name} akan dikirim dan tidak dapat diubah hingga ada permintaan perbaikan. Pastikan dokumen sudah benar.`} confirmLabel="Ya, kirim" loading={submitting} onConfirm={submit} onClose={() => setConfirm(false)} />
    </AppShell>
  );
}

export default function BaruPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center">Memuat…</div>}><Inner /></Suspense>;
}
