import type { SubscriptionPlan } from "../db";

export const REVENUECAT_ENTITLEMENT_ID = "pro";

export function isRevenueCatWebhookConfigured() {
  return Boolean(process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim());
}

export function verifyRevenueCatWebhookAuthorization(header: string | undefined) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim();
  if (!expected || !header) return false;
  return header === expected || header === `Bearer ${expected}`;
}

export function planFromRevenueCatProductId(productId: string): Exclude<SubscriptionPlan, "none"> | null {
  const base = productId.split(":")[0]?.trim() ?? productId;
  if (base === "hyphen_pro_monthly") return "monthly";
  if (base === "hyphen_pro_yearly") return "yearly";
  return null;
}

export type RevenueCatWebhookBody = {
  api_version?: string;
  event?: {
    type?: string;
    app_user_id?: string;
    product_id?: string;
    expiration_at_ms?: number | null;
    entitlement_ids?: string[] | null;
  };
};

export function revenueCatEventGrantsAccess(type: string) {
  return (
    type === "INITIAL_PURCHASE" ||
    type === "RENEWAL" ||
    type === "UNCANCELLATION" ||
    type === "PRODUCT_CHANGE" ||
    type === "SUBSCRIPTION_EXTENDED" ||
    type === "NON_RENEWING_PURCHASE"
  );
}

export function revenueCatEventRevokesAccess(type: string) {
  return type === "EXPIRATION";
}
