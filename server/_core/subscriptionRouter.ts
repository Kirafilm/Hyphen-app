import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import * as db from "../db";

const planSchema = z.union([z.literal("none"), z.literal("monthly"), z.literal("yearly")]);

function planToDurationMs(plan: db.SubscriptionPlan) {
  if (plan === "monthly") return 1000 * 60 * 60 * 24 * 30;
  if (plan === "yearly") return 1000 * 60 * 60 * 24 * 365;
  return 0;
}

export const subscriptionRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const status = await db.getSubscriptionStatus(ctx.user.id);
    return {
      plan: status.plan,
      expiresAt: status.expiresAt,
      active: status.expiresAt ? status.expiresAt.getTime() > Date.now() && status.plan !== "none" : false,
    };
  }),

  debugActivate: protectedProcedure
    .input(z.object({ plan: planSchema }))
    .mutation(async ({ ctx, input }) => {
      const ms = planToDurationMs(input.plan);
      const expiresAt = ms ? new Date(Date.now() + ms) : null;
      await db.setSubscriptionStatus(ctx.user.id, { plan: input.plan, expiresAt });
      return { success: true } as const;
    }),
});
