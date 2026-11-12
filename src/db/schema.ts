import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ---- Users ----
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("WARGA"),
  phone: varchar("phone", { length: 40 }),
  address: text("address"),
  nik: varchar("nik", { length: 32 }),
  rt: varchar("rt", { length: 10 }),
  rw: varchar("rw", { length: 10 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---- Services ----
export const serviceTypes = pgTable("service_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 80 }).notNull().default("Keterangan"),
  icon: varchar("icon", { length: 40 }).notNull().default("file"),
  baseSlaDays: integer("base_sla_days").notNull().default(3),
  prioritySlaDays: integer("priority_sla_days").notNull().default(1),
  priorityEnabled: boolean("priority_enabled").notNull().default(false),
  requiresCamat: boolean("requires_camat").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  conditions: jsonb("conditions").default([]),
  slaNote: text("sla_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceRequirements = pgTable("service_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypes.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 80 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  whyNeeded: text("why_needed"),
  requirementType: varchar("requirement_type", { length: 20 }).notNull().default("WAJIB"),
  conditionField: varchar("condition_field", { length: 80 }),
  conditionValues: jsonb("condition_values").default([]),
  needsEvidence: boolean("needs_evidence").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---- Applications ----
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationNumber: varchar("application_number", { length: 40 }).notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceTypeId: uuid("service_type_id")
    .notNull()
    .references(() => serviceTypes.id),
  status: varchar("status", { length: 40 }).notNull().default("MENUNGGU_VERIFIKASI"),
  formData: jsonb("form_data").default({}),
  citizenNote: text("citizen_note"),
  isPriority: boolean("is_priority").notNull().default(false),
  priorityReason: varchar("priority_reason", { length: 80 }),
  priorityReasonDetail: text("priority_reason_detail"),
  priorityEvidencePath: text("priority_evidence_path"),
  priorityStatus: varchar("priority_status", { length: 20 }).notNull().default("NONE"),
  priorityNote: text("priority_note"),
  priorityDecidedBy: uuid("priority_decided_by").references(() => users.id),
  priorityDecidedAt: timestamp("priority_decided_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  slaStartedAt: timestamp("sla_started_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  accumulatedPauseSeconds: integer("accumulated_pause_seconds").notNull().default(0),
  delayReason: text("delay_reason"),
  letterPath: text("letter_path"),
  letterNumber: varchar("letter_number", { length: 80 }),
  staffHandlerId: uuid("staff_handler_id").references(() => users.id),
  currentNote: text("current_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applicationDocuments = pgTable("application_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  requirementKey: varchar("requirement_key", { length: 80 }).notNull(),
  requirementName: varchar("requirement_name", { length: 200 }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size"),
  filePath: text("file_path").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("MENUNGGU"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const approvalSteps = pgTable("approval_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  stage: varchar("stage", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("MENUNGGU"),
  actorId: uuid("actor_id").references(() => users.id),
  note: text("note"),
  actedAt: timestamp("acted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applicationEvents = pgTable("application_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id),
  actorName: varchar("actor_name", { length: 160 }),
  actorRole: varchar("actor_role", { length: 20 }),
  previousStatus: varchar("previous_status", { length: 40 }),
  newStatus: varchar("new_status", { length: 40 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, {
    onDelete: "cascade",
  }),
  type: varchar("type", { length: 60 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  link: varchar("link", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .unique()
    .references(() => applications.id, { onDelete: "cascade" }),
  citizenId: uuid("citizen_id").notNull().references(() => users.id),
  staffId: uuid("staff_id").references(() => users.id),
  lurahId: uuid("lurah_id").references(() => users.id),
  score: integer("score").notNull(),
  category: varchar("category", { length: 40 }).notNull().default("KECEPATAN"),
  comment: text("comment"),
  contextTag: varchar("context_tag", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const slaConfig = pgTable("sla_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  value: jsonb("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 120 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 80 }),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRole = "WARGA" | "PETUGAS" | "RT_RW" | "LURAH" | "CAMAT";
export type AppStatus =
  | "MENUNGGU_VERIFIKASI"
  | "MENUNGGU_WARGA"
  | "TERVERIFIKASI"
  | "SEDANG_DIPROSES"
  | "MENUNGGU_RT_RW"
  | "MENUNGGU_LURAH"
  | "MENUNGGU_CAMAT"
  | "FINALISASI"
  | "SELESAI"
  | "DITOLAK";
