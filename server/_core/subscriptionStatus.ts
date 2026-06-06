import * as db from "../db";

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
