import type { AppStatus } from "@/db/schema";

export const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  MENUNGGU_WARGA: "Perlu Perbaikan",
  TERVERIFIKASI: "Terverifikasi",
  SEDANG_DIPROSES: "Sedang Diproses",
  MENUNGGU_RT_RW: "Menunggu RT/RW",
  MENUNGGU_LURAH: "Menunggu Lurah",
  MENUNGGU_CAMAT: "Menunggu Camat",
  FINALISASI: "Finalisasi",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};

export const STATUS_TONE: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "amber",
  MENUNGGU_WARGA: "red",
  TERVERIFIKASI: "blue",
  SEDANG_DIPROSES: "mauve",
  MENUNGGU_RT_RW: "orange",
  MENUNGGU_LURAH: "orange",
  MENUNGGU_CAMAT: "orange",
  FINALISASI: "mauve",
  SELESAI: "green",
  DITOLAK: "red",
};

// Allowed transitions: from -> [to]
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  MENUNGGU_VERIFIKASI: ["TERVERIFIKASI", "MENUNGGU_WARGA", "DITOLAK"],
  MENUNGGU_WARGA: ["MENUNGGU_VERIFIKASI"],
  TERVERIFIKASI: ["SEDANG_DIPROSES", "MENUNGGU_WARGA"],
  SEDANG_DIPROSES: ["MENUNGGU_RT_RW", "MENUNGGU_WARGA"],
  MENUNGGU_RT_RW: ["MENUNGGU_LURAH", "MENUNGGU_WARGA", "DITOLAK"],
  MENUNGGU_LURAH: ["FINALISASI", "MENUNGGU_CAMAT", "MENUNGGU_WARGA", "DITOLAK"],
  MENUNGGU_CAMAT: ["FINALISASI", "MENUNGGU_WARGA", "DITOLAK"],
  FINALISASI: ["SELESAI", "MENUNGGU_WARGA"],
  SELESAI: [],
  DITOLAK: [],
};

export function canTransition(from: string, to: string) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

// Who can perform which target transition
export const ROLE_TRANSITIONS: Record<string, string[]> = {
  // target status -> allowed roles
  TERVERIFIKASI: ["PETUGAS"],
  MENUNGGU_WARGA: ["PETUGAS", "RT_RW", "LURAH", "CAMAT", "WARGA"],
  MENUNGGU_VERIFIKASI: ["WARGA", "PETUGAS"],
  SEDANG_DIPROSES: ["PETUGAS"],
  MENUNGGU_RT_RW: ["PETUGAS"],
  MENUNGGU_LURAH: ["RT_RW"],
  MENUNGGU_CAMAT: ["LURAH"],
  FINALISASI: ["LURAH", "CAMAT", "PETUGAS"],
  SELESAI: ["PETUGAS"],
  DITOLAK: ["PETUGAS", "RT_RW", "LURAH", "CAMAT"],
};

export function roleCanTransition(role: string, to: string) {
  const allowed = ROLE_TRANSITIONS[to];
  if (!allowed) return false;
  return allowed.includes(role);
}

export const WORKFLOW_STEPS = [
  { key: "PENGAJUAN", label: "Pengajuan Dikirim", statuses: ["MENUNGGU_VERIFIKASI"] },
  { key: "VERIFIKASI", label: "Verifikasi Berkas", statuses: ["MENUNGGU_VERIFIKASI", "MENUNGGU_WARGA", "TERVERIFIKASI"] },
  { key: "PROSES", label: "Proses Surat", statuses: ["TERVERIFIKASI", "SEDANG_DIPROSES"] },
  { key: "RT_RW", label: "Persetujuan RT/RW", statuses: ["MENUNGGU_RT_RW"] },
  { key: "LURAH", label: "Persetujuan Lurah", statuses: ["MENUNGGU_LURAH"] },
  { key: "CAMAT", label: "Persetujuan Camat", statuses: ["MENUNGGU_CAMAT"] },
  { key: "FINAL", label: "Finalisasi", statuses: ["FINALISASI"] },
  { key: "SELESAI", label: "Selesai", statuses: ["SELESAI"] },
];

export function timelineForStatus(status: string, requiresCamat: boolean) {
  const base = ["PENGAJUAN", "VERIFIKASI", "PROSES", "RT_RW", "LURAH"];
  if (requiresCamat) base.push("CAMAT");
  base.push("FINAL", "SELESAI");
  return base;
}

export const PRIORITY_REASONS = [
  { value: "dika", label: "Kematian / duka", needsEvidence: true },
  { value: "medis", label: "Kebutuhan medis", needsEvidence: true },
  { value: "sekolah_kerja", label: "Pendaftaran sekolah / pekerjaan (tenggat)", needsEvidence: true },
  { value: "hukum", label: "Urusan hukum", needsEvidence: false },
  { value: "lainnya", label: "Lainnya", needsEvidence: false },
];

export function genApplicationNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KL-${y}${m}-${rand}`;
}
