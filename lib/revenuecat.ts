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

export const REVENUECAT_ENTITLEMENT_ID = "pro";

export const SUBSCRIPTION_PRODUCT_IDS = ["hyphen_pro_monthly", "hyphen_pro_yearly"] as const;

export function planFromProductId(productId: string): "monthly" | "yearly" | null {
  const normalized = productId.trim().toLowerCase();
  const base = normalized.split(":")[0]?.trim() ?? normalized;
  if (base === "hyphen_pro_monthly" || base.includes("monthly")) return "monthly";
  if (base === "hyphen_pro_yearly" || base.includes("yearly") || base.includes("annual")) return "yearly";
  return null;
}

export type PurchasesStoreProduct = import("react-native-purchases").PurchasesStoreProduct;

export async function revenueCatGetSubscriptionProducts(): Promise<PurchasesStoreProduct[]> {
  const mod = await ensureConfigured();
  if (!mod) return [];
  const category = mod.PRODUCT_CATEGORY?.SUBSCRIPTION;
  const products = category
    ? await mod.default.getProducts([...SUBSCRIPTION_PRODUCT_IDS], category)
    : await mod.default.getProducts([...SUBSCRIPTION_PRODUCT_IDS]);
  return Array.isArray(products) ? products : [];
}

export async function revenueCatPurchaseStoreProduct(product: PurchasesStoreProduct) {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.purchaseStoreProduct(product);
}

export async function revenueCatLogIn(openId: string, email?: string | null) {
  return linkRevenueCatAccount(openId, email);
}

/** Bind RevenueCat to the Supabase user id and merge any anonymous/test purchases. */
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

  try {
    const restored = await mod.default.restorePurchases();
    if (restored) customerInfo = restored;
  } catch (err) {
    console.warn(
      "[RevenueCat] restorePurchases skipped:",
      err instanceof Error ? err.message : String(err),
    );
  }

  return customerInfo ?? mod.default.getCustomerInfo();
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
  return mod.default.getOfferings();
}

export async function revenueCatPurchasePackage(pkg: import("react-native-purchases").PurchasesPackage) {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.purchasePackage(pkg);
}

export async function revenueCatRestorePurchases() {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.restorePurchases();
}

export async function revenueCatGetCustomerInfo() {
  const mod = await ensureConfigured();
  if (!mod) return null;
  return mod.default.getCustomerInfo();
}

