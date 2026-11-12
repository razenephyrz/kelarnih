"use client";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  nik: string | null;
  rt: string | null;
  rw: string | null;
  createdAt: string;
};

type MockState = {
  users: Array<MockUser & { password: string }>;
  applications: any[];
  notifications: any[];
  staff: any[];
  ratings: any[];
};

const STORAGE_KEY = "kelarin_mock_state_v1";
const USER_KEY = "kelarin_mock_user_v1";
const DEMO_USERS: MockState["users"] = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Ibna Warga", email: "warga@kelar.in", password: "warga123", role: "WARGA", phone: "0812-0000-0001", address: "Jl. Melati No. 12 RT 03 RW 05, Kel. Contoh", nik: "3201010101010001", rt: "03", rw: "05", createdAt: new Date().toISOString() },
  { id: "00000000-0000-4000-8000-000000000002", name: "Andi Petugas", email: "petugas@kelar.in", password: "petugas123", role: "PETUGAS", phone: "0812-1000-0001", address: "Kantor Kelurahan Contoh", nik: null, rt: null, rw: null, createdAt: new Date().toISOString() },
  { id: "00000000-0000-4000-8000-000000000003", name: "H. Bambang (RT/RW)", email: "rtrw@kelar.in", password: "rtrw123", role: "RT_RW", phone: "0812-2000-0001", address: "Jl. Melati RT 03 RW 05", nik: null, rt: "03", rw: "05", createdAt: new Date().toISOString() },
  { id: "00000000-0000-4000-8000-000000000004", name: "Dra. Ratna Wulandari", email: "lurah@kelar.in", password: "lurah123", role: "LURAH", phone: "0812-3000-0001", address: "Kantor Kelurahan Contoh", nik: null, rt: null, rw: null, createdAt: new Date().toISOString() },
  { id: "00000000-0000-4000-8000-000000000005", name: "Drs. H. Camat Contoh", email: "camat@kelar.in", password: "camat123", role: "CAMAT", phone: "0812-4000-0001", address: "Kantor Kecamatan Contoh", nik: null, rt: null, rw: null, createdAt: new Date().toISOString() },
];

const services = [
  ["domisili", "Surat Keterangan Domisili", "Menyatakan tempat tinggal warga di wilayah kelurahan.", "Kependudukan", 2, true, false],
  ["sktm", "Surat Keterangan Tidak Mampu (SKTM)", "Keterangan kondisi ekonomi untuk akses bantuan.", "Kesejahteraan", 3, false, false],
  ["sku", "Surat Keterangan Usaha (SKU)", "Menyatakan keberadaan usaha warga.", "Usaha", 3, false, false],
  ["penghasilan", "Surat Keterangan Penghasilan", "Menyatakan besaran penghasilan.", "Kesejahteraan", 2, false, false],
  ["belum-menikah", "Surat Keterangan Belum Menikah", "Menyatakan status perkawinan.", "Kependudukan", 2, false, false],
  ["kematian", "Surat Keterangan Kematian", "Keterangan peristiwa kematian.", "Kependudukan", 1, true, false],
  ["kelahiran", "Surat Keterangan Kelahiran", "Pengantar kelahiran untuk pengurusan akta.", "Kependudukan", 2, false, false],
  ["ahli-waris", "Surat Keterangan Ahli Waris", "Keterangan ahli waris dengan persetujuan Lurah dan Camat.", "Hukum", 7, false, true],
  ["beda-identitas", "Surat Keterangan Beda Identitas", "Penjelasan perbedaan identitas antar dokumen.", "Kependudukan", 3, false, false],
].map(([slug, name, description, category, baseSlaDays, priorityEnabled, requiresCamat], i) => ({
  id: `service-${i + 1}`, slug, name, description, category, icon: "file",
  baseSlaDays, prioritySlaDays: 1, priorityEnabled, requiresCamat, isActive: true,
  conditions: [], slaNote: `Ilustratif: ${baseSlaDays} hari kerja.`,
  requirements: [
    { id: `${slug}-ktp`, key: "ktp", name: "KTP pemohon", description: "Salinan KTP pemohon", requirementType: "WAJIB", conditionField: null, conditionValues: [], sortOrder: 1 },
    { id: `${slug}-kk`, key: "kk", name: "Kartu Keluarga", description: "Salinan Kartu Keluarga", requirementType: "WAJIB", conditionField: null, conditionValues: [], sortOrder: 2 },
  ],
}));

