import { useCallback } from "react";
import type { CustomerInfo } from "react-native-purchases";

import { mobileSubscriptionFromCustomerInfo } from "@/lib/subscription-sync";
import { trpc } from "@/lib/trpc";

export function useMobileSubscriptionSync() {
  const utils = trpc.useUtils();
  const syncFromStore = trpc.subscription.syncFromStore.useMutation({
    onSuccess: () => {
      void utils.subscription.me.invalidate();
    },
  });
  const debugActivate = trpc.subscription.debugActivate.useMutation({
    onSuccess: () => {
      void utils.subscription.me.invalidate();
    },
  });

  const syncSubscription = useCallback(
    async (info?: CustomerInfo | null) => {
      try {
        await syncFromStore.mutateAsync();
        return true;
      } catch (err) {
        const code =
          err && typeof err === "object" && "data" in err
            ? (err as { data?: { code?: string } }).data?.code
            : undefined;
        if (code !== "PRECONDITION_FAILED") {
          console.warn(
            "[SubscriptionSync] syncFromStore failed:",
            err instanceof Error ? err.message : String(err),
          );
        }
      }

      const payload = mobileSubscriptionFromCustomerInfo(info ?? null);
      if (!payload) return false;

      try {
        await debugActivate.mutateAsync({ plan: payload.plan, expiresAt: payload.expiresAt });
        return true;
      } catch (err) {
        console.warn(
          "[SubscriptionSync] debugActivate failed:",
          err instanceof Error ? err.message : String(err),
        );
        return false;
      }
    },
    [debugActivate, syncFromStore],
  );

  return {
    syncSubscription,
    isSyncing: syncFromStore.isPending || debugActivate.isPending,
  };
}
