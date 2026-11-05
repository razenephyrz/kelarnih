// better-auth server instance (App Router).
// SvelteKit equivalent: same `betterAuth({...})` call, mounted via
// `sveltekit-reference/src/routes/api/auth/[...all]/+server.ts` (see reference folder).
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

function baseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "http://localhost:3000";
}

export const auth = betterAuth({
  baseURL: baseURL(),
  secret: process.env.BETTER_AUTH_SECRET ?? "civicflow-demo-secret-not-for-production",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Demo stays frictionless: no verification e-mail round-trip.
    requireEmailVerification: false,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "citizen", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  advanced: {
    cookiePrefix: "civicflow",
  },
});

export type Auth = typeof auth;
