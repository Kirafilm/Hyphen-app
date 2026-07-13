import type { MobileSubscriptionSync } from "@/lib/subscription-sync";

export type SubscriptionPlan = "monthly" | "yearly";

export function normalizeSubscriptionPlan(value: string | null | undefined): SubscriptionPlan | null {
  if (value === "monthly" || value === "yearly") return value;
  return null;
}

export function resolveDisplayedSubscription(options: {
  serverPlan?: string | null;
  serverExpiresAt?: Date | string | null;
  local?: MobileSubscriptionSync | null;
  preferLocal?: boolean;
}): { plan: SubscriptionPlan | null; expiresAt: Date | null } {
  const serverPlan = normalizeSubscriptionPlan(options.serverPlan);
  const serverExpiresAt = options.serverExpiresAt ? new Date(options.serverExpiresAt) : null;
  const local = options.local ?? null;

  if (options.preferLocal && local) {
    return {
      plan: local.plan,
      expiresAt: pickLaterExpiry(local.expiresAt, serverExpiresAt),
    };
  }

  if (serverPlan && serverExpiresAt) {
    if (local && local.plan === "yearly" && serverPlan === "monthly") {
      return {
        plan: "yearly",
        expiresAt: pickLaterExpiry(local.expiresAt, serverExpiresAt),
      };
    }
    return { plan: serverPlan, expiresAt: serverExpiresAt };
  }

  if (local) {
    return { plan: local.plan, expiresAt: local.expiresAt };
  }

  return { plan: serverPlan, expiresAt: serverExpiresAt };
}

function pickLaterExpiry(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

export function formatSubscriptionExpiry(date: Date, locale: string): string {
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Sandbox / post-purchase payloads may briefly return purchase time instead of renewal time. */
export function isMeaningfulSubscriptionExpiry(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - Date.now() > 2 * 60 * 1000;
}
