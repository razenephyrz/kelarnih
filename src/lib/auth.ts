import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "kelarin_session";
const SESSION_DAYS = 7;
const SESSION_SECONDS = SESSION_DAYS * 24 * 3600;

export type SessionUser = {
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

type DemoAccount = {
  email: string;
  password: string;
  user: Omit<SessionUser, "createdAt">;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "warga@kelar.in",
    password: "warga123",
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Ibna Warga",
      email: "warga@kelar.in",
      role: "WARGA",
      phone: "0812-0000-0001",
      address: "Jl. Melati No. 12 RT 03 RW 05, Kel. Contoh",
      nik: "3201010101010001",
      rt: "03",
      rw: "05",
    },
  },
  {
    email: "petugas@kelar.in",
    password: "petugas123",
    user: {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Andi Petugas",
      email: "petugas@kelar.in",
      role: "PETUGAS",
      phone: "0812-1000-0001",
      address: "Kantor Kelurahan Contoh",
      nik: null,
      rt: null,
      rw: null,
    },
  },
  {
    email: "rtrw@kelar.in",
    password: "rtrw123",
    user: {
      id: "00000000-0000-4000-8000-000000000003",
      name: "H. Bambang (RT/RW)",
      email: "rtrw@kelar.in",
      role: "RT_RW",
      phone: "0812-2000-0001",
      address: "Jl. Melati RT 03 RW 05",
      nik: null,
      rt: "03",
      rw: "05",
    },
  },
  {
    email: "lurah@kelar.in",
    password: "lurah123",
    user: {
      id: "00000000-0000-4000-8000-000000000004",
      name: "Dra. Ratna Wulandari",
      email: "lurah@kelar.in",
      role: "LURAH",
      phone: "0812-3000-0001",
      address: "Kantor Kelurahan Contoh",
      nik: null,
      rt: null,
      rw: null,
    },
  },
  {
    email: "camat@kelar.in",
    password: "camat123",
    user: {
      id: "00000000-0000-4000-8000-000000000005",
      name: "Drs. H. Camat Contoh",
      email: "camat@kelar.in",
      role: "CAMAT",
      phone: "0812-4000-0001",
      address: "Kantor Kecamatan Contoh",
      nik: null,
      rt: null,
      rw: null,
    },
  },
];

type DemoSession = { user: SessionUser; expiresAt: number };

function sessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET wajib diatur untuk session saat production.");
  }
  return "kelarin-demo-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function readDemoSession(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as DemoSession;
    if (
      !session.user ||
      typeof session.user.id !== "string" ||
      typeof session.user.role !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
}

export function authenticateDemoUser(email: string, password: string): SessionUser | null {
  const account = DEMO_ACCOUNTS.find(
    (candidate) => candidate.email === email && candidate.password === password,
  );
  if (!account) return null;
  return { ...account.user, createdAt: new Date().toISOString() };
}

export function getRoleRedirectPath(role: string) {
  const paths: Record<string, string> = {
    WARGA: "/dashboard",
    PETUGAS: "/verifikasi",
    RT_RW: "/persetujuan",
    LURAH: "/dashboard",
    CAMAT: "/persetujuan",
  };
  return paths[role] ?? "/dashboard";
}

export async function createDemoSession(user: SessionUser) {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ user, expiresAt } satisfies DemoSession),
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
    secure: process.env.NODE_ENV === "production",
  });
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // fallback scrypt
    return false;
  }
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const { db } = await import("@/db");
  const { sessions } = await import("@/db/schema");
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await db.insert(sessions).values({ userId, token, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && !readDemoSession(token) && process.env.DATABASE_URL) {
    const { db } = await import("@/db");
    const { sessions } = await import("@/db/schema");
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const demoUser = readDemoSession(token);
  if (demoUser) return demoUser;
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  const { sessions, users } = await import("@/db/schema");
  const rows = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  const sess = rows[0];
  if (!sess) return null;
  if (new Date(sess.expiresAt).getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token)).catch(() => {});
    return null;
  }
  const urows = await db.select().from(users).where(eq(users.id, sess.userId)).limit(1);
  const u = urows[0];
  if (!u) return null;
  const { passwordHash, ...safe } = u as any;
  return safe as {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    address: string | null;
    nik: string | null;
    rt: string | null;
    rw: string | null;
    createdAt: Date;
  };
}

export async function getSessionUserFromToken(token: string | undefined | null) {
  if (!token) return null;
  const demoUser = readDemoSession(token);
  if (demoUser) return demoUser;
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  const { sessions, users } = await import("@/db/schema");
  const rows = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  const sess = rows[0];
  if (!sess) return null;
  if (new Date(sess.expiresAt).getTime() < Date.now()) return null;
  const urows = await db.select().from(users).where(eq(users.id, sess.userId)).limit(1);
  const u = urows[0];
  if (!u) return null;
  const { passwordHash, ...safe } = u as any;
  return safe;
}

export function requireRoles(user: { role: string } | null, allowed: string[]) {
  if (!user) return false;
  return allowed.includes(user.role);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
