import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const JOB_ALERTS_ENABLED_KEY = "hyphen_job_alerts_enabled";
export const EXPO_PUSH_TOKEN_KEY = "hyphen_expo_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function isNativePushSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
}

export async function setStoredPushToken(token: string | null): Promise<void> {
  if (!token) {
    await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
    return;
  }
  await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
}

export async function getJobAlertsEnabledLocal(): Promise<boolean> {
  const value = await AsyncStorage.getItem(JOB_ALERTS_ENABLED_KEY);
  if (value === null) return true;
  return value === "1";
}

export async function setJobAlertsEnabledLocal(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(JOB_ALERTS_ENABLED_KEY, enabled ? "1" : "0");
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNativePushSupported()) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function obtainExpoPushToken(): Promise<string | null> {
  if (!isNativePushSupported()) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "一般通知",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  if (!projectId) {
    console.warn("[Notifications] Missing EAS projectId for push token");
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export type NotificationPlatform = "ios" | "android" | "web";

export function getNotificationPlatform(): NotificationPlatform {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}
