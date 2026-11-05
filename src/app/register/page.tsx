"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Landmark, ShieldAlert } from "lucide-react";
import { useCivic } from "@/lib/store";
import { Field, inputCls } from "@/components/ui";

export default function RegisterPage() {
  const { register, user, ready } = useCivic();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (ready && user) router.replace(user.role === "admin" ? "/admin" : "/dashboard");
  }, [ready, user, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (confirm !== password) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const res = register({ name, email, password });
    setBusy(false);
    if (!res.ok) {
      setErrors({ email: res.error ?? "Registration failed." });
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="flex items-center justify-center bg-[#F7F9FA] px-5 py-10 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-medium">Create your account</h2>
          <p className="mt-2 text-sm text-[#647587]">A local mock account — no email is sent, nothing leaves your browser.</p>
          <form onSubmit={submit} className="mt-5 space-y-4 rounded-3xl border border-[#DCE4E9] bg-white p-6" noValidate>
            <Field label="Full name" error={errors.name}>
              <input className={inputCls} placeholder="Amara Osei" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
            </Field>
            <Field label="Email address" error={errors.email}>
              <input className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" error={errors.password} hint="Min. 8 characters (mock-hashed locally)">
                <input className={inputCls} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
              </Field>
              <Field label="Confirm password" error={errors.confirm}>
                <input className={inputCls} type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Confirm password" />
              </Field>
            </div>
            {errors.form && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#F3DEDE] px-3.5 py-2.5 text-[13px] font-medium text-[#8E4444]">
                <ShieldAlert size={15} className="mt-0.5 shrink-0" /> {errors.form}
              </p>
            )}
            <button disabled={busy} className="cut-corner-sm flex w-full items-center justify-center gap-2 bg-[#274C77] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e3c5e] disabled:opacity-60">
              {busy ? "Creating…" : <>Create account <ArrowRight size={15} /></>}
            </button>
            <p className="text-center text-[13px] text-[#647587]">
              Already have an account? <Link href="/login" className="font-semibold text-[#274C77] underline underline-offset-2">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#274C77] to-[#6096BA] lg:block order-1 lg:order-2">
        <div className="grain absolute inset-0" />
        <div className="blob right-10 top-16 h-64 w-64 rounded-[58%_42%_55%_45%/45%_55%_45%_55%] bg-white/10 blur-2xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Landmark size={18} /></span>
            <span className="font-display text-xl font-semibold">CivicFlow</span>
          </Link>
          <div className="max-w-md">
            <div className="flex gap-2">
              {["File", "Track", "Collect"].map((s, i) => (
                <span key={s} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${i === 1 ? "bg-white text-[#274C77]" : "bg-white/15 text-white"}`}>{s}</span>
              ))}
            </div>
            <h1 className="font-display mt-4 text-4xl leading-tight font-medium">One account. Every administrative step, visible.</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/75">Citizen demo sessions persist across refreshes via localStorage. Admins get a separate operations view with review flags.</p>
          </div>
          <p className="text-xs text-white/60">Demo password convention: <code className="rounded bg-white/15 px-1.5 py-0.5 font-mono">civic1234</code> for seeded accounts.</p>
        </div>
      </div>
    </div>
  );
}
