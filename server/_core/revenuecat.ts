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
  const normalized = productId.trim().toLowerCase();
  const base = normalized.split(":")[0]?.trim() ?? normalized;
  if (base === "hyphen_pro_monthly" || base.includes("monthly")) return "monthly";
  if (base === "hyphen_pro_yearly" || base.includes("yearly") || base.includes("annual")) return "yearly";
  return null;
}

export function isRevenueCatApiConfigured() {
  return Boolean(process.env.REVENUECAT_SECRET_API_KEY?.trim());
}

type RevenueCatEntitlementPayload = {
  expires_date?: string | null;
  product_identifier?: string | null;
};

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlementPayload>;
  };
};

export type RevenueCatActiveSubscription = {
  plan: Exclude<SubscriptionPlan, "none">;
  expiresAt: Date;
};

function planToDurationMs(plan: Exclude<SubscriptionPlan, "none">) {
  if (plan === "monthly") return 1000 * 60 * 60 * 24 * 30;
  return 1000 * 60 * 60 * 24 * 365;
}

function parseEntitlement(
  entitlement: RevenueCatEntitlementPayload | undefined,
): RevenueCatActiveSubscription | null {
  if (!entitlement?.product_identifier) return null;

  const plan = planFromRevenueCatProductId(entitlement.product_identifier);
  if (!plan) return null;

  const expiresAt = entitlement.expires_date ? new Date(entitlement.expires_date) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) return null;

  return {
    plan,
    expiresAt: expiresAt ?? new Date(Date.now() + planToDurationMs(plan)),
  };
}

export async function fetchActiveSubscriptionFromRevenueCat(
  appUserId: string,
): Promise<RevenueCatActiveSubscription | null> {
  const secret = process.env.REVENUECAT_SECRET_API_KEY?.trim();
  if (!secret) return null;

  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn("[revenuecat] subscriber lookup failed:", res.status, body.slice(0, 200));
    return null;
  }

  const data = (await res.json()) as RevenueCatSubscriberResponse;
  const entitlements = data.subscriber?.entitlements ?? {};
  const preferred = parseEntitlement(entitlements[REVENUECAT_ENTITLEMENT_ID]);
  if (preferred) return preferred;

  for (const entitlement of Object.values(entitlements)) {
    const parsed = parseEntitlement(entitlement);
    if (parsed) return parsed;
  }

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
