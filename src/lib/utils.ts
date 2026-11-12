export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
  const body = await response.text();
  const endpoint = response.url ? new URL(response.url).pathname : "server";

  if (!body.trim()) {
    throw new Error(`Respons kosong dari ${endpoint} (HTTP ${response.status}).`);
  }

  try {
    return JSON.parse(body) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Respons dari ${endpoint} bukan JSON valid (HTTP ${response.status}).`);
    }
    throw error;
  }
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function timeAgo(date: Date | string) {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bln lalu`;
  return `${Math.floor(months / 12)} thn lalu`;
}

export const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
export const MAX_FILE_MB = 5;
