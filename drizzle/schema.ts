import { int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const subscriptions = mysqlTable("subscriptions", {
  userId: int("userId").notNull().primaryKey().references(() => users.id),
  plan: mysqlEnum("plan", ["none", "monthly", "yearly"]).default("none").notNull(),
  expiresAt: timestamp("expiresAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const jobs = mysqlTable("jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  workDateTimeTbd: int("workDateTimeTbd").notNull().default(0),
  workDateTbd: int("workDateTbd").notNull().default(0),
  workTimeTbd: int("workTimeTbd").notNull().default(0),
  workDate: varchar("workDate", { length: 10 }),
  workStartTime: varchar("workStartTime", { length: 5 }),
  workEndTime: varchar("workEndTime", { length: 5 }),
  budgetMin: int("budgetMin").notNull(),
  budgetMax: int("budgetMax").notNull(),
  currency: varchar("currency", { length: 16 }).notNull(),
  location: varchar("location", { length: 128 }).notNull(),
  timeline: varchar("timeline", { length: 64 }).notNull().default("未指定"),
  clientName: varchar("clientName", { length: 128 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 128 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 64 }),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  removedAt: timestamp("removedAt"),
});

export const jobSkills = mysqlTable(
  "job_skills",
  {
    jobId: varchar("jobId", { length: 36 }).notNull().references(() => jobs.id),
    skill: varchar("skill", { length: 255 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.jobId, t.skill] }),
  }),
);

/** Expo push tokens for new-job alerts; one row per device token. */
export const pushDevices = mysqlTable("push_devices", {
  expoPushToken: varchar("expoPushToken", { length: 255 }).primaryKey(),
  userId: int("userId").references(() => users.id),
  platform: varchar("platform", { length: 16 }),
  jobAlertsEnabled: int("jobAlertsEnabled").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
