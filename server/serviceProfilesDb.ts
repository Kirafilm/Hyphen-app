import { randomUUID } from "crypto";
import { and, asc, desc, eq, or } from "drizzle-orm";
import {
  messageThreads,
  serviceMessages,
  servicePortfolioImages,
  serviceProfiles,
  type MessageThread,
  type ServiceMessage,
  type ServicePortfolioImage,
  type ServiceProfile,
} from "../drizzle/schema";
import { getDb } from "./db";

const MAX_PORTFOLIO = 10;

const isDbConnectionError = (error: unknown) => {
  const anyErr = error as { code?: string; cause?: { code?: string; cause?: { code?: string } } };
  const code = anyErr?.code ?? anyErr?.cause?.code ?? anyErr?.cause?.cause?.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
  );
};

type MemoryProfile = ServiceProfile;
type MemoryImage = ServicePortfolioImage;
type MemoryThread = MessageThread;
type MemoryMessage = ServiceMessage;

const _memoryProfiles = new Map<number, MemoryProfile>();
const _memoryProfilesBySlug = new Map<string, number>();
const _memoryImages = new Map<string, MemoryImage>();
const _memoryImagesByUser = new Map<number, string[]>();
const _memoryThreads = new Map<string, MemoryThread>();
const _memoryMessages = new Map<string, MemoryMessage[]>();

function parseJsonTags(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
  } catch {
    /* comma-separated fallback */
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toPublicProfile(row: ServiceProfile, images: ServicePortfolioImage[]) {
  return {
    userId: row.userId,
    slug: row.slug,
    headline: row.headline,
    avatarStorageKey: row.avatarStorageKey ?? null,
    intro: row.intro,
    serviceInfo: row.serviceInfo,
    skills: parseJsonTags(row.skills),
    categories: parseJsonTags(row.categories),
    locations: parseJsonTags(row.locations),
    isPublished: row.isPublished === 1,
    updatedAt: row.updatedAt,
    portfolioImages: images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ id: img.id, storageKey: img.storageKey, sortOrder: img.sortOrder })),
  };
}

export type ServiceProfileInput = {
  slug: string;
  headline: string;
  intro: string;
  serviceInfo: string;
  skills: string[];
  categories: string[];
  locations: string[];
  isPublished: boolean;
};

export async function getServiceProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    const row = _memoryProfiles.get(userId);
    if (!row) return null;
    const imageIds = _memoryImagesByUser.get(userId) ?? [];
    const images = imageIds.map((id) => _memoryImages.get(id)!).filter(Boolean);
    return toPublicProfile(row, images);
  }

  try {
    const rows = await db.select().from(serviceProfiles).where(eq(serviceProfiles.userId, userId)).limit(1);
    if (rows.length === 0) return null;
    const images = await db
      .select()
      .from(servicePortfolioImages)
      .where(eq(servicePortfolioImages.userId, userId))
      .orderBy(asc(servicePortfolioImages.sortOrder));
    return toPublicProfile(rows[0]!, images);
  } catch (error) {
    if (isDbConnectionError(error)) {
      return getServiceProfileByUserId(userId);
    }
    throw error;
  }
}

export async function listPublishedServiceProfiles() {
  const db = await getDb();
  if (!db) {
    return [..._memoryProfiles.values()]
      .filter((row) => row.isPublished === 1)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((row) => toPublicProfile(row, []));
  }

  try {
    const rows = await db
      .select()
      .from(serviceProfiles)
      .where(eq(serviceProfiles.isPublished, 1))
      .orderBy(desc(serviceProfiles.updatedAt));
    return rows.map((row) => toPublicProfile(row, []));
  } catch (error) {
    if (isDbConnectionError(error)) {
      return listPublishedServiceProfiles();
    }
    throw error;
  }
}

export async function getPublishedServiceProfileBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    const userId = _memoryProfilesBySlug.get(slug);
    if (userId == null) return null;
    const row = _memoryProfiles.get(userId);
    if (!row || row.isPublished !== 1) return null;
    const imageIds = _memoryImagesByUser.get(userId) ?? [];
    const images = imageIds.map((id) => _memoryImages.get(id)!).filter(Boolean);
    return toPublicProfile(row, images);
  }

  try {
    const rows = await db
      .select()
      .from(serviceProfiles)
      .where(and(eq(serviceProfiles.slug, slug), eq(serviceProfiles.isPublished, 1)))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0]!;
    const images = await db
      .select()
      .from(servicePortfolioImages)
      .where(eq(servicePortfolioImages.userId, row.userId))
      .orderBy(asc(servicePortfolioImages.sortOrder));
    return toPublicProfile(row, images);
  } catch (error) {
    if (isDbConnectionError(error)) {
      return getPublishedServiceProfileBySlug(slug);
    }
    throw error;
  }
}

