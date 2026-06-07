import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { getSupabase } from "@/lib/supabase";
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
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated, logout } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [jobAlertsEnabled, setJobAlertsEnabled] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const hasHydratedFromServer = useRef(false);

  const utils = trpc.useUtils();
  const setJobAlertsMutation = trpc.notifications.setJobAlerts.useMutation();
  const registerMutation = trpc.notifications.register.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();
  const settingsQuery = trpc.notifications.getSettings.useQuery(
    { expoPushToken: pushToken ?? "" },
    { enabled: Boolean(pushToken) },
  );

  const refreshPushToken = useCallback(async () => {
    if (!isNativePushSupported()) return null;

    const granted = await requestNotificationPermissions();
    setPermissionDenied(!granted);

    const token = (await getStoredPushToken()) ?? (granted ? await obtainExpoPushToken() : null);
    if (token) {
      await setStoredPushToken(token);
      setPushToken(token);
    }
    return token;
  }, []);

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

        await refreshPushToken();
      } catch (error) {
        console.warn("[Settings] bootstrap failed:", error);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshPushToken]);

  useEffect(() => {
    if (!isNativePushSupported()) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refreshPushToken();
      }
    });
    return () => sub.remove();
  }, [refreshPushToken]);

  useEffect(() => {
    if (!settingsQuery.data || hasHydratedFromServer.current || saving) return;
    hasHydratedFromServer.current = true;
    setJobAlertsEnabled(settingsQuery.data.jobAlertsEnabled);
    void setJobAlertsEnabledLocal(settingsQuery.data.jobAlertsEnabled);
  }, [saving, settingsQuery.data]);

  const handleToggleJobAlerts = useCallback(
    async (enabled: boolean) => {
      if (!isNativePushSupported() || saving) return;

      const previous = jobAlertsEnabled;
      setJobAlertsEnabled(enabled);
      setSaving(true);
      try {
        let token = pushToken ?? (await getStoredPushToken());

        if (enabled) {
          const granted = await requestNotificationPermissions();
          if (!granted) {
            setPermissionDenied(true);
            setJobAlertsEnabled(previous);
            return;
          }
          setPermissionDenied(false);

          token = token ?? (await obtainExpoPushToken());
          if (!token) {
            setJobAlertsEnabled(previous);
            return;
          }
          setPushToken(token);
          await setStoredPushToken(token);
        }

        if (!token) {
          setJobAlertsEnabled(previous);
          return;
        }

        await setJobAlertsEnabledLocal(enabled);
        await registerMutation.mutateAsync({
          expoPushToken: token,
          platform: getNotificationPlatform(),
          jobAlertsEnabled: enabled,
        });
        await setJobAlertsMutation.mutateAsync({ expoPushToken: token, enabled });
        utils.notifications.getSettings.setData(
          { expoPushToken: token },
          { jobAlertsEnabled: enabled, registered: true },
        );
      } catch (error) {
        console.warn("[Settings] toggle failed:", error);
        setJobAlertsEnabled(previous);
        await setJobAlertsEnabledLocal(previous);
      } finally {
        setSaving(false);
      }
    },
    [jobAlertsEnabled, pushToken, registerMutation, saving, setJobAlertsMutation, utils.notifications.getSettings],
  );

  const openSystemSettings = () => {
    if (Platform.OS === "ios") {
      void Linking.openURL("app-settings:");
      return;
    }
    void Linking.openSettings();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "刪除帳戶",
      "此操作無法復原。你的帳戶、已發佈工作及訂閱紀錄將被永久刪除。進行中的 App Store / Google Play 訂閱請先在商店設定中取消。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "刪除帳戶",
          style: "destructive",
          onPress: () => {
            Alert.alert("確認刪除", "確定要永久刪除此帳戶？", [
              { text: "取消", style: "cancel" },
              {
                text: "確定刪除",
                style: "destructive",
                onPress: () => {
                  void (async () => {
                    try {
                      await deleteAccountMutation.mutateAsync();
                      try {
                        await getSupabase().auth.signOut();
                      } catch (signOutError) {
                        console.warn("[Settings] Supabase signOut after delete:", signOutError);
                      }
                      await logout();
                      utils.invalidate();
                      router.replace("/login");
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "刪除帳戶失敗";
                      Alert.alert("無法刪除帳戶", message);
                    }
                  })();
                },
              },
            ]);
          },
        },
      ],
    );
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

        {isAuthenticated ? (
          <View
            style={{
              marginTop: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              gap: 10,
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>帳戶</Text>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
              刪除帳戶會永久移除你的個人資料及已發佈工作，此操作無法復原。
            </Text>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              activeOpacity={0.85}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.error,
              }}
            >
              <Text style={{ color: colors.error, fontWeight: "700", fontSize: 14 }}>
                {deleteAccountMutation.isPending ? "刪除中…" : "刪除帳戶"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