function makeInitialState(): MockState {
  const now = new Date();
  const sampleApps = [
    ["sample-1", "KL-2026-001", "MENUNGGU_VERIFIKASI", 0],
    ["sample-2", "KL-2026-002", "MENUNGGU_RT_RW", 7],
    ["sample-3", "KL-2026-003", "SELESAI", 18],
  ].map(([id, applicationNumber, status, age], i) => {
    const user = DEMO_USERS[0];
    const svc = services[i];
    const submitted = new Date(now.getTime() - Number(age) * 86400000).toISOString();
    return {
      id, applicationNumber, userId: user.id, serviceTypeId: svc.id, serviceSlug: svc.slug,
      serviceName: svc.name, serviceDescription: svc.description, requiresCamat: svc.requiresCamat,
      baseSlaDays: svc.baseSlaDays, status, formData: { nama: user.name, nik: user.nik, no_hp: user.phone },
      citizenNote: null, isPriority: false, priorityReason: null, priorityStatus: "NONE",
      submittedAt: submitted, createdAt: submitted, updatedAt: submitted,
      verifiedAt: status === "MENUNGGU_VERIFIKASI" ? null : submitted,
      slaStartedAt: status === "MENUNGGU_VERIFIKASI" ? null : submitted,
      dueAt: status === "SELESAI" ? submitted : new Date(now.getTime() + 3 * 86400000).toISOString(),
      completedAt: status === "SELESAI" ? submitted : null, pausedAt: null, accumulatedPauseSeconds: 0,
      delayReason: null, currentNote: null, letterNumber: status === "SELESAI" ? "SIM/KEL/2026/001" : null,
      staffHandlerId: null, ownerName: user.name, ownerEmail: user.email,
      documents: svc.requirements.map((r, n) => ({
        id: `${id}-doc-${n}`, requirementKey: r.key, requirementName: r.name,
        fileName: `${r.key}.pdf`, fileType: "application/pdf", fileSize: 1024,
        filePath: "/uploads/demo.pdf", status: "TERVERIFIKASI", note: null,
      })),
      events: [{ id: `${id}-event-1`, actorId: user.id, actorName: user.name, actorRole: "WARGA", title: "Pengajuan dikirim", description: `Pengajuan ${applicationNumber} diterima (simulasi).`, createdAt: submitted }],
      approvals: svc.requiresCamat ? ["RT_RW", "LURAH", "CAMAT"].map((stage) => ({ id: `${id}-${stage}`, stage, status: "MENUNGGU", actorName: null })) : ["RT_RW", "LURAH"].map((stage) => ({ id: `${id}-${stage}`, stage, status: "MENUNGGU", actorName: null })),
      rating: null,
    };
  });
  return {
    users: DEMO_USERS,
    applications: sampleApps,
    notifications: [],
    staff: DEMO_USERS.filter((u) => ["PETUGAS", "RT_RW", "LURAH", "CAMAT"].includes(u.role)).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, handled: 0, ratingAvg: null, ratingCount: 0 })),
    ratings: [],
  };
}

function readState(): MockState {
  if (typeof window === "undefined") return makeInitialState();
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const initial = makeInitialState();
    writeState(initial);
    return initial;
  }
  try {
    return JSON.parse(saved) as MockState;
  } catch (error) {
    console.error("Data dummy lokal tidak dapat dibaca.", error);
    const initial = makeInitialState();
    writeState(initial);
    return initial;
  }
}

function writeState(state: MockState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function safeUser(user: MockState["users"][number]): MockUser {
  const { password: _password, ...result } = user;
  return result;
}

export function getLocalUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(USER_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as MockUser;
  } catch (error) {
    console.error("Sesi dummy lokal tidak dapat dibaca.", error);
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function loginLocal(email: string, password: string): MockUser | null {
  const user = readState().users.find((item) => item.email.toLowerCase() === email.toLowerCase().trim() && item.password === password);
  if (!user) return null;
  const safe = safeUser(user);
  window.localStorage.setItem(USER_KEY, JSON.stringify(safe));
  return safe;
}

export function registerLocal(input: { name: string; email: string; password: string; phone?: string; address?: string; nik?: string }): string | null {
  const state = readState();
  if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase().trim())) return "Email sudah digunakan.";
  if (input.password.length < 6) return "Password minimal 6 karakter.";
  const user = {
    id: crypto.randomUUID(), name: input.name.trim(), email: input.email.toLowerCase().trim(), password: input.password,
    role: "WARGA", phone: input.phone || null, address: input.address || null, nik: input.nik || null,
    rt: null, rw: null, createdAt: new Date().toISOString(),
  };
  state.users.push(user);
  writeState(state);
  window.localStorage.setItem(USER_KEY, JSON.stringify(safeUser(user)));
  return null;
}

