import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/" className="font-display text-lg font-semibold text-[#274C77]">← CivicFlow</Link>
      <h1 className="font-display mt-4 text-4xl font-medium">Help & demo guide</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#4A5C6E]">
        <p><strong className="text-[#1D2C3B]">Sign in:</strong> use citizen@example.com or admin@example.com with password <code className="rounded bg-[#E7ECEF] px-1.5 py-0.5 font-mono text-[#274C77]">civic1234</code>.</p>
        <p><strong className="text-[#1D2C3B]">Track a file:</strong> open My Requests, pick any ID, and explore the timeline, history, and related messages.</p>
        <p><strong className="text-[#1D2C3B]">Resolve an action:</strong> open CF-2026-377450 and use “Resubmit information” to return it to review.</p>
        <p><strong className="text-[#1D2C3B]">Admin review:</strong> sign in as admin@example.com, open Administration, select a file, and apply a status change with an explanation.</p>
        <p><strong className="text-[#1D2C3B]">Reset:</strong> Profile → Reset demo data restores the original samples.</p>
      </div>
      <Link href="/login" className="cut-corner-sm mt-6 inline-block bg-[#274C77] px-6 py-3 text-sm font-semibold text-white">Go to sign in</Link>
    </div>
  );
}
