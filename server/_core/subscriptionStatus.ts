import type { Request } from "express";

import * as db from "../db";
import { fetchActiveSubscriptionFromRevenueCat } from "./revenuecat";

export type ResolvedSubscription = {
  plan: db.SubscriptionPlan;
  expiresAt: Date | null;
  active: boolean;
  stripeCustomerId: string | null;
};

function isActiveStatus(status: db.SubscriptionStatus) {
  return status.plan !== "none" && status.expiresAt !== null && status.expiresAt.getTime() > Date.now();
}

/** Subscription access is DB-only; RevenueCat/webhook/syncFromStore update the DB. */
export async function resolveSubscriptionStatus(user: {
  id: number;
  openId: string;
  email?: string | null;
}): Promise<ResolvedSubscription> {
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

export async function resolveViewerSubscriptionActive(
  viewer: { id: number; openId: string; email?: string | null } | null,
  req: Request,
): Promise<boolean> {
  if (viewer) {
    const sub = await resolveSubscriptionStatus(viewer);
    if (isResolvedSubscriptionActive(sub)) return true;
  }
  return resolveStoreSubscriptionActiveFromRequest(req);
}
