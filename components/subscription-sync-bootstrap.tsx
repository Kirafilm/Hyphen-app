import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useMobileSubscriptionSync } from "@/hooks/use-mobile-subscription-sync";
import { linkRevenueCatAccount } from "@/lib/revenuecat";
import { trpc } from "@/lib/trpc";

/** Keeps server subscription status in sync with RevenueCat after App Store / Play purchases. */
export function SubscriptionSyncBootstrap() {
  const { isAuthenticated, user } = useAuth();
  const meQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const { syncSubscription } = useMobileSubscriptionSync();
  const syncingRef = useRef(false);

  const runSync = useCallback(async () => {
    if (Platform.OS === "web" || !user?.openId || syncingRef.current) return;
    syncingRef.current = true;
    try {
      const info = await linkRevenueCatAccount(user.openId, user.email ?? null);
      await syncSubscription(info);
    } catch (err) {
      console.warn(
        "[SubscriptionSync] skipped:",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      syncingRef.current = false;
    }
  }, [syncSubscription, user?.email, user?.openId]);

  useEffect(() => {
    if (!isAuthenticated || meQuery.isLoading) return;
    void runSync();
  }, [isAuthenticated, meQuery.isLoading, runSync]);

  return null;
}

export function useSubscriptionSyncOnFocus() {
  const { isAuthenticated, user } = useAuth();
  const meQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const { syncSubscription } = useMobileSubscriptionSync();
  const syncingRef = useRef(false);

  return useCallback(async () => {
    if (Platform.OS === "web" || !isAuthenticated || !user?.openId || syncingRef.current) return;
    syncingRef.current = true;
    try {
      const info = await linkRevenueCatAccount(user.openId, user.email ?? null);
      await syncSubscription(info);
      await meQuery.refetch();
    } finally {
      syncingRef.current = false;
    }
  }, [isAuthenticated, meQuery, syncSubscription, user?.email, user?.openId]);
}
