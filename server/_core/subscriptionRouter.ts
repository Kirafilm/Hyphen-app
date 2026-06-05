import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./trpc";
import * as db from "../db";
import { getStripeClient, isStripeConfigured, stripeCheckoutUrls, stripePortalReturnUrl, stripePriceIdForPlan } from "./stripe";

const planSchema = z.union([z.literal("none"), z.literal("monthly"), z.literal("yearly")]);
const paidPlanSchema = z.union([z.literal("monthly"), z.literal("yearly")]);

function planToDurationMs(plan: db.SubscriptionPlan) {
  if (plan === "monthly") return 1000 * 60 * 60 * 24 * 30;
  if (plan === "yearly") return 1000 * 60 * 60 * 24 * 365;
  return 0;
}

function isStripeMissingCustomer(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code?: unknown }).code) : "";
  const message = err instanceof Error ? err.message : String(err);
  return code === "resource_missing" || message.includes("No such customer");
}

async function resolveStripeCustomerId(
  stripe: NonNullable<ReturnType<typeof getStripeClient>>,
  userId: number,
  email?: string | null,
) {
  const existing = await db.getStripeCustomerId(userId);
  if (existing) {
    try {
      const customer = await stripe.customers.retrieve(existing);
      if ("deleted" in customer && customer.deleted) {
        await db.clearStripeCustomerId(userId);
      } else {
        return existing;
      }
    } catch (err) {
      if (isStripeMissingCustomer(err)) {
        await db.clearStripeCustomerId(userId);
      } else {
        throw err;
      }
    }
  }

  const result = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
  });
  let customerId = result.data[0]?.id ?? null;

  if (!customerId && email) {
    const byEmail = await stripe.customers.list({ email, limit: 5 });
    const match =
      byEmail.data.find((customer) => customer.metadata?.userId === String(userId)) ?? byEmail.data[0] ?? null;
    customerId = match?.id ?? null;
  }

  if (customerId) {
    await db.setStripeCustomerId(userId, customerId);
    try {
      await stripe.customers.update(customerId, { metadata: { userId: String(userId) } });
    } catch {
      // non-fatal
    }
  }
  return customerId;
}

export const subscriptionRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const status = await db.getSubscriptionStatus(ctx.user.id);
    return {
      plan: status.plan,
      expiresAt: status.expiresAt,
      active: status.expiresAt ? status.expiresAt.getTime() > Date.now() && status.plan !== "none" : false,
      stripeCustomerId: status.stripeCustomerId ?? null,
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
      const customerId = await resolveStripeCustomerId(stripe, ctx.user.id, ctx.user.email);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: success,
        cancel_url: cancel,
        client_reference_id: String(ctx.user.id),
        ...(customerId
          ? { customer: customerId }
          : ctx.user.email
            ? { customer_email: ctx.user.email }
            : {}),
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

  createStripePortal: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isStripeConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Stripe 尚未設定。",
      });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe 尚未設定。" });
    }

    const customerId = await resolveStripeCustomerId(stripe, ctx.user.id, ctx.user.email);
    if (!customerId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "找不到網頁訂閱記錄。若你係 App 內購買，請到 App Store / Google Play 管理訂閱。",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: stripePortalReturnUrl(),
    });

    if (!session.url) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "無法開啟訂閱管理頁面" });
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
