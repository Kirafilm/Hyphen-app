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

  mod.default.configure({ apiKey });
  if (__DEV__) {
    mod.default.setLogLevel(mod.LOG_LEVEL.ERROR);
  }
  configured = true;
  return mod;
}

export const REVENUECAT_ENTITLEMENT_ID = "pro";

export async function revenueCatLogIn(openId: string) {
  const mod = await ensureConfigured();
  if (!mod) return null;
  if (loggedInOpenId === openId) {
    return mod.default.getCustomerInfo();
  }
  const result = await mod.default.logIn(openId);
  loggedInOpenId = openId;
  return result;
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