export function logoutLocal() {
  window.localStorage.removeItem(USER_KEY);
}

function response(data: unknown, status = 200, type = "application/json") {
  return new Response(type === "application/json" ? JSON.stringify(data) : String(data), {
    status, headers: { "Content-Type": type },
  });
}

function currentUser(state: MockState) {
  const user = getLocalUser();
  return user ? state.users.find((u) => u.id === user.id) ?? null : null;
}

function enrich(app: any, state: MockState) {
  const owner = state.users.find((u) => u.id === app.userId);
  const svc = services.find((s) => s.id === app.serviceTypeId);
  return { ...app, serviceName: svc?.name ?? app.serviceName ?? "-", serviceSlug: svc?.slug ?? app.serviceSlug ?? "", requiresCamat: svc?.requiresCamat ?? app.requiresCamat ?? false, baseSlaDays: svc?.baseSlaDays ?? app.baseSlaDays ?? 3, ownerName: owner?.name ?? app.ownerName ?? "-", ownerEmail: owner?.email ?? app.ownerEmail ?? "-", ownerPhone: owner?.phone ?? null, ownerAddress: owner?.address ?? null };
}

function addNotification(state: MockState, userId: string, title: string, message: string, link: string) {
  state.notifications.unshift({ id: crypto.randomUUID(), userId, type: "PENGAJUAN", title, message, link, isRead: false, createdAt: new Date().toISOString() });
}

