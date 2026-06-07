import { TRPCError } from "@trpc/server";

import * as db from "../db";
import { COOKIE_NAME } from "../../shared/const.js";
import { getSessionCookieOptions } from "./cookies";
import { deleteSupabaseAuthUser, isSupabaseAdminConfigured } from "./supabaseAdmin";
import { protectedProcedure, publicProcedure, router } from "./trpc";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true as const };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role === "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "管理員帳戶請聯絡支援以刪除。",
      });
    }

    if (!isSupabaseAdminConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "伺服器未設定 SUPABASE_SERVICE_ROLE_KEY 或 SUPABASE_SECRET_KEY，無法刪除帳戶。",
      });
    }

    const userId = ctx.user.id;
    const authUserId = ctx.user.openId;

    await db.deleteUserAccount(userId);

    try {
      await deleteSupabaseAuthUser(authUserId);
    } catch (error) {
      console.error("[Auth] Supabase deleteUser failed after DB cleanup:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "帳戶資料已清除，但登入帳戶刪除失敗，請聯絡支援完成刪除。",
      });
    }

    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

    return { success: true as const };
  }),
});
