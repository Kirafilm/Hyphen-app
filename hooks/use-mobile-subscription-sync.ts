import { useCallback } from "react";
import type { CustomerInfo } from "react-native-purchases";

import { mobileSubscriptionFromCustomerInfo } from "@/lib/subscription-sync";
import { trpc } from "@/lib/trpc";

export function useMobileSubscriptionSync() {
  const utils = trpc.useUtils();
  const syncMutation = trpc.subscription.debugActivate.useMutation({
    onSuccess: () => {
      void utils.subscription.me.invalidate();
    },
  });

  const syncFromCustomerInfo = useCallback(
    (info: CustomerInfo | null | undefined) => {
      const payload = mobileSubscriptionFromCustomerInfo(info);
      if (!payload) return false;
      syncMutation.mutate({ plan: payload.plan, expiresAt: payload.expiresAt });
      return true;
    },
    [syncMutation],
  );

  return { syncFromCustomerInfo, isSyncing: syncMutation.isPending };
}
