"use client";
import { getLocalUser } from "@/lib/mock-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type Me = { id: string; name: string; email: string; role: string; phone?: string | null; address?: string | null };

export function useMe(allowed?: string[]) {
  const router = useRouter();
  const allowedRoles = allowed?.join("|");
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const user = getLocalUser();
      if (!user) router.push("/login");
      else {
        const roles = allowedRoles?.split("|");
        if (roles && !roles.includes(user.role)) {
          setErr(`Halaman ini membutuhkan role ${roles.join("/")} (Anda: ${user.role}).`);
        }
        setMe(user);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [allowedRoles, router]);
  return { me, loading, err };
}
