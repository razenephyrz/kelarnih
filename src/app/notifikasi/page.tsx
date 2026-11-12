"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/components/useMe";
import { Skeleton, EmptyState, toast } from "@/components/ui";
import { timeAgo, parseJsonResponse } from "@/lib/utils";
import { mockApiFetch } from "@/lib/mock-api";

export default function NotifPage() {
  const { me, loading } = useMe();
  const [items, setItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  async function load() {
    setFetching(true);
    const r = await mockApiFetch("/api/notifications");
    const j = await parseJsonResponse(r);
    setItems(j.notifications ?? []);
    setFetching(false);
  }
  useEffect(() => {
    if (me) queueMicrotask(() => { void load(); });
  }, [me]);
  async function markAll() {
    await mockApiFetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    toast("Semua ditandai dibaca.", "ok");
    load();
  }
  async function markOne(id: string) {
    await mockApiFetch(`/api/notifications?id=${id}`, { method: "PATCH" });
    load();
  }
  if (loading || !me) return <div className="grid min-h-screen place-items-center bg-[#f4e9de]"><div className="card-soft p-8">Memuat…</div></div>;
  return (
    <AppShell user={me} title="Notifikasi" subtitle="Dihasilkan otomatis oleh event sistem, tersimpan di database.">
      <div className="flex items-center gap-2">
        <p className="text-sm text-[#7a6f6a]">{items.filter((i) => !i.isRead).length} belum dibaca</p>
        <button onClick={markAll} className="ml-auto flex items-center gap-1.5 rounded-xl border border-[#e2c9b8] bg-white px-3.5 py-2 text-[13px] font-bold"><CheckCheck size={15} /> Tandai semua dibaca</button>
      </div>
      {fetching ? <div className="mt-3 space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        : items.length === 0 ? <div className="mt-3"><EmptyState title="Belum ada notifikasi" desc="Notifikasi muncul setiap ada perubahan status, keputusan prioritas, atau pembaruan estimasi." /></div>
        : (
          <div className="mt-3 space-y-2">
            {items.map((n) => (
              <div key={n.id} className={`card-soft flex gap-3 p-4 ${!n.isRead ? "border-[#c06b4a]" : "opacity-85"}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${!n.isRead ? "bg-[#c06b4a] text-white" : "bg-[#f7e8df]"}`}><Bell size={17} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold">{n.title} {!n.isRead && <span className="ml-1 rounded-full bg-[#c06b4a] px-2 py-0.5 text-[10px] text-white">baru</span>}</p>
                  <p className="text-[13px] text-[#5f5752]">{n.message}</p>
                  <p className="mt-1 flex gap-2 text-[12px] text-[#7a6f6a]">
                    <span>{timeAgo(n.createdAt)}</span>
                    {n.link && <Link href={n.link} className="font-bold text-[#c06b4a]">Lihat pengajuan →</Link>}
                    {!n.isRead && <button onClick={() => markOne(n.id)} className="font-bold underline">Tandai dibaca</button>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
    </AppShell>
  );
}
