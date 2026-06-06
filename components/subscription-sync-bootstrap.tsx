import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useMobileSubscriptionSync } from "@/hooks/use-mobile-subscription-sync";
import { revenueCatGetCustomerInfo, revenueCatLogIn } from "@/lib/revenuecat";
import { trpc } from "@/lib/trpc";

/** Keeps server subscription status in sync with RevenueCat after App Store / Play purchases. */
export function SubscriptionSyncBootstrap() {
  const { isAuthenticated, user } = useAuth();
  const meQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const { syncFromCustomerInfo } = useMobileSubscriptionSync();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web" || !isAuthenticated || !user?.openId) return;
    if (meQuery.isLoading || meQuery.data?.active || syncingRef.current) return;

    syncingRef.current = true;
    (async () => {
      try {
        await revenueCatLogIn(user.openId!);
        const info = await revenueCatGetCustomerInfo();
        syncFromCustomerInfo(info);
      } catch (err) {
        console.warn(
          "[SubscriptionSync] skipped:",
          err instanceof Error ? err.message : String(err),
        );
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [isAuthenticated, user?.openId, meQuery.isLoading, meQuery.data?.active, syncFromCustomerInfo]);

  return null;
}
