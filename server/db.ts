import { desc, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { InsertUser, jobSkills, jobs, subscriptions, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { randomUUID } from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;
let _memoryNextUserId = 1;
const _memoryUsers = new Map<string, typeof users.$inferSelect>();
let _memorySubscriptions = new Map<number, { plan: "none" | "monthly" | "yearly"; expiresAt: Date | null }>();
let _memoryJobs: Array<{
  id: string;
  title: string;
  description: string;
  category: string;
  workDateTbd: boolean;
  workTimeTbd: boolean;
  workDate: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  location: string;
  timeline: string;
  skills: string[];
  clientName: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdByUserId: number;
  createdAt: Date;
  removedAt: Date | null;
}> = [];

const isDbConnectionError = (error: unknown) => {
  const anyErr = error as any;
  const code: string | undefined = anyErr?.code ?? anyErr?.cause?.code ?? anyErr?.cause?.cause?.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
  );
};

const resetDb = () => {
  try {
    _pool?.end();
  } catch {}
  _pool = null;
  _db = null;
};

export async function getDb() {
  if (!process.env.DATABASE_URL) return _db;

  if (!_pool) {
    try {
      _pool = mysql.createPool(process.env.DATABASE_URL);
    } catch {
      resetDb();
      return null;
    }
  }

  try {
    await _pool.promise().query("SELECT 1");
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      return null;
    }
    throw error;
  }

  if (!_db) {
    _db = drizzle(_pool);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  const upsertInMemory = () => {
    const now = new Date();
    const existing = _memoryUsers.get(user.openId);

    const nextRole =
      user.role !== undefined ? user.role : user.openId === ENV.ownerOpenId ? "admin" : "user";

    if (!existing) {
      _memoryUsers.set(user.openId, {
        id: _memoryNextUserId++,
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: nextRole,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: user.lastSignedIn ?? now,
      });
      return;
    }

    _memoryUsers.set(user.openId, {
      ...existing,
      name: user.name === undefined ? existing.name : user.name ?? null,
      email: user.email === undefined ? existing.email : user.email ?? null,
      loginMethod: user.loginMethod === undefined ? existing.loginMethod : user.loginMethod ?? null,
      role: nextRole,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? existing.lastSignedIn ?? now,
    });
    return;
  };

  if (!db) return upsertInMemory();

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      return upsertInMemory();
    }
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return _memoryUsers.get(openId);
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      return _memoryUsers.get(openId);
    }
    throw error;
  }
}

export type SubscriptionPlan = "none" | "monthly" | "yearly";
export type SubscriptionStatus = { plan: SubscriptionPlan; expiresAt: Date | null };

export async function getSubscriptionStatus(userId: number): Promise<SubscriptionStatus> {
  const db = await getDb();
  if (!db) {
    return _memorySubscriptions.get(userId) ?? { plan: "none", expiresAt: null };
  }

  try {
    const rows = await db
      .select({
        plan: subscriptions.plan,
        expiresAt: subscriptions.expiresAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (rows.length === 0) return { plan: "none", expiresAt: null };
    const row = rows[0]!;
    return { plan: row.plan as SubscriptionPlan, expiresAt: row.expiresAt ?? null };
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      return _memorySubscriptions.get(userId) ?? { plan: "none", expiresAt: null };
    }
    throw error;
  }
}

export async function setSubscriptionStatus(userId: number, status: SubscriptionStatus): Promise<void> {
  const db = await getDb();
  if (!db) {
    _memorySubscriptions.set(userId, status);
    return;
  }

  try {
    await db
      .insert(subscriptions)
      .values({
        userId,
        plan: status.plan,
        expiresAt: status.expiresAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          plan: status.plan,
          expiresAt: status.expiresAt,
        },
      });
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      _memorySubscriptions.set(userId, status);
      return;
    }
    throw error;
  }
}

export type JobRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  workDateTbd: boolean;
  workTimeTbd: boolean;
  workDate: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  location: string;
  timeline: string;
  skills: string[];
  clientName: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdByUserId: number;
  createdAt: Date;
  removedAt: Date | null;
};

