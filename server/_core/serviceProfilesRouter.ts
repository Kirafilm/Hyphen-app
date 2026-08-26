import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { assertNoContactInfo, parseTagList } from "../../lib/contact-sanitize";
import * as db from "../db";
import * as profilesDb from "../serviceProfilesDb";
import { storagePut } from "../storage";
import { notifyNewServiceMessage } from "./pushNotifications";
import { resolveSubscriptionStatus } from "./subscriptionStatus";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./trpc";

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "網址只能包含小寫英文字母、數字及連字號");

const profileInputSchema = z.object({
  slug: slugSchema,
  headline: z.string().trim().max(255),
  intro: z.string().trim().min(1).max(5000),
  serviceInfo: z.string().trim().min(1).max(5000),
  skills: z.array(z.string().trim().min(1).max(64)).max(20),
  categories: z.array(z.string().trim().min(1).max(64)).max(20),
  locations: z.array(z.string().trim().min(1).max(64)).max(20),
  isPublished: z.boolean(),
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_PORTFOLIO_IMAGE_BYTES = 2 * 1024 * 1024;

async function requireServicePageAccess(user: {
  id: number;
  openId: string;
  email?: string | null;
  role: string;
}) {
  // Admin (萬用／管理帳號) 可略過訂閱，方便測試服務頁
  if (user.role === "admin") return;
  const status = await resolveSubscriptionStatus({
    id: user.id,
    openId: user.openId,
    email: user.email,
  });
  if (!status.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "只有已訂閱用戶可以管理個人服務頁面",
    });
  }
}

function validateProfileText(input: z.infer<typeof profileInputSchema>) {
  assertNoContactInfo(input.headline, "個人／公司名稱");
  assertNoContactInfo(input.intro, "個人簡介");
  assertNoContactInfo(input.serviceInfo, "服務資訊");
  for (const tag of [...input.skills, ...input.categories, ...input.locations]) {
    assertNoContactInfo(tag, "標籤");
  }
}

export const serviceProfilesRouter = router({
  listPublished: publicProcedure.query(async () => {
    return profilesDb.listPublishedServiceProfiles();
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1) })).query(async ({ input }) => {
    const profile = await profilesDb.getPublishedServiceProfileBySlug(input.slug);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "找不到此服務頁面" });
    }
    return profile;
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    await requireServicePageAccess(ctx.user);
    return profilesDb.getServiceProfileByUserId(ctx.user.id);
  }),

  upsert: protectedProcedure.input(profileInputSchema).mutation(async ({ ctx, input }) => {
    await requireServicePageAccess(ctx.user);
    try {
      validateProfileText(input);
    } catch (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "內容包含不允許的聯絡方式",
      });
    }
    try {
      return await profilesDb.upsertServiceProfile(ctx.user.id, input);
    } catch (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "無法儲存服務頁面",
      });
    }
  }),

  uploadAvatar: protectedProcedure
    .input(
      z.object({
        dataBase64: z.string().min(1),
        mimeType: z.string().trim(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireServicePageAccess(ctx.user);
      if (!ALLOWED_MIME.has(input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "只支援 JPG、PNG 或 WebP 圖片" });
      }

      const buffer = Buffer.from(input.dataBase64, "base64");
      if (buffer.byteLength > MAX_AVATAR_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "圖片大小不可超過 5MB" });
      }

      const ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
      const { key } = await storagePut(`avatars/${ctx.user.id}/${Date.now()}.${ext}`, buffer, input.mimeType);
      try {
        const profile = await profilesDb.setServiceAvatar(ctx.user.id, key);
        return { avatarStorageKey: profile?.avatarStorageKey ?? key };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "無法上載大頭照",
        });
      }
    }),

  removeAvatar: protectedProcedure.mutation(async ({ ctx }) => {
    await requireServicePageAccess(ctx.user);
    try {
      await profilesDb.setServiceAvatar(ctx.user.id, null);
      return { success: true } as const;
    } catch (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "無法移除大頭照",
      });
    }
  }),

  uploadPortfolioImage: protectedProcedure
    .input(
      z.object({
        dataBase64: z.string().min(1),
        mimeType: z.string().trim(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireServicePageAccess(ctx.user);
      if (!ALLOWED_MIME.has(input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "只支援 JPG、PNG 或 WebP 圖片" });
      }

      const buffer = Buffer.from(input.dataBase64, "base64");
      if (buffer.byteLength > MAX_PORTFOLIO_IMAGE_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "每張作品圖片不可超過 2MB" });
      }

      const ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
      const { key } = await storagePut(`portfolio/${ctx.user.id}/${Date.now()}.${ext}`, buffer, input.mimeType);
      try {
        const image = await profilesDb.addPortfolioImage(ctx.user.id, key);
        return { id: image.id, storageKey: image.storageKey };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "無法上載圖片",
        });
      }
    }),

  removePortfolioImage: protectedProcedure
    .input(z.object({ imageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await requireServicePageAccess(ctx.user);
      await profilesDb.removePortfolioImage(ctx.user.id, input.imageId);
      return { success: true } as const;
    }),

  listForModeration: adminProcedure.query(async () => {
    return profilesDb.listServiceProfilesForModeration();
  }),

  adminDelete: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const ok = await profilesDb.deleteServiceProfileByUserId(input.userId);
      if (!ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "找不到此專業頁" });
      }
      return { success: true } as const;
    }),
});

