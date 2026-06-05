import Stripe from "stripe";
import type { SubscriptionPlan } from "../db";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function stripePriceIdForPlan(plan: Exclude<SubscriptionPlan, "none">) {
  if (plan === "monthly") return process.env.STRIPE_PRICE_MONTHLY?.trim() ?? "";
  if (plan === "yearly") return process.env.STRIPE_PRICE_YEARLY?.trim() ?? "";
  return "";
}

export function planFromStripePriceId(priceId: string): Exclude<SubscriptionPlan, "none"> | null {
  const monthly = process.env.STRIPE_PRICE_MONTHLY?.trim();
  const yearly = process.env.STRIPE_PRICE_YEARLY?.trim();
  if (priceId && priceId === monthly) return "monthly";
  if (priceId && priceId === yearly) return "yearly";
  return null;
}

export function stripeCheckoutUrls() {
  const webBase = process.env.EXPO_PUBLIC_WEB_URL?.trim()?.replace(/\/$/, "");
  const success =
    process.env.STRIPE_SUCCESS_URL?.trim() ||
    (webBase ? `${webBase}/paywall?checkout=success` : "http://localhost:8081/paywall?checkout=success");
  const cancel =
    process.env.STRIPE_CANCEL_URL?.trim() ||
    (webBase ? `${webBase}/paywall?checkout=canceled` : "http://localhost:8081/paywall?checkout=canceled");
  return { success, cancel };
}

export function stripePortalReturnUrl() {
  const webBase = process.env.EXPO_PUBLIC_WEB_URL?.trim()?.replace(/\/$/, "");
  return (
    process.env.STRIPE_PORTAL_RETURN_URL?.trim() ||
    (webBase ? `${webBase}/paywall` : "http://localhost:8081/paywall")
  );
}
