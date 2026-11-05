import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/" className="font-display text-lg font-semibold text-[#274C77]">← CivicFlow</Link>
      <h1 className="font-display mt-4 text-4xl font-medium">About this prototype</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#4A5C6E]">
        CivicFlow is a demonstration of a calm, transparent public-administration tracking experience. It shows how
        citizens might follow document requests through verification, review, decision, and issuance — with honest
        sample estimates, full status histories, and clearly labeled mock data.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-[#4A5C6E]">
        Nothing here is an official government service. All procedures, targets, and records are illustrative samples
        stored locally in your browser.
      </p>
      <Link href="/register" className="cut-corner-sm mt-6 inline-block bg-[#274C77] px-6 py-3 text-sm font-semibold text-white">Try the demo</Link>
    </div>
  );
}
