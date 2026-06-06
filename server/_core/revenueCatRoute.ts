import type { Express, Request, Response } from "express";
import express from "express";
import * as db from "../db";
import {
  isProEntitlementKey,
  isRevenueCatWebhookConfigured,
  planFromRevenueCatProductId,
  revenueCatEventGrantsAccess,
  revenueCatEventRevokesAccess,
  verifyRevenueCatWebhookAuthorization,
  type RevenueCatWebhookBody,
} from "./revenuecat";

function hasProEntitlement(entitlementIds: string[] | null | undefined) {
  if (!entitlementIds?.length) return true;
  return entitlementIds.some((id) => isProEntitlementKey(id));
}

async function syncFromRevenueCatEvent(event: NonNullable<RevenueCatWebhookBody["event"]>) {
  const openId = event.app_user_id?.trim();
  if (!openId || openId.startsWith("$RCAnonymousID:")) return;

  const user = await db.getUserByOpenId(openId);
  if (!user) {
    console.warn("[revenuecat] webhook user not found for app_user_id:", openId);
    return;
  }

  const type = event.type ?? "";

  if (revenueCatEventRevokesAccess(type)) {
    await db.setSubscriptionStatus(user.id, { plan: "none", expiresAt: null });
    return;
  }

  if (!revenueCatEventGrantsAccess(type) && type !== "CANCELLATION") {
    return;
  }

  if (!hasProEntitlement(event.entitlement_ids)) return;

  const productId = event.product_id?.trim() ?? "";
  const plan = planFromRevenueCatProductId(productId);
  if (!plan) {
    console.warn("[revenuecat] unknown product_id:", productId);
    return;
  }

  const expiresMs = event.expiration_at_ms;
  const expiresAt =
    typeof expiresMs === "number" && Number.isFinite(expiresMs) ? new Date(expiresMs) : null;

  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    if (type === "CANCELLATION") return;
    await db.setSubscriptionStatus(user.id, { plan: "none", expiresAt: null });
    return;
  }

  await db.setSubscriptionStatus(user.id, { plan, expiresAt });
}

export function registerRevenueCatRoutes(app: Express) {
  app.post(
    "/api/revenuecat/webhook",
    express.json({ type: "*/*" }),
    async (req: Request, res: Response) => {
      if (!isRevenueCatWebhookConfigured()) {
        res.status(503).send("RevenueCat webhook not configured");
        return;
      }

      const authHeader = req.headers.authorization;
      if (!verifyRevenueCatWebhookAuthorization(typeof authHeader === "string" ? authHeader : undefined)) {
        res.status(401).send("Unauthorized");
        return;
      }

      const body = req.body as RevenueCatWebhookBody;
      const event = body?.event;
      if (!event?.type) {
        res.status(400).send("Missing event");
        return;
      }

      if (event.type === "TEST") {
        res.json({ received: true });
        return;
      }

      try {
        await syncFromRevenueCatEvent(event);
        res.json({ received: true });
      } catch (err) {
        console.error("[revenuecat] webhook handler failed:", err);
        res.status(500).send("Webhook handler failed");
      }
    },
  );
}
