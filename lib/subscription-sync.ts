import type { CustomerInfo, PurchasesEntitlementInfo } from "react-native-purchases";

import { REVENUECAT_ENTITLEMENT_ID, planFromProductId } from "@/lib/revenuecat";

export type MobileSubscriptionSync = {
  plan: "monthly" | "yearly";
  expiresAt: Date;
};

function planDurationMs(plan: MobileSubscriptionSync["plan"]) {
  if (plan === "monthly") return 1000 * 60 * 60 * 24 * 30;
  return 1000 * 60 * 60 * 24 * 365;
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
  if (!active) return null;

  const preferred = parseEntitlement(active[REVENUECAT_ENTITLEMENT_ID]);
  if (preferred) return preferred;

  for (const entitlement of Object.values(active)) {
    const parsed = parseEntitlement(entitlement);
    if (parsed) return parsed;
  }

  return null;
}
