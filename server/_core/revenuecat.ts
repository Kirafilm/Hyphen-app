import type { SubscriptionPlan } from "../db";

export const REVENUECAT_ENTITLEMENT_ID = "Hyphen Pro";

export const REVENUECAT_ENTITLEMENT_IDS = ["Hyphen Pro", "pro"] as const;

export function isProEntitlementKey(key: string) {
  const normalized = key.trim().toLowerCase();
  return REVENUECAT_ENTITLEMENT_IDS.some((id) => id.toLowerCase() === normalized) || normalized.includes("pro");
}

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
  if (
    base === "hyphen_pro_monthly" ||
    base.includes("monthly") ||
    normalized.includes(":p1m")
  ) {
    return "monthly";
  }
  if (
    base === "hyphen_pro_yearly" ||
    base.includes("yearly") ||
    base.includes("annual") ||
    normalized.includes(":p1y")
  ) {
    return "yearly";
  }
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
  product_id?: string | null;
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

function parseRevenueCatTimestamp(value: number): Date | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  // RevenueCat v2 uses milliseconds; guard against accidental seconds values.
  const ms = value < 1_000_000_000_000 ? value * 1000 : value;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSubscriptionRecord(
  subscription: RevenueCatV2Subscription,
): RevenueCatActiveSubscription | null {
  const endsAtMs = subscription.current_period_ends_at;
  const fallbackExpiresAt = typeof endsAtMs === "number" ? parseRevenueCatTimestamp(endsAtMs) : null;
  if (!fallbackExpiresAt) return null;

  const periodActive = fallbackExpiresAt.getTime() > Date.now();
  if (!subscription.gives_access && !periodActive) return null;

  const storeIdentifiers: string[] = [];
  const pendingStoreId = subscription.pending_changes?.product?.store_identifier;
  if (pendingStoreId) storeIdentifiers.push(pendingStoreId);

  for (const entitlement of subscription.entitlements?.items ?? []) {
    for (const product of entitlement.products?.items ?? []) {
      if (product.store_identifier) storeIdentifiers.push(product.store_identifier);
    }
  }

  if (subscription.product_id) storeIdentifiers.push(subscription.product_id);

  for (const storeIdentifier of storeIdentifiers) {
    const plan = planFromRevenueCatProductId(storeIdentifier);
    if (!plan) continue;
    return { plan, expiresAt: fallbackExpiresAt };
  }

  return null;
}

function isBetterSubscription(
  candidate: RevenueCatActiveSubscription,
  current: RevenueCatActiveSubscription | null,
): boolean {
  if (!current) return true;
  if (candidate.expiresAt.getTime() !== current.expiresAt.getTime()) {
    return candidate.expiresAt.getTime() > current.expiresAt.getTime();
  }
  if (candidate.plan === "yearly" && current.plan === "monthly") return true;
  return false;
}

export function mergeClientSubscriptionHint(
  server: RevenueCatActiveSubscription | null,
  client?: { plan: Exclude<SubscriptionPlan, "none">; expiresAt: Date } | null,
): RevenueCatActiveSubscription | null {
  if (!client || client.expiresAt.getTime() <= Date.now()) return server;
  if (!server) return client;

  if (client.plan === "yearly" && server.plan === "monthly") {
    return {
      plan: "yearly",
      expiresAt:
        client.expiresAt.getTime() > server.expiresAt.getTime() ? client.expiresAt : server.expiresAt,
    };
  }

  if (client.expiresAt.getTime() > server.expiresAt.getTime()) {
    return { ...server, expiresAt: client.expiresAt };
  }

  return server;
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
  for (const id of REVENUECAT_ENTITLEMENT_IDS) {
    const preferred = parseEntitlement(entitlements[id]);
    if (preferred) return preferred;
  }

  for (const [key, entitlement] of Object.entries(entitlements)) {
    if (!isProEntitlementKey(key)) continue;
    const parsed = parseEntitlement(entitlement);
    if (parsed) return parsed;
  }

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
  environment: "production" | "sandbox",
): Promise<RevenueCatActiveSubscription | null> {
  const res = await fetch(
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(projectId)}/customers/${encodeURIComponent(appUserId)}/subscriptions?environment=${environment}`,
    { headers: revenueCatAuthHeaders(secret) },
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(
      `[revenuecat] v2 subscriptions lookup failed (${environment}):`,
      res.status,
      body.slice(0, 200),
    );
    return null;
  }

  const data = (await res.json()) as RevenueCatV2ListResponse<RevenueCatV2Subscription>;
  let best: RevenueCatActiveSubscription | null = null;

  for (const subscription of data.items ?? []) {
    const parsed = parseSubscriptionRecord(subscription);
    if (!parsed) continue;
    if (isBetterSubscription(parsed, best)) {
      best = parsed;
    }
  }

  return best;
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

  const v1 = await fetchActiveSubscriptionFromRevenueCatV1(appUserId, secret);
  if (v1) return v1;

  const projectId = revenueCatProjectId();
  if (!projectId) return null;

  const environments: Array<"production" | "sandbox"> =
    process.env.NODE_ENV === "production" ? ["production", "sandbox"] : ["production", "sandbox"];
  let best: RevenueCatActiveSubscription | null = null;
  for (const environment of environments) {
    const v2 = await fetchActiveSubscriptionFromRevenueCatV2(appUserId, secret, projectId, environment);
    if (v2 && isBetterSubscription(v2, best)) {
      best = v2;
    }
  }

  return best;
}

async function findRevenueCatCustomerIdsByEmail(email: string): Promise<string[]> {
  const secret = revenueCatSecretKey();
  const projectId = revenueCatProjectId();
  if (!secret || !projectId) return [];

  const res = await fetch(
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(projectId)}/customers?search=${encodeURIComponent(email)}&limit=20`,
    { headers: revenueCatAuthHeaders(secret) },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as RevenueCatV2ListResponse<{ id?: string | null }>;
  return (data.items ?? [])
    .map((item) => item.id?.trim())
    .filter((id): id is string => Boolean(id));
}

export async function fetchActiveSubscriptionFromRevenueCatForUser(user: {
  openId: string;
  email?: string | null;
}): Promise<RevenueCatActiveSubscription | null> {
  const openId = user.openId?.trim();
  if (!openId) return null;
  return fetchActiveSubscriptionFromRevenueCat(openId);
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
