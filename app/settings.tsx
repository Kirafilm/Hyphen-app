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
import { ScreenScroll } from "@/components/screen-scroll";
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
  getMessageAlertsEnabledLocal,
  getNotificationPlatform,
  getStoredPushToken,
  isNativePushSupported,
  obtainExpoPushToken,
  requestNotificationPermissions,
  setJobAlertsEnabledLocal,
  setMessageAlertsEnabledLocal,
  setStoredPushToken,
} from "@/lib/notifications";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useLocale();
  const { isAuthenticated, logout } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [jobAlertsEnabled, setJobAlertsEnabled] = useState(true);
  const [messageAlertsEnabled, setMessageAlertsEnabled] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const hasHydratedFromServer = useRef(false);

  const utils = trpc.useUtils();
  const setJobAlertsMutation = trpc.notifications.setJobAlerts.useMutation();
  const setMessageAlertsMutation = trpc.notifications.setMessageAlerts.useMutation();
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
        const [localJobEnabled, localMessageEnabled] = await Promise.all([
          getJobAlertsEnabledLocal(),
          getMessageAlertsEnabledLocal(),
        ]);
        if (!cancelled) {
          setJobAlertsEnabled(localJobEnabled);
          setMessageAlertsEnabled(localMessageEnabled);
        }

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
    if (!settingsQuery.data.registered) return;
    setJobAlertsEnabled(settingsQuery.data.jobAlertsEnabled);
    setMessageAlertsEnabled(settingsQuery.data.messageAlertsEnabled);
    void setJobAlertsEnabledLocal(settingsQuery.data.jobAlertsEnabled);
    void setMessageAlertsEnabledLocal(settingsQuery.data.messageAlertsEnabled);
  }, [saving, settingsQuery.data]);

  const ensurePushTokenForEnable = useCallback(
    async (previousJob: boolean, previousMessage: boolean) => {
      let token = pushToken ?? (await getStoredPushToken());
      const granted = await requestNotificationPermissions();
      if (!granted) {
        setPermissionDenied(true);
        setJobAlertsEnabled(previousJob);
        setMessageAlertsEnabled(previousMessage);
        return null;
      }
      setPermissionDenied(false);
      token = token ?? (await obtainExpoPushToken());
      if (!token) {
        setJobAlertsEnabled(previousJob);
        setMessageAlertsEnabled(previousMessage);
        return null;
      }
      setPushToken(token);
      await setStoredPushToken(token);
      return token;
    },
    [pushToken],
  );

  const persistJobAlerts = useCallback(
    async (enabled: boolean) => {
      if (!isNativePushSupported() || saving) return;

      const previous = jobAlertsEnabled;
      setJobAlertsEnabled(enabled);
      setSaving(true);
      try {
        await setJobAlertsEnabledLocal(enabled);

        let token = pushToken ?? (await getStoredPushToken());

        if (enabled) {
          token = await ensurePushTokenForEnable(previous, messageAlertsEnabled);
          if (!token) {
            await setJobAlertsEnabledLocal(previous);
            setJobAlertsEnabled(previous);
            return;
          }
        }

        if (!token) return;

        await registerMutation.mutateAsync({
          expoPushToken: token,
          platform: getNotificationPlatform(),
          jobAlertsEnabled: enabled,
          messageAlertsEnabled,
        });
        await setJobAlertsMutation.mutateAsync({ expoPushToken: token, enabled });
        utils.notifications.getSettings.setData(
          { expoPushToken: token },
          { jobAlertsEnabled: enabled, messageAlertsEnabled, registered: true },
        );
      } catch (error) {
        console.warn("[Settings] job alerts toggle failed:", error);
        setJobAlertsEnabled(previous);
        await setJobAlertsEnabledLocal(previous);
      } finally {
        setSaving(false);
      }
    },
    [
      ensurePushTokenForEnable,
      jobAlertsEnabled,
      messageAlertsEnabled,
      pushToken,
      registerMutation,
      saving,
      setJobAlertsMutation,
      utils.notifications.getSettings,
    ],
  );

  const persistMessageAlerts = useCallback(
    async (enabled: boolean) => {
      if (!isNativePushSupported() || saving) return;

      const previous = messageAlertsEnabled;
      setMessageAlertsEnabled(enabled);
      setSaving(true);
      try {
        await setMessageAlertsEnabledLocal(enabled);

        let token = pushToken ?? (await getStoredPushToken());

        if (enabled) {
          token = await ensurePushTokenForEnable(jobAlertsEnabled, previous);
          if (!token) {
            await setMessageAlertsEnabledLocal(previous);
            setMessageAlertsEnabled(previous);
            return;
          }
        }

        if (!token) return;

        await registerMutation.mutateAsync({
          expoPushToken: token,
          platform: getNotificationPlatform(),
          jobAlertsEnabled,
          messageAlertsEnabled: enabled,
        });
        await setMessageAlertsMutation.mutateAsync({ expoPushToken: token, enabled });
        utils.notifications.getSettings.setData(
          { expoPushToken: token },
          { jobAlertsEnabled, messageAlertsEnabled: enabled, registered: true },
        );
      } catch (error) {
        console.warn("[Settings] message alerts toggle failed:", error);
        setMessageAlertsEnabled(previous);
        await setMessageAlertsEnabledLocal(previous);
      } finally {
        setSaving(false);
      }
    },
    [
      ensurePushTokenForEnable,
      jobAlertsEnabled,
      messageAlertsEnabled,
      pushToken,
      registerMutation,
      saving,
      setMessageAlertsMutation,
      utils.notifications.getSettings,
    ],
  );

  const openSystemSettings = () => {
    if (Platform.OS === "ios") {
      void Linking.openURL("app-settings:");
      return;
    }
    void Linking.openSettings();
  };

  const deleteAlertBodyKey =
    Platform.OS === "ios"
      ? "settings.deleteAlertBodyIos"
      : Platform.OS === "android"
        ? "settings.deleteAlertBodyAndroid"
        : "settings.deleteAlertBody";

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAlertTitle"),
      t(deleteAlertBodyKey),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.deleteAccount"),
          style: "destructive",
          onPress: () => {
            Alert.alert(t("settings.deleteConfirmTitle"), t("settings.deleteConfirmBody"), [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("settings.deleteConfirmAction"),
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
                      const message = error instanceof Error ? error.message : t("settings.deleteFailedTitle");
                      Alert.alert(t("settings.deleteFailedTitle"), message);
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
    { id: "light", label: t("settings.themeLight"), icon: "sunny" },
    { id: "dark", label: t("settings.themeDark"), icon: "moon" },
  ];

  return (
    <AppScreen>
      <PageHeader title={t("settings.title")} showBack />

      <ScreenScroll contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, paddingBottom: 40 }}>
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
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{t("settings.appearanceTitle")}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{t("settings.appearanceHint")}</Text>
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
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{t("settings.jobAlertsTitle")}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
                    {t("settings.jobAlertsHint")}
                  </Text>
                </View>
                <Switch
                  value={jobAlertsEnabled}
                  disabled={saving || !isNativePushSupported()}
                  onValueChange={persistJobAlerts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
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
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                    {t("settings.messageAlertsTitle")}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
                    {t("settings.messageAlertsHint")}
                  </Text>
                </View>
                <Switch
                  value={messageAlertsEnabled}
                  disabled={saving || !isNativePushSupported()}
                  onValueChange={persistMessageAlerts}
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
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{t("settings.accountTitle")}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
              {t("settings.accountDeleteHint")}
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
                {deleteAccountMutation.isPending ? t("settings.deleting") : t("settings.deleteAccount")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isNativePushSupported() && (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 16, lineHeight: 20 }}>
            {t("settings.pushNativeOnly")}
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
              {t("settings.permissionHint")}
            </Text>
            <TouchableOpacity onPress={openSystemSettings} activeOpacity={0.85}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("settings.openSystemSettings")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScreenScroll>
    </AppScreen>
  );
}
