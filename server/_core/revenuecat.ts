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

function revenueCatSecretKey() {
  return process.env.REVENUECAT_SECRET_API_KEY?.trim() ?? "";
}

function revenueCatProjectId() {
  return process.env.REVENUECAT_PROJECT_ID?.trim() ?? "";
}

function revenueCatAuthHeaders(secret: string) {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
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

type RevenueCatV2Product = {
  store_identifier?: string | null;
};

type RevenueCatV2Subscription = {
  gives_access?: boolean;
  status?: string;
  current_period_ends_at?: number | null;
  pending_changes?: { product?: RevenueCatV2Product | null } | null;
  entitlements?: {
    items?: Array<{
      lookup_key?: string | null;
      products?: { items?: RevenueCatV2Product[] | null } | null;
    }> | null;
  } | null;
};

type RevenueCatV2ListResponse<T> = {
  items?: T[] | null;
};

function parseSubscriptionRecord(
  subscription: RevenueCatV2Subscription,
): RevenueCatActiveSubscription | null {
  if (!subscription.gives_access) return null;
  if (subscription.status !== "active" && subscription.status !== "trialing") return null;

  const storeIdentifiers: string[] = [];
  const pendingStoreId = subscription.pending_changes?.product?.store_identifier;
  if (pendingStoreId) storeIdentifiers.push(pendingStoreId);

  for (const entitlement of subscription.entitlements?.items ?? []) {
    for (const product of entitlement.products?.items ?? []) {
      if (product.store_identifier) storeIdentifiers.push(product.store_identifier);
    }
  }

  for (const storeIdentifier of storeIdentifiers) {
    const plan = planFromRevenueCatProductId(storeIdentifier);
    if (!plan) continue;

    const endsAtMs = subscription.current_period_ends_at;
    const expiresAt =
      typeof endsAtMs === "number" && Number.isFinite(endsAtMs)
        ? new Date(endsAtMs)
        : new Date(Date.now() + planToDurationMs(plan));
    if (expiresAt.getTime() <= Date.now()) return null;

    return { plan, expiresAt };
  }

  return null;
}

async function fetchActiveSubscriptionFromRevenueCatV1(
  appUserId: string,
  secret: string,
): Promise<RevenueCatActiveSubscription | null> {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: revenueCatAuthHeaders(secret) },
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn("[revenuecat] v1 subscriber lookup failed:", res.status, body.slice(0, 200));
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

async function fetchActiveSubscriptionFromRevenueCatV2(
  appUserId: string,
  secret: string,
  projectId: string,
): Promise<RevenueCatActiveSubscription | null> {
  const res = await fetch(
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(projectId)}/customers/${encodeURIComponent(appUserId)}/subscriptions`,
    { headers: revenueCatAuthHeaders(secret) },
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn("[revenuecat] v2 subscriptions lookup failed:", res.status, body.slice(0, 200));
    return null;
  }

  const data = (await res.json()) as RevenueCatV2ListResponse<RevenueCatV2Subscription>;
  for (const subscription of data.items ?? []) {
    const parsed = parseSubscriptionRecord(subscription);
    if (parsed) return parsed;
  }

  return null;
}

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
  const secret = revenueCatSecretKey();
  if (!secret) return null;

  const projectId = revenueCatProjectId();
  if (projectId) {
    const v2 = await fetchActiveSubscriptionFromRevenueCatV2(appUserId, secret, projectId);
    if (v2) return v2;
  }

  return fetchActiveSubscriptionFromRevenueCatV1(appUserId, secret);
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
