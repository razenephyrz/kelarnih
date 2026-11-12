"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, Star, UploadCloud, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { ConfirmModal, Field, Skeleton, toast } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/workflow";
import { formatWIB, formatDateWIB, slaStatus } from "@/lib/sla";

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me, loading } = useMe();
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [newDue, setNewDue] = useState("");
  const [fixFiles, setFixFiles] = useState<Record<string, any>>({});
  const [rating, setRating] = useState({ score: 5, category: "KECEPATAN", comment: "" });

  const load = useCallback(async () => {
    setFetching(true);
    const r = await mockApiFetch(`/api/applications/${id}`);
    const j = await parseJsonResponse(r);
    if (!r.ok) setErr(j.error ?? "Gagal memuat.");
    else setData(j);
    setFetching(false);
  }, [id]);
  useEffect(() => {
    if (me) queueMicrotask(() => { void load(); });
  }, [me, load]);

  async function doTransition(action: string, extra: any = {}) {
    setBusy(true);
    try {
      const r = await mockApiFetch(`/api/applications/${id}/transition`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, ...extra }),
      });
      const j = await parseJsonResponse(r);
      if (!r.ok) { toast(j.error ?? "Gagal.", "err"); setBusy(false); return; }
      toast("Berhasil diproses.", "ok");
      setModal(null); setNote(""); setNewDue("");
      await load();
    } catch { toast("Jaringan bermasalah.", "err"); }
    setBusy(false);
  }

  async function decidePriority(decision: "APPROVE" | "REJECT") {
    if (!note) { toast("Alasan tertulis wajib diisi.", "err"); return; }
    setBusy(true);
    try {
      const r = await mockApiFetch(`/api/applications/${id}/priority`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note }) });
      const j = await parseJsonResponse(r);
      if (!r.ok) { toast(j.error ?? "Gagal.", "err"); setBusy(false); return; }
      toast("Keputusan prioritas tersimpan.", "ok");
      setModal(null); setNote(""); await load();
    } catch { toast("Gagal.", "err"); }
    setBusy(false);
  }

  async function uploadFix(key: string, file: File | undefined) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    const r = await mockApiFetch("/api/upload", { method: "POST", body: fd });
    const j = await parseJsonResponse(r);
    if (!r.ok) { toast(j.error ?? "Upload gagal.", "err"); return; }
    setFixFiles((p) => ({ ...p, [key]: { requirementKey: key, path: j.path, fileName: j.fileName, fileType: j.fileType, fileSize: j.fileSize } }));
    toast("File siap dikirim.", "ok");
  }

  async function submitFix() {
    const arr = Object.values(fixFiles);
    if (!arr.length) { toast("Unggah minimal satu berkas perbaikan.", "err"); return; }
    setBusy(true);
    const r = await mockApiFetch(`/api/applications/${id}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documents: arr }) });
    const j = await parseJsonResponse(r);
    if (!r.ok) { toast(j.error ?? "Gagal.", "err"); setBusy(false); return; }
    // auto resubmit
    const r2 = await mockApiFetch(`/api/applications/${id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resubmit", note: "Perbaikan dokumen dikirim." }) });
    if (!r2.ok) { const jj = await parseJsonResponse(r2); toast(jj.error ?? "Perbaikan tersimpan, kirim ulang manual.", "err"); }
    else toast("Perbaikan dikirim untuk verifikasi ulang.", "ok");
    setFixFiles({}); setBusy(false); await load();
  }

  async function submitRating() {
    setBusy(true);
    const r = await mockApiFetch(`/api/applications/${id}/rating`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rating) });
    const j = await parseJsonResponse(r);
    if (!r.ok) { toast(j.error ?? "Gagal memberi rating.", "err"); setBusy(false); return; }
    toast("Terima kasih atas penilaian!", "ok");
    setBusy(false); await load();
  }

  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  if (fetching) return <AppShell user={me} title="Memuat pengajuan…"><Skeleton className="h-64" /></AppShell>;
  if (err || !data) return <AppShell user={me} title="Tidak ditemukan"><div className="card-soft p-8 text-center"><p className="font-bold">{err || "Data kosong"}</p><Link href="/pengajuan" className="font-bold text-[#c06b4a]">← Kembali</Link></div></AppShell>;

  const app = data.application;
  const reqs = data.requirements ?? [];
  const docs = data.documents ?? [];
  const events = data.events ?? [];
  const approvals = data.approvals ?? [];
  const sla = slaStatus(app.dueAt, app.status, app.completedAt);
  const role = me.role;

  const canVerify = role === "PETUGAS" && app.status === "MENUNGGU_VERIFIKASI";
  const canProcess = role === "PETUGAS" && ["TERVERIFIKASI", "SEDANG_DIPROSES"].includes(app.status);
  const canFinalize = role === "PETUGAS" && app.status === "FINALISASI";
  const canRt = role === "RT_RW" && app.status === "MENUNGGU_RT_RW";
  const canLurah = role === "LURAH" && app.status === "MENUNGGU_LURAH";
  const canCamat = role === "CAMAT" && app.status === "MENUNGGU_CAMAT";
  const canReturn = (role === "PETUGAS" && ["MENUNGGU_VERIFIKASI", "TERVERIFIKASI", "SEDANG_DIPROSES", "FINALISASI"].includes(app.status)) || canRt || canLurah || canCamat;
  const canExtend = ["PETUGAS", "LURAH"].includes(role) && !["SELESAI", "DITOLAK"].includes(app.status) && app.slaStartedAt;
  const showPriorityDecide = role === "PETUGAS" && app.isPriority && app.priorityStatus === "PENDING";

  return (
    <AppShell user={me} title={`${app.serviceName}`} subtitle={`ID ${app.applicationNumber} • diajukan ${formatWIB(app.submittedAt)}`}>
      <Link href="/pengajuan" className="flex items-center gap-1 text-sm font-bold text-[#5f3d4e]"><ArrowLeft size={15} /> Daftar pengajuan</Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={app.status} />
        <PriorityBadge isPriority={app.isPriority} priorityStatus={app.priorityStatus} />
        <span className={`badge ${sla.tone === "ok" ? "badge-green" : sla.tone === "bad" ? "badge-red" : sla.tone === "warn" ? "badge-amber" : "badge-muted"}`}><Clock size={12} /> {sla.label}</span>
        {app.isPriority && app.priorityReason && <span className="badge badge-muted">Alasan: {app.priorityReason}</span>}
      </div>

      {app.delayReason && (
        <div className="card-soft mt-3 flex gap-2.5 border-amber-200 bg-amber-50 p-4 text-[13px]">
          <AlertTriangle size={18} className="shrink-0 text-amber-700" />
          <p><b>Keterlambatan / pembaruan estimasi:</b> {app.delayReason}</p>
        </div>
      )}
      {app.status === "MENUNGGU_WARGA" && (
        <div className="card-soft mt-3 border-red-200 bg-red-50 p-4 text-[13px]">
          <p className="font-extrabold text-[#991b1b]">Perlu perbaikan — SLA dijeda</p>
          <p className="mt-1">{app.currentNote ?? "Lengkapi dokumen sesuai catatan petugas."}</p>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Aksi */}
          {(canVerify || canProcess || canFinalize || canRt || canLurah || canCamat || canReturn || canExtend || showPriorityDecide) && (
            <div className="card-soft p-5">
              <p className="font-extrabold">Tindakan yang tersedia <span className="font-normal text-[#7a6f6a]">• sebagai {role}</span></p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {canVerify && <><button onClick={() => { setNote(""); setModal("verify"); }} className="btn-primary rounded-xl px-4 py-2.5 text-[13px] font-bold">Verifikasi & mulai SLA</button><button onClick={() => { setNote(""); setModal("return"); }} className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[13px] font-bold text-[#991b1b]">Kembalikan</button></>}
                {canProcess && <><button onClick={() => { setNote(""); setModal("process"); }} className="btn-primary rounded-xl px-4 py-2.5 text-[13px] font-bold">{app.status === "TERVERIFIKASI" ? "Mulai proses surat" : "Teruskan ke RT/RW"}</button><button onClick={() => { setNote(""); setModal("return"); }} className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[13px] font-bold text-[#991b1b]">Kembalikan ke warga</button></>}
                {canRt && <><button onClick={() => { setNote(""); setModal("approve_rt"); }} className="btn-primary rounded-xl px-4 py-2.5 text-[13px] font-bold">Setujui (RT/RW)</button><button onClick={() => { setNote(""); setModal("return"); }} className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[13px] font-bold text-[#991b1b]">Kembalikan</button></>}
                {canLurah && <><button onClick={() => { setNote(""); setModal("approve_lurah"); }} className="btn-primary rounded-xl px-4 py-2.5 text-[13px] font-bold">Setujui (Lurah){app.requiresCamat ? " → Camat" : ""}</button><button onClick={() => { setNote(""); setModal("return"); }} className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[13px] font-bold text-[#991b1b]">Kembalikan</button></>}
                {canCamat && <><button onClick={() => { setNote(""); setModal("approve_camat"); }} className="btn-primary rounded-xl px-4 py-2.5 text-[13px] font-bold">Setujui (Camat)</button><button onClick={() => { setNote(""); setModal("return"); }} className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[13px] font-bold text-[#991b1b]">Kembalikan</button></>}
                {canFinalize && <button onClick={() => { setNote(""); setModal("finalize"); }} className="btn-terra rounded-xl px-4 py-2.5 text-[13px] font-bold">Finalisasi & terbitkan surat</button>}
                {canExtend && <button onClick={() => { setNote(app.delayReason ?? ""); setModal("extend"); }} className="rounded-xl border border-[#5f3d4e] px-4 py-2.5 text-[13px] font-bold text-[#5f3d4e]">Perbarui estimasi + alasan</button>}
                {role === "PETUGAS" && !["SELESAI", "DITOLAK"].includes(app.status) && <button onClick={() => { setNote(""); setModal("reject"); }} className="rounded-xl bg-[#2b2320] px-4 py-2.5 text-[13px] font-bold text-white">Tolak pengajuan</button>}
              </div>
              {showPriorityDecide && (
                <div className="mt-3 rounded-2xl bg-orange-50 p-3.5 text-[13px]">
                  <p className="font-extrabold">Keputusan prioritas (alasan: {app.priorityReason})</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => { setNote(""); setModal("prio_approve"); }} className="btn-terra rounded-xl px-4 py-2 text-[13px] font-bold">Setujui prioritas</button>
                    <button onClick={() => { setNote(""); setModal("prio_reject"); }} className="rounded-xl border border-[#e2c9b8] bg-white px-4 py-2 text-[13px] font-bold">Tolak prioritas</button>
                  </div>
                  {app.priorityEvidencePath && <a href={app.priorityEvidencePath} target="_blank" className="mt-1 inline-block font-bold text-[#c06b4a] hover:underline">Lihat bukti pendukung →</a>}
                </div>
              )}
              {app.priorityStatus !== "NONE" && app.priorityStatus !== "PENDING" && (
                <p className="mt-2 text-[12px] text-[#7a6f6a]">Keputusan prioritas: <b>{app.priorityStatus}</b> — {app.priorityNote ?? "-"} {app.priorityDecidedAt ? `(${formatWIB(app.priorityDecidedAt)})` : ""}</p>
              )}
            </div>
          )}

          {/* Perbaikan warga */}
          {role === "WARGA" && app.status === "MENUNGGU_WARGA" && (
            <div className="card-soft border-red-200 p-5">
              <p className="font-extrabold">Perbaiki dokumen</p>
              <p className="text-[13px] text-[#7a6f6a]">Unggah berkas pengganti, lalu kirim. Riwayat berkas lama tetap tercatat.</p>
              <div className="mt-3 space-y-2.5">
                {reqs.map((r: any) => (
                  <div key={r.key} className="flex flex-col gap-1.5 rounded-xl border border-[#e9d5c6] p-3 sm:flex-row sm:items-center">
                    <span className="text-[13px] font-bold">{r.name}</span>
                    <span className="sm:ml-auto">
                      {fixFiles[r.key] ? (
                        <span className="flex items-center gap-1.5 text-[13px] font-bold text-green-800"><CheckCircle2 size={15} /> {fixFiles[r.key].fileName}</span>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#faf5ef] px-3 py-2 text-[12px] font-bold hover:bg-[#f4e9de]">
                          <UploadCloud size={15} /> Pilih file
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => uploadFix(r.key, e.target.files?.[0])} />
                        </label>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <button disabled={busy} onClick={submitFix} className="btn-primary mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">{busy ? "Mengirim…" : "Kirim perbaikan untuk verifikasi ulang"}</button>
            </div>
          )}

          {/* Timeline */}
          <div className="card-soft p-5">
            <p className="font-extrabold">Timeline tracking</p>
            <div className="mt-3 space-y-0">
              {events.map((e: any, i: number) => (
                <div key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-black ${i === events.length - 1 ? "bg-[#5f3d4e] text-white" : "bg-[#f7e8df] text-[#5f3d4e]"}`}>{i + 1}</span>
                    {i < events.length - 1 && <span className="w-0.5 flex-1 bg-[#e9d5c6]" />}
                  </div>
                  <div className="pb-5">
                    <p className="text-[14px] font-extrabold">{e.title} {e.newStatus ? <span className="font-normal text-[#7a6f6a]">• {STATUS_LABEL[e.newStatus] ?? e.newStatus}</span> : null}</p>
                    <p className="text-[12px] font-bold text-[#a8552f]">{e.actorName ?? "Sistem"} {e.actorRole ? `• ${e.actorRole}` : ""} • {formatWIB(e.createdAt)}</p>
                    {e.description && <p className="mt-1 max-w-xl text-[13px] text-[#5f5752]">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dokumen */}
          <div className="card-soft p-5">
            <p className="font-extrabold">Dokumen persyaratan ({docs.length})</p>
            <div className="mt-2.5 space-y-2">
              {docs.map((d: any) => (
                <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-[#e9d5c6] p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#faf5ef]">📎</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-extrabold">{d.requirementName ?? d.requirementKey} — {d.fileName}</span>
                    <span className="text-[12px] text-[#7a6f6a]">{d.status} • {formatWIB(d.createdAt)}</span>
                  </span>
                  <a href={d.filePath} target="_blank" className="ml-auto shrink-0 rounded-lg border border-[#e2c9b8] px-2.5 py-1.5 text-[12px] font-bold">Lihat</a>
                </div>
              ))}
            </div>
          </div>

          {/* Rating */}
          {app.status === "SELESAI" && (
            <div className="card-soft p-5">
              <p className="font-extrabold">Penilaian pelayanan</p>
              {data.rating ? (
                <div className="mt-2 rounded-2xl bg-[#faf5ef] p-4 text-[13px]">
                  <p className="flex items-center gap-1 font-extrabold"><Star size={15} className="text-amber-500" /> {data.rating.score}/5 • {data.rating.category}</p>
                  {data.rating.comment && <p className="mt-1">“{data.rating.comment}”</p>}
                  <p className="mt-1 text-[12px] text-[#7a6f6a]">{formatWIB(data.rating.createdAt)} {data.rating.contextTag ? `• konteks: ${data.rating.contextTag}` : ""}</p>
                </div>
              ) : role === "WARGA" ? (
                <div className="mt-2.5 space-y-2.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRating((p) => ({ ...p, score: s }))} aria-label={`${s} bintang`}><Star size={28} className={s <= rating.score ? "fill-amber-400 text-amber-400" : "text-[#ddd0c6]"} /></button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {["KECEPATAN", "KERAMAHAN", "KEJELASAN"].map((c) => (
                      <button key={c} onClick={() => setRating((p) => ({ ...p, category: c }))} className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold ${rating.category === c ? "bg-[#5f3d4e] text-white" : "bg-[#faf5ef] text-[#5f3d4e]"}`}>{c}</button>
                    ))}
                  </div>
                  <Field label="Komentar (opsional)"><textarea rows={2} value={rating.comment} onChange={(e) => setRating((p) => ({ ...p, comment: e.target.value }))} className="input-soft" placeholder="Ceritakan pengalaman Anda…" /></Field>
                  <button disabled={busy} onClick={submitRating} className="btn-terra rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60">Kirim rating (1x)</button>
                </div>
              ) : (
                <p className="mt-1 text-[13px] text-[#7a6f6a]">Belum ada rating dari warga.</p>
              )}
            </div>
          )}
        </div>

        {/* Side */}
        <div className="space-y-4">
          <div className="card-soft p-5 text-[13px]">
            <p className="font-extrabold">Info SLA & estimasi</p>
            <dl className="mt-2 space-y-1.5">
              <div className="flex justify-between"><dt className="text-[#7a6f6a]">Dikirim</dt><dd className="font-bold">{formatWIB(app.submittedAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#7a6f6a]">Terverifikasi</dt><dd className="font-bold">{app.verifiedAt ? formatWIB(app.verifiedAt) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-[#7a6f6a]">Estimasi selesai</dt><dd className="font-bold">{app.dueAt ? formatDateWIB(app.dueAt) : "setelah verifikasi"}</dd></div>
              <div className="flex justify-between"><dt className="text-[#7a6f6a]">Selesai</dt><dd className="font-bold">{app.completedAt ? formatWIB(app.completedAt) : "—"}</dd></div>
              {app.pausedAt && <div className="flex justify-between"><dt className="text-[#7a6f6a]">Dijeda sejak</dt><dd className="font-bold text-[#991b1b]">{formatWIB(app.pausedAt)}</dd></div>}
            </dl>
            <p className="mt-2 rounded-xl bg-[#faf5ef] p-2.5 text-[12px] text-[#5f5752]">SLA berjalan setelah verifikasi • dijeda saat menunggu warga • hari kerja Senin–Jumat (ilustratif).</p>
            {app.status === "SELESAI" && (
              <div className="mt-3 space-y-2">
                <Link href={`/pengajuan/${app.id}/surat`} className="btn-terra flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"><Download size={15} /> Unduh surat (SIMULASI)</Link>
                <Link href={`/pengajuan/${app.id}/surat`} className="block rounded-xl border border-[#5f3d4e] px-4 py-2.5 text-center text-sm font-bold text-[#5f3d4e]">Pratinjau surat</Link>
                <p className="text-[11px] text-[#7a6f6a]">Watermark SIMULASI / BUKAN DOKUMEN RESMI. Tanpa TTE resmi.</p>
              </div>
            )}
          </div>
          <div className="card-soft p-5 text-[13px]">
            <p className="font-extrabold">Persetujuan</p>
            <div className="mt-2 space-y-2">
              {approvals.map((s: any) => (
                <div key={s.id} className="rounded-xl bg-[#faf5ef] p-2.5">
                  <p className="font-extrabold">{s.stage.replace("_", "/")} — <span className={s.status === "DISETUJUI" ? "text-green-700" : s.status === "DIKEMBALIKAN" ? "text-red-700" : "text-amber-700"}>{s.status}</span></p>
                  <p className="text-[12px] text-[#7a6f6a]">{s.actorName ?? "—"} {s.actedAt ? `• ${formatWIB(s.actedAt)}` : ""}</p>
                  {s.note && <p className="text-[12px]">“{s.note}”</p>}
                </div>
              ))}
              {approvals.length === 0 && <p className="text-[#7a6f6a]">Belum ada tahap approval.</p>}
            </div>
          </div>
          <div className="card-soft p-5 text-[13px]">
            <p className="font-extrabold">Data pemohon</p>
            <p className="mt-1"><b>{app.ownerName}</b> • {app.ownerEmail}</p>
            <p className="text-[#7a6f6a]">{app.ownerPhone ?? ""} • {app.ownerAddress ?? ""}</p>
            {app.formData && <pre className="mt-2 overflow-auto rounded-xl bg-[#2b2320] p-3 text-[11px] text-green-200">{JSON.stringify(app.formData, null, 2)}</pre>}
            {app.citizenNote && <p className="mt-2">Catatan warga: “{app.citizenNote}”</p>}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal open={modal === "verify"} title="Verifikasi & mulai SLA?" desc="Dokumen dinyatakan lengkap. verified_at dicatat dan estimasi dihitung (hari kerja). Notifikasi dikirim ke warga." confirmLabel="Verifikasi" loading={busy} onConfirm={() => doTransition("verify")} onClose={() => setModal(null)} />
      <ConfirmModal open={modal === "process"} title={app.status === "TERVERIFIKASI" ? "Mulai proses surat?" : "Teruskan ke RT/RW?"} desc="Pastikan draf / berkas siap ke tahap berikutnya." confirmLabel="Lanjutkan" loading={busy} onConfirm={() => doTransition("process")} onClose={() => setModal(null)} />
      <ConfirmModal open={modal === "approve_rt"} title="Setujui sebagai RT/RW?" desc="Persetujuan tercatat + diteruskan ke Lurah." confirmLabel="Setujui" loading={busy} onConfirm={() => doTransition("approve_rt")} onClose={() => setModal(null)} />
      <ConfirmModal open={modal === "approve_lurah"} title="Setujui sebagai Lurah?" desc={app.requiresCamat ? "Akan diteruskan ke Camat (khusus ahli waris)." : "Akan diteruskan ke finalisasi petugas."} confirmLabel="Setujui" loading={busy} onConfirm={() => doTransition("approve_lurah")} onClose={() => setModal(null)} />
      <ConfirmModal open={modal === "approve_camat"} title="Setujui sebagai Camat?" desc="Pengajuan ahli waris diteruskan ke finalisasi." confirmLabel="Setujui" loading={busy} onConfirm={() => doTransition("approve_camat")} onClose={() => setModal(null)} />
      <ConfirmModal open={modal === "finalize"} title="Finalisasi & terbitkan?" desc="Surat simulasi (watermark SIMULASI) dibuat, tombol unduh aktif, warga diminta rating." confirmLabel="Terbitkan" loading={busy} onConfirm={() => doTransition("finalize")} onClose={() => setModal(null)} />

      {["return", "reject", "prio_approve", "prio_reject", "extend"].includes(modal ?? "") && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="card-soft w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold">
              {modal === "return" ? "Kembalikan dengan alasan" : modal === "reject" ? "Tolak pengajuan" : modal === "prio_approve" ? "Setujui prioritas" : modal === "prio_reject" ? "Tolak prioritas" : "Perbarui estimasi"}
            </h3>
            <p className="mt-1 text-[13px] text-[#7a6f6a]">
              {modal === "extend" ? "Alasan wajib & transparan ke warga, tercatat di audit log." : "Alasan tertulis wajib — tampil transparan ke warga & tercatat."}
            </p>
            <div className="mt-3 space-y-3">
              <Field label={modal === "extend" ? "Alasan keterlambatan" : "Alasan / catatan"} required>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="input-soft" placeholder={modal === "extend" ? "Mis. Estimasi diperbarui karena menunggu tanda tangan lurah." : "Tulis alasan jelas…"} />
              </Field>
              {modal === "extend" && (
                <Field label="Estimasi baru (opsional)" hint="Kosongkan untuk mempertahankan estimasi + alasan saja">
                  <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className="input-soft" />
                </Field>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="rounded-xl border border-[#e2c9b8] bg-white px-4 py-2.5 text-sm font-bold">Batal</button>
              <button
                disabled={busy || !note}
                onClick={() => {
                  if (modal === "return") doTransition("return");
                  else if (modal === "reject") doTransition("reject");
                  else if (modal === "prio_approve") decidePriority("APPROVE");
                  else if (modal === "prio_reject") decidePriority("REJECT");
                  else if (modal === "extend") doTransition("extend", { delayReason: note, newDueAt: newDue || undefined });
                }}
                className="rounded-xl bg-[#5f3d4e] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Memproses…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
