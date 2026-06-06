import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useSubscriptionSyncOnFocus } from "@/components/subscription-sync-bootstrap";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const subscriptionQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const syncSubscriptionOnFocus = useSubscriptionSyncOnFocus();
  const role = meQuery.data?.role ?? "user";

  useFocusEffect(
    useCallback(() => {
      void syncSubscriptionOnFocus();
    }, [syncSubscriptionOnFocus]),
  );

  const MenuRow = ({ icon, label, onPress, accent, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; accent?: string; danger?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: danger ? "rgba(239, 68, 68, 0.10)" : colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: danger ? "rgba(239, 68, 68, 0.20)" : colors.border,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexBasis: isWeb ? "48%" : "auto",
        minWidth: isWeb ? 280 : undefined,
        flexGrow: isWeb ? 1 : 0,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : accent ?? colors.primary} />
        <Text style={{ color: danger ? colors.error : colors.foreground, fontSize: 15, fontWeight: "700" }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={danger ? colors.error : colors.muted} />
    </TouchableOpacity>
  );

  const pad = screenPaddingHorizontal();

  const promoPoints = [
    { icon: "mail-outline" as const, text: "沒有繁複的認證，經電郵註冊即可使用。" },
    { icon: "shield-checkmark-outline" as const, text: "不收集任何私隱資料。" },
    { icon: "eye-outline" as const, text: "有專人監督所有發佈，防止垃圾內容。" },
  ];

  const PromoBox = () => (
    <View
      style={{
        flex: isWeb ? 1 : undefined,
        backgroundColor: colors.surface,
        borderRadius: isWeb ? 24 : 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: isWeb ? 28 : 20,
        gap: 16,
        maxWidth: isWeb ? undefined : 560,
        alignSelf: isWeb ? "stretch" : "center",
        width: isWeb ? undefined : "100%",
      }}
    >
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: `${colors.primary}18`,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>平台承諾</Text>
      </View>
      <Text style={{ color: colors.foreground, fontSize: isWeb ? 22 : 18, fontWeight: "800", lineHeight: isWeb ? 30 : 26 }}>
        簡單、安全、可信賴
      </Text>
      <View style={{ gap: 14 }}>
        {promoPoints.map((point) => (
          <View key={point.text} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: `${colors.primary}14`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={point.icon} size={18} color={colors.primary} />
            </View>
            <Text style={{ flex: 1, color: colors.muted, fontSize: 14, lineHeight: 22 }}>{point.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <AppScreen>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <PageHeader title="個人" subtitle={isWeb ? "管理帳戶、訂閱與設定" : undefined} />

          <View
            style={{
              paddingHorizontal: pad,
              paddingBottom: 16,
              flexDirection: isWeb ? "row" : "column",
              gap: isWeb ? 24 : 16,
              maxWidth: isWeb ? 960 : undefined,
              alignSelf: isWeb ? "center" : "stretch",
              width: isWeb ? "100%" : undefined,
              alignItems: "stretch",
            }}
          >
            <View
              style={{
                flex: isWeb ? 1.2 : undefined,
                backgroundColor: colors.surface,
                borderRadius: isWeb ? 24 : 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 24,
                maxWidth: isWeb ? undefined : 560,
                alignSelf: isWeb ? "stretch" : "center",
                width: isWeb ? undefined : "100%",
              }}
            >
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 30, fontWeight: "800" }}>{(user?.name?.charAt(0) || "U").toUpperCase()}</Text>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>{isAuthenticated ? user?.name || "未命名用戶" : "未登入"}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>{isAuthenticated ? user?.email || "" : "登入後可管理訂閱與內容"}</Text>
              </View>

              <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
                {isAuthenticated ? (subscriptionQuery.data?.active ? "已訂閱，可查看聯絡資訊" : "未訂閱，只可查看工作內容") : "請先登入"}
              </Text>
            </View>

            <PromoBox />
          </View>

          <View
            style={{
              paddingHorizontal: pad,
              gap: 10,
              flexDirection: isWeb ? "row" : "column",
              flexWrap: isWeb ? "wrap" : "nowrap",
              maxWidth: isWeb ? 720 : undefined,
              alignSelf: isWeb ? "center" : "stretch",
              width: isWeb ? "100%" : undefined,
            }}
          >
            {!isAuthenticated ? (
              <TouchableOpacity
                onPress={() => router.push("/login")}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexBasis: isWeb ? "100%" : "auto",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Ionicons name="log-in" size={20} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}>登入 / 註冊</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <MenuRow icon="card" label="訂閱與付款" onPress={() => router.push("/paywall")} />
            )}

            <MenuRow icon="settings" label="設定" onPress={() => router.push("/settings")} />
            <MenuRow icon="document-text" label="私隱條款" onPress={() => router.push("/privacy")} />
            <MenuRow icon="document-text" label="使用條款" onPress={() => router.push("/terms")} />
            <MenuRow icon="chatbubbles" label="聯絡我們" onPress={() => router.push("/contact")} />

            {role === "admin" && <MenuRow icon="shield-checkmark" label="管理：清理垃圾內容" onPress={() => router.push("/admin/moderation")} />}
            {isAuthenticated && <MenuRow icon="log-out" label="登出" onPress={() => logout()} danger />}
          </View>

          <View style={{ paddingHorizontal: pad, paddingTop: 24 }}>
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>© Hyphen - All Rights Reserved</Text>
          </View>
        </ScrollView>
    </AppScreen>
  );
}
