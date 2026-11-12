"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import { useEffect, useState } from "react";
import { Star, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { Field, toast } from "@/components/ui";

export default function StaffPage() {
  const { me, loading, err } = useMe(["LURAH"]);
  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PETUGAS", phone: "" });
  const [show, setShow] = useState(false);
  async function load() {
    const r = await mockApiFetch("/api/staff");
    const j = await parseJsonResponse(r);
    setStaff(j.staff ?? []);
  }
  useEffect(() => {
    if (me) queueMicrotask(() => { void load(); });
  }, [me]);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await mockApiFetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await parseJsonResponse(r);
    if (!r.ok) { toast(j.error ?? "Gagal.", "err"); return; }
    toast("Petugas ditambahkan.", "ok");
    setShow(false); setForm({ name: "", email: "", password: "", role: "PETUGAS", phone: "" }); load();
  }
  if (loading || !me) return <div className="grid min-h-screen place-items-center">Memuat…</div>;
  if (err) return <div className="grid min-h-screen place-items-center p-4"><div className="card-soft p-6">{err}</div></div>;
  return (
    <AppShell user={me} title="Manajemen Petugas" subtitle="Kelola akun demo PETUGAS & RT/RW. Lihat beban penanganan & rating.">
      <button onClick={() => setShow(!show)} className="btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"><Plus size={15} /> Tambah petugas / RT-RW</button>
      {show && (
        <form onSubmit={create} className="card-soft mt-3 grid gap-3 p-5 sm:grid-cols-2">
          <Field label="Nama" required><input className="input-soft" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email" required><input className="input-soft" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password" required><input className="input-soft" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role" required>
            <select className="input-soft" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="PETUGAS">PETUGAS</option><option value="RT_RW">RT/RW</option></select>
          </Field>
          <div className="sm:col-span-2"><button className="btn-terra rounded-xl px-5 py-2.5 text-sm font-bold">Simpan</button></div>
        </form>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {staff.map((s) => (
          <div key={s.id} className="card-soft p-4">
            <p className="font-extrabold">{s.name} <span className="badge badge-mauve ml-1">{s.role}</span></p>
            <p className="text-[13px] text-[#7a6f6a]">{s.email} • {s.phone ?? "-"}</p>
            <p className="mt-2 text-[13px]">Menangani: <b>{s.handled}</b> • <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" /> {s.ratingAvg ?? "-"} ({s.ratingCount})</span></p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
