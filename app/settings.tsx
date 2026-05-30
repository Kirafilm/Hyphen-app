import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import type { ColorScheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import {
  getJobAlertsEnabledLocal,
  getNotificationPlatform,
  getStoredPushToken,
  isNativePushSupported,
  obtainExpoPushToken,
  requestNotificationPermissions,
  setJobAlertsEnabledLocal,
  setStoredPushToken,
} from "@/lib/notifications";

export default function SettingsScreen() {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [jobAlertsEnabled, setJobAlertsEnabled] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const setJobAlertsMutation = trpc.notifications.setJobAlerts.useMutation();
  const registerMutation = trpc.notifications.register.useMutation();
  const settingsQuery = trpc.notifications.getSettings.useQuery(
    { expoPushToken: pushToken ?? "" },
    { enabled: Boolean(pushToken) },
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const localEnabled = await getJobAlertsEnabledLocal();
        if (!cancelled) setJobAlertsEnabled(localEnabled);

        if (!isNativePushSupported()) {
          if (!cancelled) setBootstrapping(false);
          return;
        }

        const granted = await requestNotificationPermissions();
        if (!cancelled) setPermissionDenied(!granted);

        const token = (await getStoredPushToken()) ?? (granted ? await obtainExpoPushToken() : null);
        if (token) {
          await setStoredPushToken(token);
          if (!cancelled) setPushToken(token);
        }
      } catch (error) {
        console.warn("[Settings] bootstrap failed:", error);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setJobAlertsEnabled(settingsQuery.data.jobAlertsEnabled);
    void setJobAlertsEnabledLocal(settingsQuery.data.jobAlertsEnabled);
  }, [settingsQuery.data]);

  const handleToggleJobAlerts = useCallback(
    async (enabled: boolean) => {
      if (!isNativePushSupported()) return;

      setSaving(true);
      try {
        if (enabled) {
          const granted = await requestNotificationPermissions();
          if (!granted) {
            setPermissionDenied(true);
            return;
          }
          setPermissionDenied(false);

          const token = pushToken ?? (await obtainExpoPushToken());
          if (!token) return;
          setPushToken(token);
          await setStoredPushToken(token);
          await registerMutation.mutateAsync({
            expoPushToken: token,
            platform: getNotificationPlatform(),
            jobAlertsEnabled: true,
          });
        }

        setJobAlertsEnabled(enabled);
        await setJobAlertsEnabledLocal(enabled);

        const token = pushToken ?? (await getStoredPushToken());
        if (token) {
          await setJobAlertsMutation.mutateAsync({ expoPushToken: token, enabled });
        }
      } catch (error) {
        console.warn("[Settings] toggle failed:", error);
      } finally {
        setSaving(false);
      }
    },
    [pushToken, registerMutation, setJobAlertsMutation],
  );

  const openSystemSettings = () => {
    if (Platform.OS === "ios") {
      void Linking.openURL("app-settings:");
      return;
    }
    void Linking.openSettings();
  };

  const loading = bootstrapping || (Boolean(pushToken) && settingsQuery.isLoading);

  const themeOptions: Array<{ id: ColorScheme; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: "light", label: "淺色", icon: "sunny" },
    { id: "dark", label: "深色", icon: "moon" },
  ];

  return (
    <AppScreen>
      <PageHeader title="設定" showBack />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, paddingBottom: 40 }}>
        <View style={{ gap: 16 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>外觀主題</Text>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>選擇 App 的淺色或深色介面。</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {themeOptions.map((option) => {
                const active = colorScheme === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setColorScheme(option.id)}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: active ? colors.primary : colors.background,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <Ionicons name={option.icon} size={18} color={active ? "#ffffff" : colors.foreground} />
                    <Text style={{ color: active ? "#ffffff" : colors.foreground, fontWeight: "700", fontSize: 15 }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 18,
                  gap: 16,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>新工作通知</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
                    有人發佈新工作時，以推送通知提醒你。
                  </Text>
                </View>
                <Switch
                  value={jobAlertsEnabled}
                  disabled={saving || !isNativePushSupported()}
                  onValueChange={handleToggleJobAlerts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>
          )}
        </View>

        {!isNativePushSupported() && (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 16, lineHeight: 20 }}>
            推送通知只適用於 iOS / Android App。
          </Text>
        )}

        {permissionDenied && (
          <View
            style={{
              marginTop: 16,
              backgroundColor: `${colors.primary}14`,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: `${colors.primary}33`,
              gap: 10,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>
              請在系統設定中允許 Hyphen 發送通知，才能接收新工作提醒。
            </Text>
            <TouchableOpacity onPress={openSystemSettings} activeOpacity={0.85}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>前往系統設定</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
