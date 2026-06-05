import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./trpc";
import * as db from "../db";
import { getStripeClient, isStripeConfigured, stripeCheckoutUrls, stripePriceIdForPlan } from "./stripe";

const planSchema = z.union([z.literal("none"), z.literal("monthly"), z.literal("yearly")]);
const paidPlanSchema = z.union([z.literal("monthly"), z.literal("yearly")]);

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

  createStripeCheckout: protectedProcedure
    .input(z.object({ plan: paidPlanSchema }))
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe 尚未設定。請在 API 伺服器加入 STRIPE_SECRET_KEY 與 Price ID。",
        });
      }

      const stripe = getStripeClient();
      const priceId = stripePriceIdForPlan(input.plan);
      if (!stripe || !priceId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe Price ID 尚未設定（STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY）。",
        });
      }

      const { success, cancel } = stripeCheckoutUrls();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: success,
        cancel_url: cancel,
        client_reference_id: String(ctx.user.id),
        metadata: {
          userId: String(ctx.user.id),
          plan: input.plan,
        },
        subscription_data: {
          metadata: {
            userId: String(ctx.user.id),
            plan: input.plan,
          },
        },
      });

      if (!session.url) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "無法建立 Stripe Checkout 連結" });
      }

      return { url: session.url } as const;
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
