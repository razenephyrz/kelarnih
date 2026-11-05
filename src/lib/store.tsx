"use client";

// CivicFlow centralized store.
// Persistence strategy (mirrors the SvelteKit target's `+server.ts` + Drizzle split):
//   1. Server first — hydrate from GET /api/bootstrap (Postgres via Drizzle ORM),
//      mirror every mutation back with POST/PATCH/DELETE (fire-and-forget).
//   2. localStorage second — instant paint + offline fallback; same keys as before.
// Auth: mock session (localStorage) stays the demo path; better-auth is mounted at
// /api/auth/[...all] for the production cutover (see src/lib/auth.ts).
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AdministrativeRequest,
  DocumentProcedure,
  Notification,
  RequestHistory,
  RequestStatus,
  Role,
  User,
} from "@/types";
import {
  seedHistory,
  seedNotifications,
  seedProcedures,
  seedRequests,
  seedUsers,
} from "@/data/seed";
import { generateRequestId, mockHash, uid, verifyMock } from "@/lib/utils";

const VERSION_KEY = "civicflow/version/v1";
const USERS_KEY = "civicflow/users/v1";
const SESSION_KEY = "civicflow/session/v1";
const REQUESTS_KEY = "civicflow/requests/v1";
const HISTORY_KEY = "civicflow/history/v1";
const NOTIFS_KEY = "civicflow/notifications/v1";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface CivicContextValue {
  ready: boolean;
  user: User | null;
  users: User[];
  requests: AdministrativeRequest[];
  history: RequestHistory[];
  notifications: Notification[];
  procedures: DocumentProcedure[];
  myRequests: AdministrativeRequest[];
  myNotifications: Notification[];
  unreadCount: number;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (input: RegisterInput) => { ok: boolean; error?: string };
  logout: () => void;
  createRequest: (input: {
    documentType: string;
    title: string;
    description: string;
    metadata: Record<string, string>;
    assignedDepartment: string;
    targetDays: number;
  }) => AdministrativeRequest;
  updateRequest: (id: string, patch: Partial<AdministrativeRequest>, note?: string) => void;
  deleteRequest: (id: string) => { ok: boolean; error?: string };
  changeStatus: (
    id: string,
    newStatus: RequestStatus,
    explanation: string,
    opts?: { delayReason?: string; escalationFlag?: boolean; requiredActions?: string[] }
  ) => void;
  resolveAction: (id: string, note: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  resetDemo: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

const CivicContext = createContext<CivicContextValue | null>(null);

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// Best-effort server mirror — never blocks or breaks the UI when offline.
function mirror(path: string, init?: RequestInit) {
  try {
    fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

async function fetchBootstrap(): Promise<{
  users: User[];
  requests: AdministrativeRequest[];
  history: RequestHistory[];
  notifications: Notification[];
  procedures: DocumentProcedure[];
} | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch("/api/bootstrap", { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return {
      users: data.users ?? [],
      requests: data.requests ?? [],
      history: data.history ?? [],
      notifications: data.notifications ?? [],
      procedures: data.procedures ?? [],
    };
  } catch {
    return null;
  }
}

export function CivicProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [requests, setRequests] = useState<AdministrativeRequest[]>([]);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [procedures, setProcedures] = useState<DocumentProcedure[]>(() => seedProcedures());
  const hydratedFromServer = useRef(false);

  // bootstrap: local cache first (instant paint), then server reconcile.
  useEffect(() => {
    let cancelled = false;
    const localUsers = readLS<User[]>(USERS_KEY, []);
    const hasLocal = typeof window !== "undefined" && !!localStorage.getItem(VERSION_KEY);
    if (hasLocal) {
      setUsers(localUsers.length ? localUsers : seedUsers());
      setRequests(readLS<AdministrativeRequest[]>(REQUESTS_KEY, seedRequests()));
      setHistory(readLS<RequestHistory[]>(HISTORY_KEY, seedHistory()));
      setNotifications(readLS<Notification[]>(NOTIFS_KEY, seedNotifications()));
      const sess = readLS<{ userId: string } | null>(SESSION_KEY, null);
      setSessionId(sess?.userId ?? null);
      setReady(true);
    } else {
      // First visit: optimistic seeds until the server answers.
      setUsers(seedUsers());
      setRequests(seedRequests());
      setHistory(seedHistory());
      setNotifications(seedNotifications());
      setReady(true);
    }

    fetchBootstrap().then((server) => {
      if (cancelled || !server) {
        if (!hasLocal) {
          writeLS(USERS_KEY, seedUsers());
          writeLS(REQUESTS_KEY, seedRequests());
          writeLS(HISTORY_KEY, seedHistory());
          writeLS(NOTIFS_KEY, seedNotifications());
          writeLS(VERSION_KEY, "seeded-v2-server-cache");
        }
        return;
      }
      hydratedFromServer.current = true;
      // Union server users with any local-only mock registrations (offline edge).
      const byEmail = new Map<string, User>();
      for (const u of server.users) byEmail.set(u.email.toLowerCase(), u);
      for (const u of readLS<User[]>(USERS_KEY, [])) {
        if (!byEmail.has(u.email.toLowerCase())) byEmail.set(u.email.toLowerCase(), u);
      }
      const mergedUsers = [...byEmail.values()];
      setUsers(mergedUsers);
      setRequests(server.requests.length ? server.requests : readLS<AdministrativeRequest[]>(REQUESTS_KEY, []));
      setHistory(server.history);
      setNotifications(server.notifications);
      if (server.procedures.length) setProcedures(server.procedures);
      writeLS(USERS_KEY, mergedUsers);
      writeLS(REQUESTS_KEY, server.requests);
      writeLS(HISTORY_KEY, server.history);
      writeLS(NOTIFS_KEY, server.notifications);
      writeLS(VERSION_KEY, "seeded-v2-server-cache");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeLS(USERS_KEY, users);
  }, [users, ready]);
  useEffect(() => {
    if (!ready) return;
    writeLS(REQUESTS_KEY, requests);
  }, [requests, ready]);
  useEffect(() => {
    if (!ready) return;
    writeLS(HISTORY_KEY, history);
  }, [history, ready]);
  useEffect(() => {
    if (!ready) return;
    writeLS(NOTIFS_KEY, notifications);
  }, [notifications, ready]);

  const user = useMemo(() => users.find((u) => u.id === sessionId) ?? null, [users, sessionId]);

  const myRequests = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin")
      return [...requests].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return requests
      .filter((r) => r.ownerId === user.id)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [requests, user]);

  const myNotifications = useMemo(() => {
    if (!user) return [];
    return notifications
      .filter((n) => n.recipientId === user.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [notifications, user]);

  const unreadCount = useMemo(
    () => myNotifications.filter((n) => !n.isRead).length,
    [myNotifications]
  );

  const pushNotification = useCallback((n: Omit<Notification, "id" | "createdAt"> & { createdAt?: string }) => {
    const full: Notification = {
      id: uid("n"),
      createdAt: new Date().toISOString(),
      ...n,
    } as Notification;
    setNotifications((prev) => [full, ...prev]);
  }, []);

  const addHistory = useCallback((entry: Omit<RequestHistory, "id" | "timestamp"> & { timestamp?: string }) => {
    const full: RequestHistory = {
      id: uid("h"),
      timestamp: new Date().toISOString(),
      ...entry,
    } as RequestHistory;
    setHistory((prev) => [...prev, full]);
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      const found = users.find((u) => u.email.toLowerCase() === normalized);
      if (!found)
        return { ok: false, error: "No account found for this email. Try a demo account below." };
      if (!verifyMock(password, found.passwordHash))
        return { ok: false, error: "Incorrect password. Demo password is shown below." };
      setSessionId(found.id);
      writeLS(SESSION_KEY, { userId: found.id });
      return { ok: true };
    },
    [users]
  );

  const register = useCallback(
    (input: RegisterInput) => {
      const email = input.email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === email))
        return { ok: false, error: "An account with this email already exists. Try signing in." };
      const created: User = {
        id: uid("u"),
        name: input.name.trim(),
        email,
        passwordHash: mockHash(input.password),
        role: "citizen",
        createdAt: new Date().toISOString(),
        avatarColor: "#274C77",
      };
      setUsers((prev) => [...prev, created]);
      setSessionId(created.id);
      writeLS(SESSION_KEY, { userId: created.id });
      // Mirror into Postgres so the account survives cache clears / other devices.
      mirror("/api/users", {
        method: "POST",
        body: JSON.stringify({ id: created.id, name: created.name, email, passwordHash: created.passwordHash }),
      });
      pushNotification({
        recipientId: created.id,
        title: "Welcome to CivicFlow",
        message:
          "Prototype message: your mock account was created. Create your first request to see tracking in action.",
        type: "info",
        isRead: false,
      });
      return { ok: true };
    },
    [users, pushNotification]
  );

  const logout = useCallback(() => {
    setSessionId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const createRequest: CivicContextValue["createRequest"] = useCallback(
    (input) => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      const target = new Date();
      target.setDate(target.getDate() + input.targetDays);
      target.setHours(17, 0, 0, 0);
      const created: AdministrativeRequest = {
        id: generateRequestId(),
        ownerId: user.id,
        documentType: input.documentType,
        title: input.title.trim(),
        description: input.description.trim(),
        status: "submitted",
        createdAt: now,
        updatedAt: now,
        targetCompletionAt: target.toISOString(),
        assignedDepartment: input.assignedDepartment,
        requiredActions: [],
        metadata: input.metadata,
      };
      setRequests((prev) => [created, ...prev]);
      addHistory({
        requestId: created.id,
        previousStatus: "—",
        newStatus: "submitted",
        explanation: "Request submitted. Received at front office intake.",
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
      });
      pushNotification({
        recipientId: user.id,
        requestId: created.id,
        title: `Request ${created.id} received`,
        message: `Prototype message: your ${input.documentType} request "${created.title}" was received and is awaiting verification.`,
        type: "request_created",
        isRead: false,
      });
      // Persist server-side (Drizzle). Server generates its own history/notification
      // rows only when the client is offline-first; here we mirror the same payload.
      mirror("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          id: created.id,
          ownerId: created.ownerId,
          documentType: created.documentType,
          title: created.title,
          description: created.description,
          assignedDepartment: created.assignedDepartment,
          targetDays: input.targetDays,
          metadata: created.metadata,
          actorName: user.name,
          actorRole: user.role,
        }),
      });
      return created;
    },
    [user, addHistory, pushNotification]
  );

  const updateRequest: CivicContextValue["updateRequest"] = useCallback(
    (id, patch, note) => {
      if (!user) return;
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r))
      );
      if (note) {
        const current = requests.find((r) => r.id === id);
        addHistory({
          requestId: id,
          previousStatus: current?.status ?? "submitted",
          newStatus: (patch.status as RequestStatus) ?? current?.status ?? "submitted",
          explanation: note,
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
        });
      }
      mirror(`/api/requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: patch.title,
          description: patch.description,
          status: patch.status,
          requiredActions: patch.requiredActions,
          delayReason: patch.delayReason,
          escalationFlag: patch.escalationFlag,
          metadata: patch.metadata,
          note,
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
        }),
      });
    },
    [user, requests, addHistory]
  );

  const deleteRequest: CivicContextValue["deleteRequest"] = useCallback(
    (id) => {
      const target = requests.find((r) => r.id === id);
      if (!target) return { ok: false, error: "Request not found." };
      if (target.status === "completed" || target.status === "approved")
        return {
          ok: false,
          error:
            "Completed or approved requests are part of the official record and cannot be deleted in this demo.",
        };
      if (user?.role !== "admin" && target.ownerId !== user?.id)
        return { ok: false, error: "You can only delete your own requests." };
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setHistory((prev) => prev.filter((h) => h.requestId !== id));
      mirror(`/api/requests/${encodeURIComponent(id)}`, { method: "DELETE" });
      return { ok: true };
    },
    [requests, user]
  );

  const changeStatus: CivicContextValue["changeStatus"] = useCallback(
    (id, newStatus, explanation, opts) => {
      const target = requests.find((r) => r.id === id);
      if (!target || !user) return;
      const prevStatus = target.status;
      setRequests((prevR) =>
        prevR.map((r) =>
          r.id === id
            ? {
                ...r,
                status: newStatus,
                updatedAt: new Date().toISOString(),
                delayReason: opts?.delayReason ?? r.delayReason,
                escalationFlag: opts?.escalationFlag ?? r.escalationFlag,
                requiredActions: opts?.requiredActions ?? r.requiredActions,
              }
            : r
        )
      );
      addHistory({
        requestId: id,
        previousStatus: prevStatus,
        newStatus,
        explanation: explanation || `Status changed from ${prevStatus} to ${newStatus}.`,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
      });
      const type =
        newStatus === "completed"
          ? "completed"
          : newStatus === "action_required"
            ? "action_required"
            : "status_change";
      pushNotification({
        recipientId: target.ownerId,
        requestId: id,
        title:
          newStatus === "completed"
            ? `Request ${id} completed`
            : newStatus === "action_required"
              ? `Action needed on ${id}`
              : `Update on ${id}: ${newStatus.replace("_", " ")}`,
        message: `Prototype message: ${explanation}`,
        type,
        isRead: false,
      });
      mirror(`/api/requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          explanation,
          delayReason: opts?.delayReason,
          escalationFlag: opts?.escalationFlag,
          requiredActions: opts?.requiredActions,
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
        }),
      });
    },
    [requests, user, addHistory, pushNotification]
  );

  const resolveAction = useCallback(
    (id: string, note: string) => {
      const target = requests.find((r) => r.id === id);
      if (!target || !user) return;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "under_review",
                requiredActions: [],
                escalationFlag: false,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      addHistory({
        requestId: id,
        previousStatus: "action_required",
        newStatus: "under_review",
        explanation: note || "Applicant resubmitted the requested information. Returned to review queue.",
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
      });
      pushNotification({
        recipientId: target.ownerId,
        requestId: id,
        title: `Resubmitted: ${id} back in review`,
        message: `Prototype message: ${note || "Requested information resubmitted."}`,
        type: "status_change",
        isRead: false,
      });
      mirror(`/api/requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "under_review",
          requiredActions: [],
          escalationFlag: false,
          explanation: note || "Applicant resubmitted the requested information. Returned to review queue.",
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
        }),
      });
    },
    [requests, user, addHistory, pushNotification]
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    mirror("/api/notifications", { method: "PATCH", body: JSON.stringify({ ids: [id], isRead: true }) });
  }, []);

  const markAllRead = useCallback(() => {
    const ids = myNotifications.filter((n) => !n.isRead).map((n) => n.id);
    setNotifications((prev) =>
      prev.map((n) => (user && n.recipientId === user.id ? { ...n, isRead: true } : n))
    );
    if (ids.length && user)
      mirror("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ ids, isRead: true, recipientId: user.id }),
      });
  }, [user, myNotifications]);

  const resetDemo = useCallback(() => {
    const u = seedUsers();
    const r = seedRequests();
    const h = seedHistory();
    const n = seedNotifications();
    // Keep any locally registered mock accounts across a reset.
    setUsers((prev) => {
      const seeded = new Set(u.map((x) => x.email.toLowerCase()));
      const custom = prev.filter((x) => !seeded.has(x.email.toLowerCase()));
      const merged = [...u, ...custom];
      writeLS(USERS_KEY, merged);
      for (const c of custom) {
        mirror("/api/users", {
          method: "POST",
          body: JSON.stringify({ id: c.id, name: c.name, email: c.email, passwordHash: c.passwordHash }),
        });
      }
      return merged;
    });
    setRequests(r);
    setHistory(h);
    setNotifications(n);
    writeLS(REQUESTS_KEY, r);
    writeLS(HISTORY_KEY, h);
    writeLS(NOTIFS_KEY, n);
    writeLS(VERSION_KEY, "seeded-v2-server-cache");
    // Reseed Postgres too so server + client stay consistent.
    mirror("/api/bootstrap", { method: "POST", body: JSON.stringify({}) });
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<User>) => {
      if (!user) return;
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...patch } : u)));
    },
    [user]
  );

  const value: CivicContextValue = {
    ready,
    user,
    users,
    requests,
    history,
    notifications,
    procedures,
    myRequests,
    myNotifications,
    unreadCount,
    login,
    register,
    logout,
    createRequest,
    updateRequest,
    deleteRequest,
    changeStatus,
    resolveAction,
    markRead,
    markAllRead,
    resetDemo,
    updateProfile,
  };

  return <CivicContext.Provider value={value}>{children}</CivicContext.Provider>;
}

export function useCivic(): CivicContextValue {
  const ctx = useContext(CivicContext);
  if (!ctx) throw new Error("useCivic must be used within CivicProvider");
  return ctx;
}

export function roleHome(role: Role): string {
  return role === "admin" ? "/admin" : "/dashboard";
}
