import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trpc } from "@/lib/trpc";
import { screenPaddingHorizontal } from "@/lib/web-layout";

function notify(title: string, body: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(body ? `${title}\n\n${body}` : title);
    return;
  }
  const { Alert } = require("react-native") as typeof import("react-native");
  Alert.alert(title, body);
}

function confirmDelete(message: string): Promise<boolean> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    const { Alert } = require("react-native") as typeof import("react-native");
    Alert.alert("", message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export default function MessagesInboxScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const pad = screenPaddingHorizontal();
  const utils = trpc.useUtils();

  const threadsQuery = trpc.serviceMessages.listThreads.useQuery(undefined, { enabled: isAuthenticated });
  const deleteMutation = trpc.serviceMessages.deleteThread.useMutation({
    onSuccess: async () => {
      await utils.serviceMessages.listThreads.invalidate();
    },
    onError: (err) => {
      notify(t("messages.deleteErrorTitle"), err.message);
    },
  });

  const handleDelete = async (threadId: string) => {
    const ok = await confirmDelete(t("messages.deleteConfirm"));
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ threadId });
    } catch {
      /* onError already notifies */
    }
  };

  if (!isAuthenticated) {
    return (
      <AppScreen>
        <PageHeader title={t("messages.title")} />
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.muted, marginBottom: 16 }}>{t("messages.loginRequired")}</Text>
          <TouchableOpacity onPress={() => router.push("/login")} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{t("profile.guestCta")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenScroll contentContainerStyle={{ paddingBottom: 32 }}>
        <PageHeader title={t("messages.title")} subtitle={t("messages.subtitle")} />

        <View style={{ paddingHorizontal: pad, gap: 10, maxWidth: 720, width: "100%", alignSelf: "center" }}>
          {threadsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (threadsQuery.data?.length ?? 0) === 0 ? (
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 24 }}>{t("messages.empty")}</Text>
          ) : (
            threadsQuery.data?.map((thread) => (
              <View
                key={thread.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/messages/${thread.id}` as never)}
                  activeOpacity={0.85}
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                >
                  <View style={{ flex: 1, gap: 4, paddingRight: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 15 }}>{thread.otherDisplayName}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {thread.role === "provider" ? t("messages.roleProvider") : t("messages.roleVisitor")}
                      {thread.profileSlug ? ` · /pro/${thread.profileSlug}` : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(thread.id)}
                  disabled={deleteMutation.isPending}
                  accessibilityLabel={t("messages.deleteCta")}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
