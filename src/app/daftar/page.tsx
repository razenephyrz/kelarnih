"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicNav, PublicFooter } from "@/components/Public";
import { Field, ToastHost, toast } from "@/components/ui";
import { registerLocal } from "@/lib/mock-api";

export default function DaftarPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "", nik: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!form.name || !form.email || !form.password) { setErr("Nama, email, password wajib diisi."); return; }
    setLoading(true);
    try {
      const message = registerLocal(form);
      if (message) { setErr(message); return; }
      toast("Pendaftaran berhasil.", "ok");
      router.push("/dashboard");
      router.refresh();
    } catch (error) { console.error("Pendaftaran dummy gagal.", error); setErr("Pendaftaran gagal."); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#faf5ef]">
      <ToastHost /><PublicNav />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="card-soft p-7">
          <h1 className="text-2xl font-extrabold">Daftar akun warga</h1>
          <p className="mt-1 text-sm text-[#7a6f6a]">Akun baru otomatis berperan sebagai Warga. Data demo.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Nama lengkap" required><input className="input-soft" value={form.name} onChange={(e) => set(e.target.name, e.target.value)} placeholder="Nama sesuai KTP" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required><input className="input-soft" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@email.com" /></Field>
              <Field label="Password" required hint="Minimal 6 karakter"><input className="input-soft" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NIK (opsional)"><input className="input-soft" value={form.nik} onChange={(e) => set("nik", e.target.value)} placeholder="16 digit" /></Field>
              <Field label="No. HP (opsional)"><input className="input-soft" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08xx" /></Field>
            </div>
            <Field label="Alamat (opsional)"><textarea className="input-soft" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Jl, RT/RW…" /></Field>
            {err && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-[13px] font-bold text-[#991b1b]">{err}</p>}
            <button disabled={loading} className="btn-terra w-full rounded-xl px-4 py-3 text-sm font-extrabold disabled:opacity-60">{loading ? "Mendaftar…" : "Buat akun"}</button>
          </form>
          <p className="mt-4 text-center text-[13px] text-[#7a6f6a]">Sudah punya akun? <Link href="/login" className="font-bold text-[#c06b4a] hover:underline">Login</Link></p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
