import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import {
  getJobAlertsEnabledLocal,
  getMessageAlertsEnabledLocal,
  getNotificationPlatform,
  getStoredPushToken,
  isNativePushSupported,
  obtainExpoPushToken,
  setStoredPushToken,
} from "@/lib/notifications";

export function NotificationBootstrap() {
  const router = useRouter();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const registerMutation = trpc.notifications.register.useMutation();
  const syncingRef = useRef(false);

  const refreshJobs = useCallback(() => {
    void utils.jobs.list.invalidate();
  }, [utils.jobs.list]);

  const syncPushRegistration = useCallback(async () => {
    if (!isNativePushSupported() || syncingRef.current) return;
    syncingRef.current = true;
    try {
      const [jobAlertsEnabled, messageAlertsEnabled] = await Promise.all([
        getJobAlertsEnabledLocal(),
        getMessageAlertsEnabledLocal(),
      ]);
      const token = (await getStoredPushToken()) ?? (await obtainExpoPushToken());
      if (!token) return;

      await setStoredPushToken(token);
      await registerMutation.mutateAsync({
        expoPushToken: token,
        platform: getNotificationPlatform(),
        jobAlertsEnabled,
        messageAlertsEnabled,
      });
    } catch (error) {
      console.warn("[Notifications] sync failed:", error);
    } finally {
      syncingRef.current = false;
    }
  }, [registerMutation]);

  useEffect(() => {
    if (!isNativePushSupported()) return;

    const openSub = Notifications.addNotificationResponseReceivedListener((response) => {
      refreshJobs();
      const data = response.notification.request.content.data as {
        jobId?: string;
        threadId?: string;
        type?: string;
      };
      if (data?.type === "new_job" && typeof data.jobId === "string") {
        router.push(`/job/${data.jobId}`);
        return;
      }
      if (data?.type === "new_message" && typeof data.threadId === "string") {
        router.push(`/messages/${data.threadId}` as never);
      }
    });

    const receiveSub = Notifications.addNotificationReceivedListener(() => {
      refreshJobs();
      void utils.serviceMessages.listThreads.invalidate();
    });

    return () => {
      openSub.remove();
      receiveSub.remove();
    };
  }, [refreshJobs, router, utils.serviceMessages.listThreads]);

  useEffect(() => {
    if (!isNativePushSupported()) return;
    void syncPushRegistration();
  }, [syncPushRegistration, user?.id]);

  useEffect(() => {
    if (!isNativePushSupported()) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncPushRegistration();
        refreshJobs();
      }
    });
    return () => sub.remove();
  }, [refreshJobs, syncPushRegistration]);

  return null;
}
