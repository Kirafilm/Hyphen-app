import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const subscriptionQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const role = meQuery.data?.role ?? "user";

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
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : accent ?? colors.primary} />
        <Text style={{ color: danger ? colors.error : colors.foreground, fontSize: 15, fontWeight: "700" }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={danger ? colors.error : colors.muted} />
    </TouchableOpacity>
  );

  return (
    <AppScreen>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <PageHeader title="個人" />

          <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 24,
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
          </View>

          <View style={{ paddingHorizontal: 24, gap: 10 }}>
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

          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>© Hyphen - All Rights Reserved</Text>
          </View>
        </ScrollView>
    </AppScreen>
  );
}