export const serviceMessagesRouter = router({
  startThread: protectedProcedure
    .input(z.object({ profileSlug: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const profile = await profilesDb.getPublishedServiceProfileBySlug(input.profileSlug);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "找不到此服務頁面" });
      }
      try {
        const thread = await profilesDb.getOrCreateMessageThread(profile.userId, ctx.user.id);
        return { threadId: thread.id };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "無法開始對話",
        });
      }
    }),

  listThreads: protectedProcedure.query(async ({ ctx }) => {
    const threads = await profilesDb.listMessageThreadsForUser(ctx.user.id);
    const userIds = new Set<number>();
    for (const t of threads) {
      userIds.add(t.profileUserId);
      userIds.add(t.visitorUserId);
    }
    const users = await db.getUsersByIds([...userIds]);
    const nameById = new Map(users.map((u) => [u.id, u.name?.trim() || "使用者"]));

    const profileUserIds = [...new Set(threads.map((t) => t.profileUserId))];
    const profiles = await Promise.all(profileUserIds.map((id) => profilesDb.getServiceProfileByUserId(id)));
    const slugByUserId = new Map(
      profiles.filter(Boolean).map((p) => [p!.userId, p!.slug] as const),
    );
    const headlineByUserId = new Map(
      profiles.filter(Boolean).map((p) => [p!.userId, p!.headline?.trim() || ""] as const),
    );

    return threads.map((thread) => {
      const isOwner = thread.profileUserId === ctx.user.id;
      const otherUserId = isOwner ? thread.visitorUserId : thread.profileUserId;
      return {
        id: thread.id,
        updatedAt: thread.updatedAt,
        role: isOwner ? ("provider" as const) : ("visitor" as const),
        otherUserId,
        otherDisplayName: isOwner
          ? nameById.get(otherUserId) ?? "使用者"
          : headlineByUserId.get(otherUserId) || nameById.get(otherUserId) || "專業人士",
        profileSlug: slugByUserId.get(thread.profileUserId) ?? null,
      };
    });
  }),

  threadDetail: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const thread = await profilesDb.getMessageThreadForUser(input.threadId, ctx.user.id);
      if (!thread) {
        throw new TRPCError({ code: "NOT_FOUND", message: "找不到對話" });
      }
      const messages = await profilesDb.listMessagesInThread(input.threadId);
      const userIds = [thread.profileUserId, thread.visitorUserId];
      const users = await db.getUsersByIds(userIds);
      const nameById = new Map(users.map((u) => [u.id, u.name?.trim() || "使用者"]));
      const profile = await profilesDb.getServiceProfileByUserId(thread.profileUserId);

      return {
        id: thread.id,
        profileUserId: thread.profileUserId,
        visitorUserId: thread.visitorUserId,
        profileSlug: profile?.slug ?? null,
        profileDisplayName: profile?.headline?.trim() || nameById.get(thread.profileUserId) || "專業人士",
        visitorDisplayName: nameById.get(thread.visitorUserId) ?? "訪客",
        messages: messages.map((m) => ({
          id: m.id,
          senderUserId: m.senderUserId,
          body: m.body,
          createdAt: m.createdAt,
          isMine: m.senderUserId === ctx.user.id,
        })),
      };
    }),

  send: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        body: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const msg = await profilesDb.sendServiceMessage(input.threadId, ctx.user.id, input.body);
        const thread = await profilesDb.getMessageThreadForUser(input.threadId, ctx.user.id);
        if (thread) {
          const recipientUserId =
            thread.profileUserId === ctx.user.id ? thread.visitorUserId : thread.profileUserId;
          void notifyNewServiceMessage({
            threadId: thread.id,
            recipientUserId,
            preview: input.body.trim(),
          }).catch((error) => {
            console.error("[Push] message notify failed:", error);
          });
        }
        return { id: msg.id, createdAt: msg.createdAt };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "無法發送訊息",
        });
      }
    }),

  deleteThread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await profilesDb.deleteMessageThreadForUser(input.threadId, ctx.user.id);
      if (!ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "找不到對話或無權限移除" });
      }
      return { success: true } as const;
    }),
});

export { parseTagList };
