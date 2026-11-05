import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/" className="font-display text-lg font-semibold text-[#274C77]">← CivicFlow</Link>
      <h1 className="font-display mt-4 text-4xl font-medium">Terms (prototype notice)</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#4A5C6E]">
        <p>CivicFlow is a design and engineering demonstration, not an official public service. Processing targets, departments, and procedures are illustrative samples.</p>
        <p>Mock authentication is not production-secure and must be replaced by a real identity provider before any production use.</p>
        <p>By exploring the demo you agree to use fictional data and to verify any administrative requirement with the responsible authority.</p>
      </div>
    </div>
  );
}
