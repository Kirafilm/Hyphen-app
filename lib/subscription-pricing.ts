import type { Locale } from "@/lib/i18n/types";

export type SubscriptionCurrency = "HKD" | "TWD";

export type LaunchPromoPlan = "monthly" | "yearly";

export type LaunchPromoTier = {
  original: number;
  sale: number;
};

/** Display prices for launch promo (HK web + preview). Stripe may still settle in HKD. */
const LAUNCH_PROMO_HKD: Record<LaunchPromoPlan, LaunchPromoTier> = {
  monthly: { original: 288, sale: 128 },
  yearly: { original: 2888, sale: 1328 },
};

/** Taiwan reference prices (~HKD equivalent, rounded for local display). */
const LAUNCH_PROMO_TWD: Record<LaunchPromoPlan, LaunchPromoTier> = {
  monthly: { original: 1180, sale: 520 },
  yearly: { original: 11800, sale: 5380 },
};

export function subscriptionCurrencyForLocale(locale: Locale): SubscriptionCurrency {
  return locale === "zh-TW" ? "TWD" : "HKD";
}

export function launchPromoForLocale(locale: Locale): Record<LaunchPromoPlan, LaunchPromoTier> {
  return locale === "zh-TW" ? LAUNCH_PROMO_TWD : LAUNCH_PROMO_HKD;
}

export function formatSubscriptionAmount(amount: number, currency: SubscriptionCurrency): string {
  const prefix = currency === "TWD" ? "NT$" : "HK$";
  return `${prefix}${amount.toLocaleString()}`;
}

export function formatLaunchPromoPrice(
  plan: LaunchPromoPlan,
  locale: Locale,
  periodSuffix: string,
): string {
  const currency = subscriptionCurrencyForLocale(locale);
  const sale = launchPromoForLocale(locale)[plan].sale;
  return `${formatSubscriptionAmount(sale, currency)}${periodSuffix}`;
}

export function launchPromoDisplay(
  plan: LaunchPromoPlan | null,
  locale: Locale,
  periodMonth: string,
  periodYear: string,
) {
  if (!plan) return null;
  const currency = subscriptionCurrencyForLocale(locale);
  const tier = launchPromoForLocale(locale)[plan];
  return {
    sale: tier.sale,
    suffix: plan === "monthly" ? periodMonth : periodYear,
    currency,
  };
}
