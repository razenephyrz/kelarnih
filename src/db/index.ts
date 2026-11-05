import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __civicflowPool?: Pool;
};

export const pool =
  globalForDb.__civicflowPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__civicflowPool = pool;
}

// Schema-aware client: required by the better-auth drizzle adapter
// and used by all CivicFlow API routes.
export const db = drizzle(pool, { schema });
export type Db = typeof db;
