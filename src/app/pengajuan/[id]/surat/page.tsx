"use client";
import { parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";

export default function SuratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me, loading } = useMe();
  const [data, setData] = useState<any>(null);
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (!me) return;
    mockApiFetch(`/api/applications/${id}`).then((r) => parseJsonResponse(r)).then((j) => setData(j));
    mockApiFetch(`/api/applications/${id}/download`).then(async (r) => {
      if (r.ok) setHtml(await r.text());
    });
    // eslint-disable-next-line
  }, [me]);
  if (loading || !me) return <div className="grid min-h-screen place-items-center">Memuat…</div>;
  return (
    <AppShell user={me} title="Pratinjau Surat (SIMULASI)" subtitle="Dokumen ini bukan dokumen resmi.">
      <div className="flex gap-2">
        <Link href={`/pengajuan/${id}`} className="flex items-center gap-1 text-sm font-bold text-[#5f3d4e]"><ArrowLeft size={15} /> Detail</Link>
        <span className="ml-auto flex gap-2">
          <a href={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`} download={`Surat-${id}-SIMULASI.html`} className="btn-terra flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-bold"><Download size={14} /> Unduh</a>
          <button onClick={() => window.print()} className="flex items-center gap-1 rounded-xl border border-[#5f3d4e] px-4 py-2 text-[13px] font-bold text-[#5f3d4e]"><Printer size={14} /> Cetak</button>
        </span>
      </div>
      <div className="card-soft mt-3 overflow-hidden p-0">
        {html ? (
          <iframe title="Surat simulasi" srcDoc={html} className="h-[70vh] w-full bg-white" />
        ) : (
          <p className="p-8 text-center text-sm text-[#7a6f6a]">Surat belum tersedia atau belum SELESAI.</p>
        )}
      </div>
      {data && <p className="mt-2 text-[12px] text-[#7a6f6a]">No. surat: {data.application?.letterNumber ?? "-"} • {data.application?.serviceName}</p>}
    </AppShell>
  );
}
