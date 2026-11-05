import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/" className="font-display text-lg font-semibold text-[#274C77]">← CivicFlow</Link>
      <h1 className="font-display mt-4 text-4xl font-medium">Privacy (prototype notice)</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#4A5C6E]">
        <p>This prototype stores all data locally in your browser via localStorage. No analytics, tracking, emails, or external requests carry your entries.</p>
        <p>Do not enter real personal data, identity numbers, or sensitive documents. Use fictional sample values for evaluation.</p>
        <p>Clearing site data or using “Reset demo data” removes or restores the mock store. There is no server copy to delete because none exists.</p>
      </div>
    </div>
  );
}
