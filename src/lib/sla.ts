// SLA engine — Asia/Jakarta business days (Mon-Fri)
export function addBusinessDays(from: Date, businessDays: number): Date {
  const d = new Date(from);
  let added = 0;
  // if starting weekend, move to Monday first without counting
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  // set target time: if priority (1 day) -> today 15:00 WIB concept handled by caller
  return d;
}

export function addCalendarDays(from: Date, days: number) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function computeDueDate(verifiedAt: Date, slaDays: number, isPriority: boolean) {
  if (isPriority && slaDays <= 1) {
    // target "Hari ini sebelum 15.00" — if verified before 12:00 same day 15:00, else next business day 15:00
    const v = new Date(verifiedAt);
    // convert to WIB approx (+7)
    const wib = new Date(v.getTime() + 7 * 3600 * 1000);
    const hourUTC = v.getUTCHours() + 7; // rough
    const target = new Date(v);
    if (hourUTC < 12) {
      // same day 15:00 WIB = 08:00 UTC
      target.setUTCHours(8, 0, 0, 0);
      // if weekend, push to Monday
      const day = target.getUTCDay();
      if (day === 6) target.setUTCDate(target.getUTCDate() + 2);
      if (day === 0) target.setUTCDate(target.getUTCDate() + 1);
    } else {
      const nb = addBusinessDays(v, 1);
      nb.setUTCHours(8, 0, 0, 0);
      return nb;
    }
    return target;
  }
  const due = addBusinessDays(verifiedAt, slaDays);
  due.setUTCHours(8, 0, 0, 0); // 15:00 WIB
  return due;
}

export function isOverdue(dueAt: Date | null, completedAt: Date | null, now = new Date()) {
  if (!dueAt) return false;
  const ref = completedAt ?? now;
  return ref.getTime() > new Date(dueAt).getTime();
}

export function overdueDays(dueAt: Date, ref: Date = new Date()) {
  const ms = ref.getTime() - new Date(dueAt).getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 3600 * 1000));
}

export function formatWIB(date: Date | string | null) {
  if (!date) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString("id-ID");
  }
}

export function formatDateWIB(date: Date | string | null) {
  if (!date) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleDateString("id-ID");
  }
}

export function slaStatus(dueAt: Date | null, status: string, completedAt: Date | null) {
  if (!dueAt) return { label: "SLA belum berjalan", tone: "muted" as const };
  if (status === "MENUNGGU_WARGA" || status === "MENUNGGU_VERIFIKASI")
    return { label: "SLA dijeda / belum berjalan", tone: "muted" as const };
  if (status === "SELESAI") {
    if (completedAt && new Date(completedAt).getTime() <= new Date(dueAt).getTime())
      return { label: "Tepat waktu", tone: "ok" as const };
    return { label: "Terlambat", tone: "bad" as const };
  }
  if (isOverdue(dueAt, null)) return { label: `Terlambat ${overdueDays(dueAt)} hari`, tone: "bad" as const };
  const msLeft = new Date(dueAt).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (24 * 3600 * 1000));
  if (daysLeft <= 1) return { label: "Mendekati batas", tone: "warn" as const };
  return { label: `${daysLeft} hari tersisa`, tone: "ok" as const };
}
