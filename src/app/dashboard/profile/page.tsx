"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useCivic } from "@/lib/store";
import { DEMO_PASSWORD } from "@/data/seed";
import { Field, PageHeader, inputCls } from "@/components/ui";
import { formatDate, initials } from "@/lib/utils";

export default function ProfilePage() {
  const { user, users, myRequests, logout, updateProfile, resetDemo } = useCivic();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (user) setName(user.name);
  }, [user?.id]);

  if (!user) return null;

  const save = () => {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setError("");
    updateProfile({ name: name.trim() });
    setSaved("Profile updated across the app.");
    setTimeout(() => setSaved(""), 3000);
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Profile & settings" title="Your account" copy="Mock profile stored locally. Changes reflect immediately in navigation, history authorship, and greetings." />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-[#DCE4E9] bg-white p-6 sm:p-7">
          <div className="flex items-center gap-4">
            <span className="font-display grid h-16 w-16 place-items-center rounded-[22px] text-xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${user.avatarColor ?? "#274C77"}, #6096BA)` }}>
              {initials(name || user.name)}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">{user.name}</h2>
              <p className="text-[13px] text-[#647587]">{user.email} · <span className="capitalize">{user.role}</span></p>
              <p className="text-xs text-[#9AA9B7]">Member since {formatDate(user.createdAt)} · {myRequests.length} files</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Full name" error={error}>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
            </Field>
            <Field label="Email (cannot be changed in demo)">
              <input className={`${inputCls} bg-[#F7F9FA] text-[#647587]`} value={user.email} disabled aria-label="Email" />
            </Field>
            {saved && <p role="status" className="rounded-xl bg-[#EFF6F1] px-4 py-2.5 text-[13px] font-medium text-[#2E6B57]">{saved}</p>}
            <div className="flex flex-wrap gap-2.5">
              <button onClick={save} className="cut-corner-sm inline-flex items-center gap-2 bg-[#274C77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3c5e]">
                <Save size={15} /> Save changes
              </button>
              <button onClick={() => { logout(); router.push("/"); }} className="inline-flex items-center gap-2 rounded-full border border-[#DCE4E9] px-5 py-2.5 text-sm font-semibold text-[#B85C5C] hover:border-[#B85C5C]">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-3xl border border-[#DCE4E9] bg-[#E7ECEF66] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={15} className="text-[#274C77]" /> Session & security (mock)</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[#4A5C6E]">
              <li>· Session persists in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">localStorage</code> across refreshes.</li>
              <li>· Passwords are stored as a salted demo hash — <strong>not production-secure</strong>.</li>
              <li>· Seeded demo password: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">civic1234</code> (shown for evaluation only).</li>
              <li>· Auth layer is isolated in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">src/lib/store.tsx</code> for future API replacement.</li>
            </ul>
            <p className="mt-3 text-xs text-[#647587]">{users.length} mock users in this browser · <span className="font-mono">{user.id}</span></p>
          </section>

          <section className="cut-corner-sm bg-[#1D2C3B] p-6 text-white">
            <h3 className="text-sm font-bold">Demo data controls</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">Restore the original 9 sample requests, histories, and notifications. Your registered mock users are kept; seeded files are reset.</p>
            <button onClick={() => { resetDemo(); setSaved("Demo data reset to original samples."); setTimeout(() => setSaved(""), 3000); }} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#1D2C3B] hover:bg-[#E7ECEF]">
              <RotateCcw size={14} /> Reset demo data
            </button>
            {saved && <p className="mt-2 text-xs text-[#A3CEF1]">{saved}</p>}
            <p className="mt-2 text-[11px] text-white/50">Demo password reminder: {DEMO_PASSWORD} — never use real credentials here.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
