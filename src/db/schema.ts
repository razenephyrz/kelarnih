// CivicFlow — Drizzle ORM schema (PostgreSQL in this sandbox).
// Portable to MySQL (`mysql2`) for the SvelteKit target: identical table/column
// names, only the column builders change (pg-core -> mysql-core).
// See `sveltekit-reference/README.md` for the 1:1 MySQL variant + Netlify adapter wiring.
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ------------------------------------------------------------- better-auth core
// Tables required by the better-auth drizzle adapter (provider: "pg").
// Extra columns (`role`, `passwordHash`) extend the default model for the demo.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("citizen"),
  // Demo-only credential reference (mock hash). better-auth email/password
  // normally uses the `account` table; this column keeps the seeded demo
  // logins working without an SMTP / verification round-trip.
  passwordHash: text("password_hash").notNull().default(""),
  avatarColor: text("avatar_color").default("#274C77"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ------------------------------------------------------------- CivicFlow domain
export const procedures = pgTable("procedures", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  description: text("description").notNull().default(""),
  eligibility: jsonb("eligibility").$type<string[]>().notNull().default([]),
  requiredDocuments: jsonb("required_documents").$type<string[]>().notNull().default([]),
  procedureSteps: jsonb("procedure_steps")
    .$type<{ title: string; detail: string; duration: string }[]>()
    .notNull()
    .default([]),
  responsibleDepartment: text("responsible_department").notNull().default("Front Office"),
  processingTarget: text("processing_target").notNull().default(""),
  processingDays: integer("processing_days").notNull().default(7),
  commonPitfalls: jsonb("common_pitfalls").$type<string[]>().notNull().default([]),
  sourceReference: text("source_reference").notNull().default(""),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminRequests = pgTable("admin_requests", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  documentType: text("document_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  targetCompletionAt: timestamp("target_completion_at", { withTimezone: true }).notNull().defaultNow(),
  assignedDepartment: text("assigned_department").notNull().default("Front Office"),
  requiredActions: jsonb("required_actions").$type<string[]>().notNull().default([]),
  delayReason: text("delay_reason"),
  escalationFlag: boolean("escalation_flag").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default({}),
});

export const requestHistory = pgTable("request_history", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull(),
  previousStatus: text("previous_status").notNull().default("—"),
  newStatus: text("new_status").notNull(),
  explanation: text("explanation").notNull().default(""),
  actorId: text("actor_id").notNull().default("system"),
  actorName: text("actor_name").notNull().default("System"),
  actorRole: text("actor_role").notNull().default("system"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  recipientId: text("recipient_id").notNull(),
  requestId: text("request_id"),
  title: text("title").notNull(),
  message: text("message").notNull().default(""),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof user.$inferSelect;
export type DbAdminRequest = typeof adminRequests.$inferSelect;