export async function upsertServiceProfile(userId: number, input: ServiceProfileInput) {
  const db = await getDb();
  const payload = {
    userId,
    slug: input.slug,
    headline: input.headline.slice(0, 255),
    intro: input.intro,
    serviceInfo: input.serviceInfo,
    skills: JSON.stringify(input.skills),
    categories: JSON.stringify(input.categories),
    locations: JSON.stringify(input.locations),
    isPublished: input.isPublished ? 1 : 0,
  };

  if (!db) {
    const existing = _memoryProfiles.get(userId);
    const slugTaken = [..._memoryProfilesBySlug.entries()].some(
      ([s, uid]) => s === input.slug && uid !== userId,
    );
    if (slugTaken) throw new Error("此網址已被使用，請選擇其他 slug");
    if (existing && existing.slug !== input.slug) _memoryProfilesBySlug.delete(existing.slug);
    const row: MemoryProfile = {
      ...payload,
      avatarStorageKey: existing?.avatarStorageKey ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    _memoryProfiles.set(userId, row);
    _memoryProfilesBySlug.set(input.slug, userId);
    const imageIds = _memoryImagesByUser.get(userId) ?? [];
    const images = imageIds.map((id) => _memoryImages.get(id)!).filter(Boolean);
    return toPublicProfile(row, images);
  }

  try {
    const slugRows = await db
      .select({ userId: serviceProfiles.userId })
      .from(serviceProfiles)
      .where(eq(serviceProfiles.slug, input.slug))
      .limit(1);
    if (slugRows.length > 0 && slugRows[0]!.userId !== userId) {
      throw new Error("此網址已被使用，請選擇其他 slug");
    }

    await db
      .insert(serviceProfiles)
      .values(payload)
      .onDuplicateKeyUpdate({
        set: {
          slug: payload.slug,
          headline: payload.headline,
          intro: payload.intro,
          serviceInfo: payload.serviceInfo,
          skills: payload.skills,
          categories: payload.categories,
          locations: payload.locations,
          isPublished: payload.isPublished,
        },
      });

    return getServiceProfileByUserId(userId);
  } catch (error) {
    if (isDbConnectionError(error)) {
      return upsertServiceProfile(userId, input);
    }
    throw error;
  }
}

export async function setServiceAvatar(userId: number, storageKey: string | null) {
  const db = await getDb();
  if (!db) {
    const existing = _memoryProfiles.get(userId);
    if (!existing) throw new Error("請先儲存服務頁再上載大頭照");
    const row: MemoryProfile = { ...existing, avatarStorageKey: storageKey, updatedAt: new Date() };
    _memoryProfiles.set(userId, row);
    return toPublicProfile(row, (_memoryImagesByUser.get(userId) ?? []).map((id) => _memoryImages.get(id)!).filter(Boolean));
  }

  try {
    const rows = await db.select().from(serviceProfiles).where(eq(serviceProfiles.userId, userId)).limit(1);
    if (rows.length === 0) throw new Error("請先儲存服務頁再上載大頭照");
    await db
      .update(serviceProfiles)
      .set({ avatarStorageKey: storageKey })
      .where(eq(serviceProfiles.userId, userId));
    return getServiceProfileByUserId(userId);
  } catch (error) {
    if (isDbConnectionError(error)) {
      return setServiceAvatar(userId, storageKey);
    }
    throw error;
  }
}

export async function addPortfolioImage(userId: number, storageKey: string) {
  const db = await getDb();
  const id = randomUUID();

  if (!db) {
    const ids = _memoryImagesByUser.get(userId) ?? [];
    if (ids.length >= MAX_PORTFOLIO) throw new Error(`最多只能上載 ${MAX_PORTFOLIO} 張作品圖片`);
    const image: MemoryImage = {
      id,
      userId,
      storageKey,
      sortOrder: ids.length,
      createdAt: new Date(),
    };
    _memoryImages.set(id, image);
    _memoryImagesByUser.set(userId, [...ids, id]);
    return image;
  }

  try {
    const existing = await db
      .select({ id: servicePortfolioImages.id })
      .from(servicePortfolioImages)
      .where(eq(servicePortfolioImages.userId, userId));
    if (existing.length >= MAX_PORTFOLIO) {
      throw new Error(`最多只能上載 ${MAX_PORTFOLIO} 張作品圖片`);
    }
    const image = { id, userId, storageKey, sortOrder: existing.length };
    await db.insert(servicePortfolioImages).values(image);
    return image;
  } catch (error) {
    if (isDbConnectionError(error)) {
      return addPortfolioImage(userId, storageKey);
    }
    throw error;
  }
}

export async function removePortfolioImage(userId: number, imageId: string) {
  const db = await getDb();
  if (!db) {
    const image = _memoryImages.get(imageId);
    if (!image || image.userId !== userId) return false;
    _memoryImages.delete(imageId);
    const ids = (_memoryImagesByUser.get(userId) ?? []).filter((x) => x !== imageId);
    _memoryImagesByUser.set(userId, ids);
    return true;
  }

  try {
    await db
      .delete(servicePortfolioImages)
      .where(and(eq(servicePortfolioImages.id, imageId), eq(servicePortfolioImages.userId, userId)));
    return true;
  } catch (error) {
    if (isDbConnectionError(error)) {
      return removePortfolioImage(userId, imageId);
    }
    throw error;
  }
}

export async function getOrCreateMessageThread(profileUserId: number, visitorUserId: number) {
  if (profileUserId === visitorUserId) throw new Error("無法向自己發送訊息");

  const db = await getDb();
  const id = randomUUID();

  if (!db) {
    const existing = [..._memoryThreads.values()].find(
      (t) => t.profileUserId === profileUserId && t.visitorUserId === visitorUserId,
    );
    if (existing) return existing;
    const thread: MemoryThread = {
      id,
      profileUserId,
      visitorUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _memoryThreads.set(id, thread);
    _memoryMessages.set(id, []);
    return thread;
  }

  try {
    const rows = await db
      .select()
      .from(messageThreads)
      .where(
        and(eq(messageThreads.profileUserId, profileUserId), eq(messageThreads.visitorUserId, visitorUserId)),
      )
      .limit(1);
    if (rows.length > 0) return rows[0]!;

    const thread = { id, profileUserId, visitorUserId };
    await db.insert(messageThreads).values(thread);
    return { ...thread, createdAt: new Date(), updatedAt: new Date() };
  } catch (error) {
    if (isDbConnectionError(error)) {
      return getOrCreateMessageThread(profileUserId, visitorUserId);
    }
    throw error;
  }
}

export async function listMessageThreadsForUser(userId: number) {
  const db = await getDb();
  if (!db) {
    return [..._memoryThreads.values()]
      .filter((t) => t.profileUserId === userId || t.visitorUserId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  try {
    return db
      .select()
      .from(messageThreads)
      .where(or(eq(messageThreads.profileUserId, userId), eq(messageThreads.visitorUserId, userId)))
      .orderBy(desc(messageThreads.updatedAt));
  } catch (error) {
    if (isDbConnectionError(error)) {
      return listMessageThreadsForUser(userId);
    }
    throw error;
  }
}

export async function getMessageThreadForUser(threadId: string, userId: number) {
  const db = await getDb();
  if (!db) {
    const thread = _memoryThreads.get(threadId);
    if (!thread) return null;
    if (thread.profileUserId !== userId && thread.visitorUserId !== userId) return null;
    return thread;
  }

  try {
    const rows = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId)).limit(1);
    const thread = rows[0];
    if (!thread) return null;
    if (thread.profileUserId !== userId && thread.visitorUserId !== userId) return null;
    return thread;
  } catch (error) {
    if (isDbConnectionError(error)) {
      return getMessageThreadForUser(threadId, userId);
    }
    throw error;
  }
}

export async function listMessagesInThread(threadId: string) {
  const db = await getDb();
  if (!db) {
    return (_memoryMessages.get(threadId) ?? []).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  try {
    return db
      .select()
      .from(serviceMessages)
      .where(eq(serviceMessages.threadId, threadId))
      .orderBy(asc(serviceMessages.createdAt));
  } catch (error) {
    if (isDbConnectionError(error)) {
      return listMessagesInThread(threadId);
    }
    throw error;
  }
}

export async function sendServiceMessage(threadId: string, senderUserId: number, body: string) {
  const db = await getDb();
  const id = randomUUID();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("訊息不可為空");

  if (!db) {
    const thread = _memoryThreads.get(threadId);
    if (!thread) throw new Error("對話不存在");
    if (thread.profileUserId !== senderUserId && thread.visitorUserId !== senderUserId) {
      throw new Error("無權限發送訊息");
    }
    const msg: MemoryMessage = { id, threadId, senderUserId, body: trimmed, createdAt: new Date() };
    const list = _memoryMessages.get(threadId) ?? [];
    list.push(msg);
    _memoryMessages.set(threadId, list);
    thread.updatedAt = new Date();
    return msg;
  }

  try {
    const threadRows = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId)).limit(1);
    const thread = threadRows[0];
    if (!thread) throw new Error("對話不存在");
    if (thread.profileUserId !== senderUserId && thread.visitorUserId !== senderUserId) {
      throw new Error("無權限發送訊息");
    }

    const msg = { id, threadId, senderUserId, body: trimmed };
    await db.insert(serviceMessages).values(msg);
    await db.update(messageThreads).set({ updatedAt: new Date() }).where(eq(messageThreads.id, threadId));
    return { ...msg, createdAt: new Date() };
  } catch (error) {
    if (isDbConnectionError(error)) {
      return sendServiceMessage(threadId, senderUserId, body);
    }
    throw error;
  }
}

export async function deleteMessageThreadForUser(threadId: string, userId: number) {
  const db = await getDb();
  if (!db) {
    const thread = _memoryThreads.get(threadId);
    if (!thread) return false;
    if (thread.profileUserId !== userId && thread.visitorUserId !== userId) return false;
    _memoryThreads.delete(threadId);
    _memoryMessages.delete(threadId);
    return true;
  }

  try {
    const rows = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId)).limit(1);
    const thread = rows[0];
    if (!thread) return false;
    if (thread.profileUserId !== userId && thread.visitorUserId !== userId) return false;
    await db.delete(messageThreads).where(eq(messageThreads.id, threadId));
    return true;
  } catch (error) {
    if (isDbConnectionError(error)) {
      return deleteMessageThreadForUser(threadId, userId);
    }
    throw error;
  }
}

