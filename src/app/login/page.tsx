"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicNav, PublicFooter } from "@/components/Public";
import { Field, ToastHost, toast } from "@/components/ui";
import { loginLocal } from "@/lib/mock-api";

function getRoleRedirectPath(role: string) {
  const paths: Record<string, string> = { WARGA: "/dashboard", PETUGAS: "/verifikasi", RT_RW: "/persetujuan", LURAH: "/dashboard", CAMAT: "/persetujuan" };
  return paths[role] ?? "/dashboard";
}

const DEMO = [
  { role: "Warga", email: "warga@kelar.in", pass: "warga123" },
  { role: "Petugas", email: "petugas@kelar.in", pass: "petugas123" },
  { role: "RT/RW", email: "rtrw@kelar.in", pass: "rtrw123" },
  { role: "Lurah", email: "lurah@kelar.in", pass: "lurah123" },
  { role: "Camat", email: "camat@kelar.in", pass: "camat123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email || !password) { setErr("Email dan password wajib diisi."); return; }
    setLoading(true);
    try {
      const user = loginLocal(email, password);
      if (!user) { setErr("Email atau password salah."); return; }
      toast("Login berhasil. Mengalihkan…", "ok");
      router.push(getRoleRedirectPath(user.role));
      router.refresh();
    } catch (error) {
      console.error("Login dummy gagal.", error);
      setErr("Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf5ef]">
      <ToastHost />
      <PublicNav />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <div className="hero-plum rounded-[24px] p-7 text-white">
          <h1 className="text-[28px] font-extrabold leading-tight">Selamat datang kembali di kelar.in</h1>
          <p className="mt-2 text-sm text-white/75">Pantau pengajuan dan urus kebutuhan administrasi Anda dengan lebih mudah.</p>
          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <p className="text-[13px] font-extrabold">Akun demo (klik untuk isi otomatis)</p>
            <div className="mt-2 grid gap-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left text-[12px] font-bold hover:bg-white/20"
                >
                  <span className="rounded-full bg-white/20 px-2 py-0.5">{d.role}</span>
                  <span className="truncate">{d.email} / {d.pass}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[12px] text-white/60">Seluruh akun & data adalah simulasi demo.</p>
        </div>
        <div className="card-soft p-7">
          <h2 className="text-xl font-extrabold">Login</h2>
          <p className="mt-1 text-sm text-[#7a6f6a]">Masuk sesuai role untuk membuka dashboard masing-masing.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Email" required error={undefined}>
              <input className="input-soft" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@kelar.in" autoComplete="email" />
            </Field>
            <Field label="Password" required>
              <input className="input-soft" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" />
            </Field>
            {err && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-[13px] font-bold text-[#991b1b]">{err}</p>}
            <button disabled={loading} className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-extrabold disabled:opacity-60">
              {loading ? "Memeriksa…" : "Masuk"}
            </button>
          </form>
          <p className="mt-4 text-center text-[13px] text-[#7a6f6a]">Belum punya akun warga? <Link href="/daftar" className="font-bold text-[#c06b4a] hover:underline">Daftar di sini</Link></p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
