import type { CustomerInfo } from "react-native-purchases";

import { REVENUECAT_ENTITLEMENT_ID, planFromProductId } from "@/lib/revenuecat";

export type MobileSubscriptionSync = {
  plan: "monthly" | "yearly";
  expiresAt: Date;
};

export function mobileSubscriptionFromCustomerInfo(
  info: CustomerInfo | null | undefined,
): MobileSubscriptionSync | null {
  const entitled = info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID];
  if (!entitled) return null;

  const plan = planFromProductId(entitled.productIdentifier ?? "");
  if (!plan) return null;

  const expiresAt = entitled.expirationDate ? new Date(entitled.expirationDate) : null;
  if (!expiresAt || expiresAt.getTime() <= Date.now()) return null;

  return { plan, expiresAt };
}
