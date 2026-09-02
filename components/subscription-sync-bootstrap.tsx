import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useMobileSubscriptionSync } from "@/hooks/use-mobile-subscription-sync";
import { isRevenueCatEnabled, linkRevenueCatAccount, revenueCatGetCustomerInfo } from "@/lib/revenuecat";
import { mobileSubscriptionFromCustomerInfo } from "@/lib/subscription-sync";
import { trpc } from "@/lib/trpc";

/** Keep RevenueCat linked and mirror store subscriptions into the API when the paywall shows unlocked but jobs stay locked. */
export function SubscriptionSyncBootstrap() {
  const { isAuthenticated, user } = useAuth();
  const { syncSubscription } = useMobileSubscriptionSync();
  const subscriptionQuery = trpc.subscription.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (Platform.OS === "web" || !isRevenueCatEnabled()) return;

    void (async () => {
      try {
        if (isAuthenticated && user?.openId) {
          await linkRevenueCatAccount(user.openId, user.email ?? null);
        }
        const customerInfo = await revenueCatGetCustomerInfo();
        const local = mobileSubscriptionFromCustomerInfo(customerInfo);
        if (isAuthenticated && local && !subscriptionQuery.data?.active) {
          await syncSubscription(customerInfo);
        }
      } catch {
        // Non-fatal; jobs API also checks RevenueCat directly for logged-in users.
      }
    })();
  }, [isAuthenticated, subscriptionQuery.data?.active, syncSubscription, user?.email, user?.openId]);

  return null;
}