export async function mockApiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, window.location.origin);
  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body instanceof FormData ? init.body : typeof init.body === "string" ? JSON.parse(init.body || "{}") : {};
  const state = readState();
  const user = currentUser(state);
  const path = url.pathname;
  const parts = path.split("/").filter(Boolean);

  if (path === "/api/services" && method === "GET") {
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const cat = url.searchParams.get("cat") ?? "";
    const filtered = services.filter((s) => (!q || `${s.name} ${s.description}`.toLowerCase().includes(q)) && (!cat || s.category === cat));
    return response({ services: filtered, categories: [...new Set(services.map((s) => s.category))] });
  }
  if (parts[0] === "api" && parts[1] === "services" && parts[2] && method === "GET") {
    const service = services.find((s) => s.slug === parts[2]);
    return service ? response({ service }) : response({ error: "Layanan tidak ditemukan." }, 404);
  }
  if (path === "/api/upload" && method === "POST") {
    const file = (body as FormData).get("file") as File | null;
    if (!file) return response({ error: "File wajib diunggah." }, 400);
    return response({ path: `/uploads/${Date.now()}-${file.name}`, fileName: file.name, fileType: file.type || "application/octet-stream", fileSize: file.size });
  }
  if (path === "/api/applications" && method === "GET") {
    if (!user) return response({ error: "Login dummy diperlukan." }, 401);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    let rows = state.applications.filter((a) => user.role !== "WARGA" || a.userId === user.id);
    if (user.role === "CAMAT") rows = rows.filter((a) => a.requiresCamat);
    if (q) rows = rows.filter((a) => `${a.applicationNumber} ${a.serviceName} ${a.ownerName}`.toLowerCase().includes(q));
    if (status) rows = rows.filter((a) => a.status === status);
    return response({ applications: rows.map((a) => enrich(a, state)) });
  }
  if (path === "/api/applications" && method === "POST") {
    if (!user || user.role !== "WARGA") return response({ error: "Login warga dummy diperlukan." }, 401);
    const svc = services.find((s) => s.slug === body.serviceSlug);
    if (!svc) return response({ error: "Layanan tidak ditemukan." }, 404);
    const documents = body.documents ?? [];
    const missing = svc.requirements.filter((r) => r.requirementType === "WAJIB" && !documents.some((d: any) => d.requirementKey === r.key));
    if (missing.length) return response({ error: `Dokumen wajib belum lengkap: ${missing.map((r) => r.name).join(", ")}` }, 400);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const app = {
      id, applicationNumber: `KL-${new Date().getFullYear()}-${String(state.applications.length + 1).padStart(3, "0")}`,
      userId: user.id, serviceTypeId: svc.id, serviceSlug: svc.slug, serviceName: svc.name,
      status: "MENUNGGU_VERIFIKASI", formData: body.formData ?? {}, citizenNote: body.citizenNote ?? null,
      isPriority: !!body.isPriority, priorityReason: body.priorityReason ?? null, priorityStatus: body.isPriority ? "PENDING" : "NONE",
      priorityReasonDetail: body.priorityDetail ?? null, priorityEvidencePath: body.priorityEvidencePath ?? null,
      submittedAt: now, createdAt: now, updatedAt: now, verifiedAt: null, slaStartedAt: null,
      dueAt: null, completedAt: null, pausedAt: null, accumulatedPauseSeconds: 0, delayReason: null,
      currentNote: null, letterNumber: null, staffHandlerId: null,
      documents: documents.map((d: any) => ({ ...d, id: crypto.randomUUID(), requirementName: svc.requirements.find((r) => r.key === d.requirementKey)?.name ?? d.requirementKey, status: "MENUNGGU" })),
      events: [], approvals: (svc.requiresCamat ? ["RT_RW", "LURAH", "CAMAT"] : ["RT_RW", "LURAH"]).map((stage) => ({ id: crypto.randomUUID(), stage, status: "MENUNGGU", actorName: null })),
      rating: null,
    };
    state.applications.unshift(app);
    state.applications[0].events.push({ id: crypto.randomUUID(), actorId: user.id, actorName: user.name, actorRole: user.role, title: "Pengajuan dikirim", description: "Pengajuan diterima (simulasi).", createdAt: now });
    addNotification(state, user.id, "Pengajuan berhasil dikirim", `${app.applicationNumber} telah diterima (simulasi).`, `/pengajuan/${id}`);
    writeState(state);
    return response({ application: enrich(app, state) });
  }
  if (parts[0] === "api" && parts[1] === "applications" && parts[2]) {
    const id = parts[2];
    const app = state.applications.find((a) => a.id === id);
    if (!app) return response({ error: "Pengajuan tidak ditemukan." }, 404);
    if (!user) return response({ error: "Login dummy diperlukan." }, 401);
    if (parts.length === 3 && method === "GET") {
      const svc = services.find((s) => s.id === app.serviceTypeId);
      return response({ application: enrich(app, state), requirements: svc?.requirements ?? [], documents: app.documents ?? [], approvals: app.approvals ?? [], events: app.events ?? [], rating: app.rating ?? null });
    }
    if (parts[3] === "download" && method === "GET") {
      if (app.status !== "SELESAI") return response({ error: "Surat belum tersedia." }, 400);
      const html = `<html lang="id"><meta charset="utf-8"><h1>SIMULASI — BUKAN DOKUMEN RESMI</h1><p>${app.serviceName}</p><p>${app.applicationNumber}</p><p>${enrich(app, state).ownerName}</p></html>`;
      return response(html, 200, "text/html; charset=utf-8");
    }
    if (parts[3] === "transition" && method === "POST") {
      const action = body.action;
      const statusMap: Record<string, string> = { verify: "TERVERIFIKASI", process: app.status === "TERVERIFIKASI" ? "SEDANG_DIPROSES" : "MENUNGGU_RT_RW", approve_rt: "MENUNGGU_LURAH", approve_lurah: app.requiresCamat ? "MENUNGGU_CAMAT" : "FINALISASI", approve_camat: "FINALISASI", finalize: "SELESAI", return: "MENUNGGU_WARGA", reject: "DITOLAK", resubmit: "MENUNGGU_VERIFIKASI", extend: app.status };
      const previousStatus = app.status;
      app.status = statusMap[action] ?? app.status;
      app.updatedAt = new Date().toISOString();
      if (action === "verify") { app.verifiedAt = app.updatedAt; app.slaStartedAt = app.updatedAt; app.dueAt = new Date(Date.now() + Number(app.baseSlaDays ?? 3) * 86400000).toISOString(); }
      if (action === "finalize") { app.completedAt = app.updatedAt; app.letterNumber = `SIM/KEL/${new Date().getFullYear()}/${String(state.applications.indexOf(app) + 1).padStart(3, "0")}`; }
      if (action === "return") app.currentNote = body.note ?? "";
      if (action === "extend") { app.delayReason = body.delayReason ?? ""; app.dueAt = body.newDueAt ?? app.dueAt; }
      if (action === "resubmit") { app.currentNote = null; app.pausedAt = null; }
      app.events.push({ id: crypto.randomUUID(), actorId: user.id, actorName: user.name, actorRole: user.role, previousStatus, newStatus: app.status, title: `Status diperbarui: ${app.status}`, description: body.note ?? "", createdAt: app.updatedAt });
      addNotification(state, app.userId, "Status pengajuan diperbarui", `${app.applicationNumber}: ${app.status}`, `/pengajuan/${id}`);
      writeState(state);
      return response({ ok: true, application: enrich(app, state) });
    }
    if (parts[3] === "priority" && method === "POST") {
      app.priorityStatus = body.decision === "APPROVE" ? "APPROVED" : "REJECTED";
      app.priorityNote = body.note ?? "";
      writeState(state);
      return response({ ok: true });
    }
    if (parts[3] === "documents" && method === "POST") {
      app.documents.push(...(body.documents ?? []).map((d: any) => ({ ...d, id: crypto.randomUUID(), status: "MENUNGGU" })));
      writeState(state);
      return response({ ok: true });
    }
    if (parts[3] === "rating" && method === "POST") {
      const rating = { ...body, id: crypto.randomUUID(), applicationId: id, citizenId: user.id, createdAt: new Date().toISOString() };
      app.rating = rating;
      state.ratings.push(rating);
      writeState(state);
      return response({ rating });
    }
  }
  if (path === "/api/notifications" && method === "GET") {
    const items = state.notifications.filter((n) => n.userId === user?.id);
    if (url.searchParams.get("unread") === "1") return response({ unread: items.filter((n) => !n.isRead).length });
    return response({ notifications: items });
  }
  if (path === "/api/notifications" && method === "PATCH") {
    state.notifications.filter((n) => n.userId === user?.id && (body.all || body.ids?.includes(n.id) || n.id === url.searchParams.get("id"))).forEach((n) => { n.isRead = true; });
    writeState(state);
    return response({ ok: true });
  }
  if (path === "/api/staff" && method === "GET") return response({ staff: state.staff.map((s) => ({ ...s, handled: state.applications.filter((a) => a.staffHandlerId === s.id).length })) });
  if (path === "/api/staff" && method === "POST") {
    if (!body.name || !body.email || !body.password) return response({ error: "Data belum lengkap." }, 400);
    if (state.users.some((u) => u.email === String(body.email).toLowerCase())) return response({ error: "Email sudah dipakai." }, 409);
    const staffUser = { id: crypto.randomUUID(), name: body.name, email: String(body.email).toLowerCase(), password: body.password, role: body.role, phone: body.phone ?? null, address: null, nik: null, rt: null, rw: null, createdAt: new Date().toISOString() };
    state.users.push(staffUser);
    const item = { id: staffUser.id, name: staffUser.name, email: staffUser.email, role: staffUser.role, phone: staffUser.phone, handled: 0, ratingAvg: null, ratingCount: 0 };
    state.staff.push(item);
    writeState(state);
    return response({ staff: item });
  }
  if (path === "/api/dashboard/stats" && method === "GET") {
    const apps = state.applications.filter((a) => user?.role !== "WARGA" || a.userId === user.id);
    const done = apps.filter((a) => a.status === "SELESAI");
    const mineApps = user?.role === "WARGA" ? apps : [];
    const summary = { total: apps.length, selesai: done.length, terlambat: 0, onTimePct: 0, delta: 0, avgDays: 0, ratingAvg: 0, ratingCount: state.ratings.length, lurahAvg: 0, lurahCount: 0, waitingRT: apps.filter((a) => a.status === "MENUNGGU_RT_RW").length, waitingLurah: apps.filter((a) => a.status === "MENUNGGU_LURAH").length, waitingCamat: apps.filter((a) => a.status === "MENUNGGU_CAMAT").length, needVerify: apps.filter((a) => a.status === "MENUNGGU_VERIFIKASI").length, priorityCount: apps.filter((a) => a.isPriority).length, priorityPending: apps.filter((a) => a.priorityStatus === "PENDING").length };
    return response({ summary, trend: [], statusDist: [], perService: [], ratingDist: [], ratingByCat: {}, mine: user?.role === "WARGA" ? { total: mineApps.length, selesai: done.length, proses: mineApps.filter((a) => !["SELESAI", "DITOLAK"].includes(a.status)).length, perluPerbaikan: mineApps.filter((a) => a.status === "MENUNGGU_WARGA").length, recent: mineApps.slice(0, 5).map((a) => enrich(a, state)) } : null, lateList: [] });
  }
  return response({ error: "Endpoint dummy tidak tersedia." }, 404);
}