export async function getProfileUserIdBySlug(slug: string): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    return _memoryProfilesBySlug.get(slug) ?? null;
  }
  try {
    const rows = await db
      .select({ userId: serviceProfiles.userId })
      .from(serviceProfiles)
      .where(eq(serviceProfiles.slug, slug))
      .limit(1);
    return rows[0]?.userId ?? null;
  } catch (error) {
    if (isDbConnectionError(error)) {
      return getProfileUserIdBySlug(slug);
    }
    throw error;
  }
}

export async function listServiceProfilesForModeration() {
  const db = await getDb();
  if (!db) {
    return [..._memoryProfiles.values()]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((row) => toPublicProfile(row, []));
  }

  try {
    const rows = await db.select().from(serviceProfiles).orderBy(desc(serviceProfiles.updatedAt));
    return rows.map((row) => toPublicProfile(row, []));
  } catch (error) {
    if (isDbConnectionError(error)) {
      return listServiceProfilesForModeration();
    }
    throw error;
  }
}

/** Permanently delete a service profile and its portfolio images (admin moderation). */
export async function deleteServiceProfileByUserId(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    const existing = _memoryProfiles.get(userId);
    if (!existing) return false;
    _memoryProfilesBySlug.delete(existing.slug);
    _memoryProfiles.delete(userId);
    const imageIds = _memoryImagesByUser.get(userId) ?? [];
    for (const id of imageIds) _memoryImages.delete(id);
    _memoryImagesByUser.delete(userId);
    return true;
  }

  try {
    const rows = await db.select().from(serviceProfiles).where(eq(serviceProfiles.userId, userId)).limit(1);
    if (rows.length === 0) return false;
    await db.delete(servicePortfolioImages).where(eq(servicePortfolioImages.userId, userId));
    await db.delete(serviceProfiles).where(eq(serviceProfiles.userId, userId));
    return true;
  } catch (error) {
    if (isDbConnectionError(error)) {
      return deleteServiceProfileByUserId(userId);
    }
    throw error;
  }
}
