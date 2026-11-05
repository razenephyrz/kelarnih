"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Landmark, ShieldAlert } from "lucide-react";
import { useCivic, roleHome } from "@/lib/store";
import { DEMO_PASSWORD } from "@/data/seed";
import { Field, inputCls } from "@/components/ui";

export default function LoginPage() {
  const { login, user, ready } = useCivic();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (ready && user) router.replace(roleHome(user.role));
  }, [ready, user, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setBusy(true);
    const res = login(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Sign-in failed.");
      return;
    }
    const stored = localStorage.getItem("civicflow/users/v1");
    // route by role
    try {
      const users = stored ? JSON.parse(stored) : [];
      const found = users.find((u: { email: string; role: string }) => u.email.toLowerCase() === email.trim().toLowerCase());
      router.push(found?.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  const fill = (e: string) => {
    setEmail(e);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="mesh-header grain relative hidden overflow-hidden lg:block">
        <div className="blob left-10 top-16 h-64 w-64 rounded-[46%_54%_52%_48%/48%_46%_54%_52%] bg-gradient-to-br from-[#A3CEF1] to-white opacity-70 blur-2xl" />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#274C77] to-[#6096BA] text-white">
              <Landmark size={18} />
            </span>
            <span className="font-display text-xl font-semibold">CivicFlow</span>
          </Link>
          <div className="max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#274C77]">Welcome back</p>
            <h1 className="font-display mt-3 text-4xl leading-tight font-medium">Pick up exactly where your files left off.</h1>
            <div className="mt-6 flex items-center gap-5">
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#FFFFFFAA" strokeWidth="9" fill="none" />
                  <circle cx="40" cy="40" r="32" stroke="#274C77" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="201" strokeDashoffset="60" />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-sm font-bold text-[#274C77]">70%</span>
              </div>
              <p className="text-sm leading-relaxed text-[#4A5C6E]">3 files in progress · 1 needs your attention · all history preserved across refreshes.</p>
            </div>
          </div>
          <p className="text-xs text-[#647587]">Mock authentication — credentials stay in your browser and are never sent anywhere.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#F7F9FA] px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#274C77] to-[#6096BA] text-white"><Landmark size={16} /></span>
            <span className="font-display text-lg font-semibold">CivicFlow</span>
          </Link>
          <h2 className="font-display text-3xl font-medium">Sign in</h2>
          <p className="mt-2 text-sm text-[#647587]">Access your dashboard, requests, and inbox.</p>

          <div className="mt-5 rounded-2xl border border-dashed border-[#6096BA66] bg-white p-4 text-[13px]">
            <p className="font-semibold text-[#274C77]">Demo accounts — password <code className="rounded bg-[#E7ECEF] px-1.5 py-0.5 font-mono">civic1234</code></p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button onClick={() => fill("citizen@example.com")} className="rounded-full border border-[#DCE4E9] bg-[#F7F9FA] px-3.5 py-1.5 text-xs font-semibold text-[#274C77] transition hover:border-[#6096BA]">
                citizen@example.com
              </button>
              <button onClick={() => fill("admin@example.com")} className="rounded-full border border-[#DCE4E9] bg-[#F7F9FA] px-3.5 py-1.5 text-xs font-semibold text-[#274C77] transition hover:border-[#6096BA]">
                admin@example.com
              </button>
            </div>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4 rounded-3xl border border-[#DCE4E9] bg-white p-6" noValidate>
            <Field label="Email address" error={undefined}>
              <input className={inputCls} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
            </Field>
            <Field label="Password">
              <input className={inputCls} type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
            </Field>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#F3DEDE] px-3.5 py-2.5 text-[13px] font-medium text-[#8E4444]">
                <ShieldAlert size={15} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}
            <button disabled={busy} className="cut-corner-sm flex w-full items-center justify-center gap-2 bg-[#274C77] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e3c5e] disabled:opacity-60">
              {busy ? "Signing in…" : <>Sign in <ArrowRight size={15} /></>}
            </button>
            <p className="text-center text-[13px] text-[#647587]">
              New to CivicFlow? <Link href="/register" className="font-semibold text-[#274C77] underline underline-offset-2">Create an account</Link>
            </p>
          </form>
          <p className="mt-4 text-center text-xs text-[#9AA9B7]">Prototype only: mock session stored in localStorage, replaceable by a real auth API later.</p>
        </div>
      </div>
    </div>
  );
}
