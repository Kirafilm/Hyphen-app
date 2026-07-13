import type { CustomerInfo, PurchasesEntitlementInfo } from "react-native-purchases";

import { planFromProductId } from "@/lib/revenuecat";

export type MobileSubscriptionSync = {
  plan: "monthly" | "yearly";
  expiresAt: Date;
};

function planDurationMs(plan: MobileSubscriptionSync["plan"]) {
  if (plan === "monthly") return 1000 * 60 * 60 * 24 * 30;
  return 1000 * 60 * 60 * 24 * 365;
}

function pickBestSubscription(candidates: MobileSubscriptionSync[]): MobileSubscriptionSync | null {
  let best: MobileSubscriptionSync | null = null;
  for (const candidate of candidates) {
    if (!best) {
      best = candidate;
      continue;
    }
    if (candidate.plan === "yearly" && best.plan === "monthly") {
      best = candidate;
      continue;
    }
    if (candidate.plan === best.plan && candidate.expiresAt.getTime() > best.expiresAt.getTime()) {
      best = candidate;
    }
  }
  return best;
}

function parseEntitlement(entitlement: PurchasesEntitlementInfo | undefined): MobileSubscriptionSync | null {
  if (!entitlement) return null;

  const plan = planFromProductId(entitlement.productIdentifier ?? "");
  if (!plan) return null;

  const expiresAt = entitlement.expirationDate ? new Date(entitlement.expirationDate) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) return null;

  return {
    plan,
    expiresAt: expiresAt ?? new Date(Date.now() + planDurationMs(plan)),
  };
}

export function mobileSubscriptionFromCustomerInfo(
  info: CustomerInfo | null | undefined,
): MobileSubscriptionSync | null {
  const active = info?.entitlements?.active;
  const candidates: MobileSubscriptionSync[] = [];

  if (active) {
    for (const entitlement of Object.values(active)) {
      const parsed = parseEntitlement(entitlement);
      if (parsed) candidates.push(parsed);
    }
  }

  for (const productId of info?.activeSubscriptions ?? []) {
    const plan = planFromProductId(productId);
    if (!plan) continue;
    const rawExpiry = info?.allExpirationDates?.[productId];
    const expiresAt = rawExpiry ? new Date(rawExpiry) : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) continue;
    candidates.push({
      plan,
      expiresAt: expiresAt ?? new Date(Date.now() + planDurationMs(plan)),
    });
  }

  return pickBestSubscription(candidates);
}