export async function listJobs(viewer: typeof users.$inferSelect | null): Promise<JobRecord[]> {
  const db = await getDb();
  const listInMemory = () => {
    const includeRemoved = Boolean(viewer?.role === "admin");
    return _memoryJobs
      .filter((job) => (includeRemoved ? true : !job.removedAt))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };
  if (!db) return listInMemory();

  try {
    const includeRemoved = Boolean(viewer?.role === "admin");
    const jobRows = await db
      .select()
      .from(jobs)
      .where(includeRemoved ? undefined : isNull(jobs.removedAt))
      .orderBy(desc(jobs.createdAt));

    if (jobRows.length === 0) return [];

    const jobIds = jobRows.map((row) => row.id);
    const skillRows = await db.select().from(jobSkills).where(inArray(jobSkills.jobId, jobIds));

    const map = new Map<string, string[]>();
    for (const r of skillRows as any[]) {
      const list = map.get(r.jobId) ?? [];
      list.push(r.skill);
      map.set(r.jobId, list);
    }

    return jobRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      workDateTbd: Boolean((row as any).workDateTbd ?? (row as any).workDateTimeTbd),
      workTimeTbd: Boolean((row as any).workTimeTbd ?? (row as any).workDateTimeTbd),
      workDate: (row as any).workDate ?? null,
      workStartTime: (row as any).workStartTime ?? null,
      workEndTime: (row as any).workEndTime ?? null,
      budgetMin: row.budgetMin,
      budgetMax: row.budgetMax,
      currency: row.currency,
      location: row.location,
      timeline: row.timeline,
      skills: map.get(row.id) ?? [],
      clientName: row.clientName,
      contactPerson: (row as any).contactPerson ?? null,
      contactEmail: row.contactEmail ?? null,
      contactPhone: row.contactPhone ?? null,
      createdByUserId: row.createdByUserId,
      createdAt: row.createdAt,
      removedAt: row.removedAt ?? null,
    }));
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      return listInMemory();
    }
    throw error;
  }
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  const db = await getDb();
  const getInMemory = () => _memoryJobs.find((j) => j.id === id) ?? null;
  if (!db) return getInMemory();

  try {
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (jobRows.length === 0) return null;

    const job = jobRows[0]!;
    const skillRows = await db.select().from(jobSkills).where(eq(jobSkills.jobId, job.id));
    const skills = (skillRows as any[]).map((r) => r.skill);

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      workDateTbd: Boolean((job as any).workDateTbd ?? (job as any).workDateTimeTbd),
      workTimeTbd: Boolean((job as any).workTimeTbd ?? (job as any).workDateTimeTbd),
      workDate: (job as any).workDate ?? null,
      workStartTime: (job as any).workStartTime ?? null,
      workEndTime: (job as any).workEndTime ?? null,
      budgetMin: job.budgetMin,
      budgetMax: job.budgetMax,
      currency: job.currency,
      location: job.location,
      timeline: job.timeline,
      skills,
      clientName: job.clientName,
      contactPerson: (job as any).contactPerson ?? null,
      contactEmail: job.contactEmail ?? null,
      contactPhone: job.contactPhone ?? null,
      createdByUserId: job.createdByUserId,
      createdAt: job.createdAt,
      removedAt: job.removedAt ?? null,
    };
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      return getInMemory();
    }
    throw error;
  }
}

export async function createJob(input: Omit<JobRecord, "id" | "createdAt" | "removedAt">): Promise<JobRecord> {
  const db = await getDb();
  const id = randomUUID();
  const now = new Date();
  const next: JobRecord = { ...input, id, createdAt: now, removedAt: null };

  if (!db) {
    _memoryJobs.unshift(next);
    return next;
  }

  try {
    await db.insert(jobs).values({
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      workDateTbd: input.workDateTbd ? 1 : 0,
      workTimeTbd: input.workTimeTbd ? 1 : 0,
      workDate: input.workDate,
      workStartTime: input.workStartTime,
      workEndTime: input.workEndTime,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      currency: input.currency,
      location: input.location,
      timeline: input.timeline,
      clientName: input.clientName,
      contactPerson: input.contactPerson,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      removedAt: null,
    });

    if (input.skills.length > 0) {
      await db.insert(jobSkills).values(input.skills.map((skill) => ({ jobId: id, skill })));
    }

    return next;
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      _memoryJobs.unshift(next);
      return next;
    }
    throw error;
  }
}

export async function removeJob(id: string): Promise<boolean> {
  const db = await getDb();
  const removeInMemory = () => {
    const job = _memoryJobs.find((j) => j.id === id);
    if (!job) return false;
    job.removedAt = new Date();
    return true;
  };
  if (!db) return removeInMemory();

  try {
    await db.update(jobs).set({ removedAt: new Date() }).where(eq(jobs.id, id));
    return true;
  } catch (error) {
    if (isDbConnectionError(error)) {
      resetDb();
      return removeInMemory();
    }
    throw error;
  }
}
