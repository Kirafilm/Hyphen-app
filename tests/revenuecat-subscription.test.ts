import { describe, expect, it } from "vitest";

import { resolveDisplayedSubscription } from "../lib/subscription-display";
import {
  mergeClientSubscriptionHint,
  planFromRevenueCatProductId,
} from "../server/_core/revenuecat";

describe("planFromRevenueCatProductId", () => {
  it("detects yearly store products", () => {
    expect(planFromRevenueCatProductId("hyphen_pro_yearly")).toBe("yearly");
    expect(planFromRevenueCatProductId("com.app.hyphen_pro_yearly")).toBe("yearly");
  });

  it("detects monthly store products", () => {
    expect(planFromRevenueCatProductId("hyphen_pro_monthly")).toBe("monthly");
  });
});

describe("mergeClientSubscriptionHint", () => {
  it("upgrades mislabeled monthly server plan to yearly from client", () => {
    const server = {
      plan: "monthly" as const,
      expiresAt: new Date("2026-08-07T03:26:26Z"),
    };
    const client = {
      plan: "yearly" as const,
      expiresAt: new Date("2027-07-07T03:26:26Z"),
    };

    const merged = mergeClientSubscriptionHint(server, client);
    expect(merged?.plan).toBe("yearly");
    expect(merged?.expiresAt.toISOString()).toBe("2027-07-07T03:26:26.000Z");
  });
});

describe("resolveDisplayedSubscription", () => {
  it("prefers native RevenueCat yearly plan over mislabeled server monthly", () => {
    const displayed = resolveDisplayedSubscription({
      serverPlan: "monthly",
      serverExpiresAt: new Date("2026-08-07T03:26:26Z"),
      local: {
        plan: "yearly",
        expiresAt: new Date("2027-07-07T03:26:26Z"),
      },
      preferLocal: true,
    });

    expect(displayed.plan).toBe("yearly");
    expect(displayed.expiresAt?.toISOString()).toBe("2027-07-07T03:26:26.000Z");
  });
});
