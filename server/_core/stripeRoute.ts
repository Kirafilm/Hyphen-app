import type { Express, Request, Response } from "express";
import express from "express";
import type Stripe from "stripe";
import * as db from "../db";
import { getStripeClient, isStripeConfigured, planFromStripePriceId } from "./stripe";

async function applySubscriptionFromStripe(
  userId: number,
  plan: db.SubscriptionPlan,
  expiresAt: Date | null,
) {
  if (plan === "none") {
    await db.setSubscriptionStatus(userId, { plan: "none", expiresAt: null });
    return;
  }
  await db.setSubscriptionStatus(userId, { plan, expiresAt });
}

function parseUserId(raw: string | number | undefined | null): number | null {
  if (raw == null) return null;
  const id = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function subscriptionExpiresAt(
  subscription: Stripe.Subscription,
  plan: Exclude<db.SubscriptionPlan, "none">,
): Date {
  const item = subscription.items.data[0];
  const periodEnd =
    item?.current_period_end ??
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  if (typeof periodEnd === "number" && Number.isFinite(periodEnd)) {
    return new Date(periodEnd * 1000);
  }
  const days = plan === "yearly" ? 365 : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function syncSubscriptionRecord(subscription: Stripe.Subscription) {
  const userId = parseUserId(subscription.metadata?.userId);
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const plan = planFromStripePriceId(priceId);
  if (!plan) return;

  if (subscription.status === "active" || subscription.status === "trialing") {
    await applySubscriptionFromStripe(userId, plan, subscriptionExpiresAt(subscription, plan));
    return;
  }

  await applySubscriptionFromStripe(userId, "none", null);
}

export function registerStripeRoutes(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      if (!isStripeConfigured()) {
        res.status(503).send("Stripe not configured");
        return;
      }

      const stripe = getStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
      if (!stripe || !webhookSecret) {
        res.status(503).send("Stripe webhook not configured");
        return;
      }

      const signature = req.headers["stripe-signature"];
      if (!signature || Array.isArray(signature)) {
        res.status(400).send("Missing stripe-signature");
        return;
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[stripe] webhook signature failed:", message);
        res.status(400).send(`Webhook Error: ${message}`);
        return;
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseUserId(session.metadata?.userId ?? session.client_reference_id);
            if (!userId || session.mode !== "subscription" || !session.subscription) break;

            const customerId =
              typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
            if (customerId) {
              await db.setStripeCustomerId(userId, customerId);
              try {
                await stripe.customers.update(customerId, {
                  metadata: { userId: String(userId) },
                });
              } catch (err) {
                console.warn("[stripe] failed to tag customer metadata:", err);
              }
            }

            const subscriptionId =
              typeof session.subscription === "string" ? session.subscription : session.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await syncSubscriptionRecord(subscription);
            break;
          }
          case "customer.subscription.updated":
          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await syncSubscriptionRecord(subscription);
            break;
          }
          default:
            break;
        }
        res.json({ received: true });
      } catch (err) {
        console.error("[stripe] webhook handler failed:", err);
        res.status(500).send("Webhook handler failed");
      }
    },
  );
}
