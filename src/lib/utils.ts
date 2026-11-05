export function uid(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}_${time}${rand}`;
}

// Mock-only hash (NOT production secure). Documented as demo-grade.
// Simple salted djb2 + base36 so we don't store plaintext in localStorage.
export function mockHash(password: string): string {
  const salt = "civicflow::demo::";
  const s = salt + password;
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 31) ^ c;
  }
  const mixed = (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
  return `mock$${mixed}`;
}

export function verifyMock(password: string, hash: string): boolean {
  return mockHash(password) === hash;
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - d;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(targetIso: string, status: string): boolean {
  if (status === "completed" || status === "approved" || status === "draft") return false;
  return new Date(targetIso).getTime() < Date.now();
}

export function progressForStatus(status: string, createdAt: string, targetAt: string): number {
  const base: Record<string, number> = {
    draft: 8,
    submitted: 22,
    under_review: 52,
    action_required: 48,
    approved: 82,
    completed: 100,
    rejected: 35,
  };
  if (status in base) return base[status];
  return 30;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function generateRequestId(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(100000 + Math.random() * 900000);
  return `CF-${year}-${n}`;
}
