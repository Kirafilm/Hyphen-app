import { Platform } from "react-native";

type PurchasesModule = typeof import("react-native-purchases");

let purchasesModulePromise: Promise<PurchasesModule | null> | null = null;
let configured = false;
let loggedInOpenId: string | null = null;

function getApiKey() {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  return undefined;
}

function isTestStoreApiKey(key: string) {
  return key.startsWith("test_");
}

/** Release builds must not call Purchases.configure with a Test Store key — SDK force-quits the app. */
export function isRevenueCatEnabled() {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  if (!__DEV__ && isTestStoreApiKey(apiKey)) return false;
  return true;
}

async function getPurchasesModule() {
  if (Platform.OS === "web") return null;
  if (!purchasesModulePromise) {
    purchasesModulePromise = import("react-native-purchases").catch(() => null);
  }
  return purchasesModulePromise;
}

async function ensureConfigured() {
  if (Platform.OS === "web") return null;
  const mod = await getPurchasesModule();
  if (!mod) return null;
  if (configured) return mod;

  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!isRevenueCatEnabled()) {
    console.warn("[RevenueCat] Skipped in release build (Test Store key or missing production key).");
    return null;
  }

  mod.default.configure({ apiKey });
  if (__DEV__) {
    mod.default.setLogLevel(mod.LOG_LEVEL.ERROR);
  }
  configured = true;
  return mod;
}

/** Must match RevenueCat Dashboard → Entitlements → Identifier exactly. */
export const REVENUECAT_ENTITLEMENT_ID = "Hyphen Pro";

export const REVENUECAT_ENTITLEMENT_IDS = ["Hyphen Pro", "pro"] as const;

export function getActiveProEntitlement(
  active: Record<string, import("react-native-purchases").PurchasesEntitlementInfo> | undefined,
) {
  if (!active) return undefined;
  for (const id of REVENUECAT_ENTITLEMENT_IDS) {
    if (active[id]) return active[id];
  }
  return Object.values(active)[0];
}

export const SUBSCRIPTION_PRODUCT_IDS = ["hyphen_pro_monthly", "hyphen_pro_yearly"] as const;

export function planFromProductId(productId: string): "monthly" | "yearly" | null {
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

export function productIdsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const planA = planFromProductId(a);
  const planB = planFromProductId(b);
  return planA !== null && planA === planB;
}

export function findStoreProductById(
  products: PurchasesStoreProduct[],
  productId: string,
): PurchasesStoreProduct | undefined {
  return products.find((product) => productIdsMatch(product.identifier, productId));
}

export type PurchasesStoreProduct = import("react-native-purchases").PurchasesStoreProduct;

export async function revenueCatGetSubscriptionProducts(): Promise<PurchasesStoreProduct[]> {
  const mod = await ensureConfigured();
  if (!mod) return [];
  try {
    const category = mod.PRODUCT_CATEGORY?.SUBSCRIPTION;
    const products = category
      ? await mod.default.getProducts([...SUBSCRIPTION_PRODUCT_IDS], category)
      : await mod.default.getProducts([...SUBSCRIPTION_PRODUCT_IDS]);
    return Array.isArray(products) ? products : [];
  } catch (err) {
    console.warn("[RevenueCat] getProducts failed:", err);
    return [];
  }
}

export async function revenueCatPurchaseStoreProduct(product: PurchasesStoreProduct) {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.purchaseStoreProduct(product);
}

export async function revenueCatLogIn(openId: string, email?: string | null) {
  return linkRevenueCatAccount(openId, email);
}

/** Bind RevenueCat to the Supabase user id. Does not restore Play/App Store purchases — use {@link restoreRevenueCatPurchases} after explicit user action. */
export async function linkRevenueCatAccount(openId: string, email?: string | null) {
  const mod = await ensureConfigured();
  if (!mod) return null;

  const trimmedOpenId = openId.trim();
  if (!trimmedOpenId) return null;

  let customerInfo = null;
  if (loggedInOpenId !== trimmedOpenId) {
    const loginResult = await mod.default.logIn(trimmedOpenId);
    loggedInOpenId = trimmedOpenId;
    customerInfo = loginResult.customerInfo;
  }

  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    try {
      await mod.default.setEmail(trimmedEmail);
    } catch (err) {
      console.warn(
        "[RevenueCat] setEmail skipped:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return customerInfo ?? mod.default.getCustomerInfo();
}

/** Restore store purchases for the current store account — only call from the paywall "恢復購買" button. */
export async function restoreRevenueCatPurchases() {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.restorePurchases();
}

export async function revenueCatLogOut() {
  const mod = await ensureConfigured();
  if (!mod) return null;
  loggedInOpenId = null;
  return mod.default.logOut();
}

export async function revenueCatGetOfferings() {
  const mod = await ensureConfigured();
  if (!mod) return null;
  try {
    return await mod.default.getOfferings();
  } catch (err) {
    console.warn("[RevenueCat] getOfferings failed:", err);
    return null;
  }
}

export async function revenueCatPurchasePackage(pkg: import("react-native-purchases").PurchasesPackage) {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.purchasePackage(pkg);
}

export async function revenueCatRestorePurchases() {
  return restoreRevenueCatPurchases();
}

export async function revenueCatGetCustomerInfo() {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.getCustomerInfo();
}

export async function revenueCatGetAppUserId() {
  const mod = await ensureConfigured();
  if (!mod) return null;
  try {
    return await mod.default.getAppUserID();
  } catch (err) {
    console.warn("[RevenueCat] getAppUserID failed:", err);
    return null;
  }
}

export function isRevenueCatUserCancellation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Purchase was cancelled") ||
    message.includes("USER_CANCELED") ||
    /user cancelled/i.test(message)
  );
}

/** Map RevenueCat / store SDK errors to user-facing copy (never show raw SDK text in release). */
export function formatRevenueCatPaywallError(
  error: unknown,
  options?: { storeName?: string },
): string | null {
  if (!error || isRevenueCatUserCancellation(error)) return null;

  const message = error instanceof Error ? error.message : String(error);
  if (__DEV__) return message;

  const store = options?.storeName ?? "App Store";
  if (
    /configuration|revenuecat|app store connect|storekit|could not be fetched|offerings|rev\.cat|products registered|problem with your configuration/i.test(
      message,
    )
  ) {
    return `無法從 ${store} 載入訂閱產品，請稍後再試。`;
  }

  return "操作未能完成，請稍後再試。";
}

