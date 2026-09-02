import type { Request } from "express";

import * as db from "../db";
import {
  fetchActiveSubscriptionFromRevenueCat,
  fetchActiveSubscriptionFromRevenueCatForUser,
  isRevenueCatApiConfigured,
} from "./revenuecat";

export type ResolvedSubscription = {
  plan: db.SubscriptionPlan;
  expiresAt: Date | null;
  active: boolean;
  stripeCustomerId: string | null;
};

function isActiveStatus(status: db.SubscriptionStatus) {
  return status.plan !== "none" && status.expiresAt !== null && status.expiresAt.getTime() > Date.now();
}

/** Subscription access is DB-only; RevenueCat/webhook/syncFromStore update the DB.
 *  Admin（萬用管理帳號）視為永久有效訂閱，方便測試與內容管理。 */
export async function resolveSubscriptionStatus(user: {
  id: number;
  openId: string;
  email?: string | null;
  role?: string;
}): Promise<ResolvedSubscription> {
  if (user.role === "admin") {
    return {
      plan: "yearly",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
      active: true,
      stripeCustomerId: null,
    };
  }

  const status = await db.getSubscriptionStatus(user.id);

  return {
    plan: status.plan,
    expiresAt: status.expiresAt,
    active: isActiveStatus(status),
    stripeCustomerId: status.stripeCustomerId ?? null,
  };
}

export function isResolvedSubscriptionActive(status: ResolvedSubscription) {
  return status.active;
}

function revenueCatAppUserIdFromRequest(req: Request): string {
  const raw = req.headers["x-revenuecat-app-user-id"];
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) return raw[0]?.trim() ?? "";
  return "";
}

/** Anonymous App Store / Play subscribers pass RevenueCat app user id on native clients. */
export async function resolveStoreSubscriptionActiveFromRequest(req: Request): Promise<boolean> {
  const appUserId = revenueCatAppUserIdFromRequest(req);
  if (!appUserId) return false;

  const sub = await fetchActiveSubscriptionFromRevenueCat(appUserId);
  return sub !== null && sub.expiresAt.getTime() > Date.now();
}

async function mirrorRevenueCatSubscriptionToDb(
  userId: number,
  subscription: { plan: Exclude<db.SubscriptionPlan, "none">; expiresAt: Date },
) {
  try {
    await db.setSubscriptionStatus(userId, {
      plan: subscription.plan,
      expiresAt: subscription.expiresAt,
    });
  } catch (err) {
    console.warn("[subscription] failed to mirror RevenueCat status to DB:", err);
  }
}

/** Logged-in viewers: DB first, then RevenueCat by openId, then request header (store account). */
export async function resolveViewerSubscriptionActive(
  viewer: { id: number; openId: string; email?: string | null } | null,
  req: Request,
): Promise<boolean> {
  if (viewer) {
    const sub = await resolveSubscriptionStatus(viewer);
    if (isResolvedSubscriptionActive(sub)) return true;

    if (isRevenueCatApiConfigured()) {
      const rcSub = await fetchActiveSubscriptionFromRevenueCatForUser({
        openId: viewer.openId,
        email: viewer.email,
      });
      if (rcSub && rcSub.expiresAt.getTime() > Date.now()) {
        void mirrorRevenueCatSubscriptionToDb(viewer.id, rcSub);
        return true;
      }
    }
  }
  return resolveStoreSubscriptionActiveFromRequest(req);
}
