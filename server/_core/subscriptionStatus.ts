import * as db from "../db";
import { fetchActiveSubscriptionFromRevenueCatForUser, isRevenueCatApiConfigured } from "./revenuecat";

export type ResolvedSubscription = {
  plan: db.SubscriptionPlan;
  expiresAt: Date | null;
  active: boolean;
  stripeCustomerId: string | null;
};

function isActiveStatus(status: db.SubscriptionStatus) {
  return status.plan !== "none" && status.expiresAt !== null && status.expiresAt.getTime() > Date.now();
}

/** Prefer live RevenueCat status whenever the server API key is configured. */
export async function resolveSubscriptionStatus(user: {
  id: number;
  openId: string;
  email?: string | null;
}): Promise<ResolvedSubscription> {
  const status = await db.getSubscriptionStatus(user.id);
  const openId = user.openId?.trim();

  if (openId && isRevenueCatApiConfigured()) {
    const fromStore = await fetchActiveSubscriptionFromRevenueCatForUser({
      openId,
      email: user.email,
    });
    if (fromStore) {
      await db.setSubscriptionStatus(user.id, { plan: fromStore.plan, expiresAt: fromStore.expiresAt });
      const updated = await db.getSubscriptionStatus(user.id);
      return {
        plan: updated.plan,
        expiresAt: updated.expiresAt,
        active: true,
        stripeCustomerId: updated.stripeCustomerId ?? null,
      };
    }
  }

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
