import * as db from "../db";
import { fetchActiveSubscriptionFromRevenueCat, isRevenueCatApiConfigured } from "./revenuecat";

export type ResolvedSubscription = {
  plan: db.SubscriptionPlan;
  expiresAt: Date | null;
  active: boolean;
  stripeCustomerId: string | null;
};

function isActiveStatus(status: db.SubscriptionStatus) {
  return status.plan !== "none" && status.expiresAt !== null && status.expiresAt.getTime() > Date.now();
}

/** Read DB first; if inactive, verify with RevenueCat and mirror into DB. */
export async function resolveSubscriptionStatus(user: {
  id: number;
  openId: string;
}): Promise<ResolvedSubscription> {
  let status = await db.getSubscriptionStatus(user.id);
  if (isActiveStatus(status)) {
    return {
      plan: status.plan,
      expiresAt: status.expiresAt,
      active: true,
      stripeCustomerId: status.stripeCustomerId ?? null,
    };
  }

  const openId = user.openId?.trim();
  if (!openId || !isRevenueCatApiConfigured()) {
    return {
      plan: status.plan,
      expiresAt: status.expiresAt,
      active: false,
      stripeCustomerId: status.stripeCustomerId ?? null,
    };
  }

  const fromStore = await fetchActiveSubscriptionFromRevenueCat(openId);
  if (!fromStore) {
    return {
      plan: status.plan,
      expiresAt: status.expiresAt,
      active: false,
      stripeCustomerId: status.stripeCustomerId ?? null,
    };
  }

  await db.setSubscriptionStatus(user.id, { plan: fromStore.plan, expiresAt: fromStore.expiresAt });
  status = await db.getSubscriptionStatus(user.id);

  return {
    plan: status.plan,
    expiresAt: status.expiresAt,
    active: true,
    stripeCustomerId: status.stripeCustomerId ?? null,
  };
}

export function isResolvedSubscriptionActive(status: ResolvedSubscription) {
  return status.active;
}
