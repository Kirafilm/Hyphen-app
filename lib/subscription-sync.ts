import type { CustomerInfo, PurchasesEntitlementInfo } from "react-native-purchases";

import { REVENUECAT_ENTITLEMENT_IDS, planFromProductId } from "@/lib/revenuecat";

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

  const preferred =
    REVENUECAT_ENTITLEMENT_IDS.map((id) => active[id]).find(Boolean) ?? undefined;
  const parsedPreferred = parseEntitlement(preferred);
  if (parsedPreferred) return parsedPreferred;

  for (const entitlement of Object.values(active)) {
    const parsed = parseEntitlement(entitlement);
    if (parsed) return parsed;
  }

  const first = Object.values(active)[0];
  if (first) {
    const plan = planFromProductId(first.productIdentifier ?? "");
    const expiresAt = first.expirationDate ? new Date(first.expirationDate) : null;
    if (plan && (!expiresAt || expiresAt.getTime() > Date.now())) {
      return {
        plan,
        expiresAt: expiresAt ?? new Date(Date.now() + planDurationMs(plan)),
      };
    }
  }

  return null;
}
