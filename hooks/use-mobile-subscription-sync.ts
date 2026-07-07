import { useCallback, useState } from "react";
import type { CustomerInfo } from "react-native-purchases";
import Constants from "expo-constants";

import { useAuth } from "@/hooks/use-auth";
import { mobileSubscriptionFromCustomerInfo } from "@/lib/subscription-sync";
import { trpc } from "@/lib/trpc";

function trpcErrorMessage(err: unknown): string | null {
  if (!err || typeof err !== "object" || !("message" in err)) return null;
  const message = (err as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
}

const appVariant = Constants.expoConfig?.extra?.appVariant ?? "production";
const allowDebugSubscriptionFallback = __DEV__ || appVariant !== "production";

export function useMobileSubscriptionSync() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [lastMessage, setLastMessage] = useState<string | null>(null);
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
    async (info?: CustomerInfo | null): Promise<{ ok: boolean; message: string | null }> => {
      const payload = mobileSubscriptionFromCustomerInfo(info ?? null);

      if (isAuthenticated) {
        try {
          await syncFromStore.mutateAsync(
            payload ? { plan: payload.plan, expiresAt: payload.expiresAt } : undefined,
          );
          setLastMessage(null);
          return { ok: true, message: null };
        } catch (err) {
          const code =
            err && typeof err === "object" && "data" in err
              ? (err as { data?: { code?: string } }).data?.code
              : undefined;
          const serverMessage = trpcErrorMessage(err);
          if (code !== "PRECONDITION_FAILED") {
            console.warn(
              "[SubscriptionSync] syncFromStore failed:",
              err instanceof Error ? err.message : String(err),
            );
          }

          if (!payload || !allowDebugSubscriptionFallback) {
            const message = serverMessage ?? "無法同步訂閱，請稍後再試。";
            setLastMessage(message);
            return { ok: false, message };
          }

          try {
            await debugActivate.mutateAsync({ plan: payload.plan, expiresAt: payload.expiresAt });
            setLastMessage(null);
            return { ok: true, message: null };
          } catch (activateErr) {
            console.warn(
              "[SubscriptionSync] debugActivate failed:",
              activateErr instanceof Error ? activateErr.message : String(activateErr),
            );
            const message = trpcErrorMessage(activateErr) ?? serverMessage ?? "同步失敗，請稍後再試。";
            setLastMessage(message);
            return { ok: false, message };
          }
        }
      }

      if (payload) {
        setLastMessage(null);
        return { ok: true, message: null };
      }

      const message = "無法同步訂閱，請稍後再試。";
      setLastMessage(message);
      return { ok: false, message };
    },
    [debugActivate, isAuthenticated, syncFromStore],
  );

  return {
    syncSubscription,
    isSyncing: syncFromStore.isPending || debugActivate.isPending,
    lastMessage,
  };
}
