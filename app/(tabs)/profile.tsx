import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const subscriptionQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const role = meQuery.data?.role ?? "user";

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          {/* Header Background */}
          <View className="bg-primary h-24" />

          {/* Profile Card */}
          <View className="px-6 -mt-12 pb-6">
            <View className="bg-surface rounded-lg p-6 border border-border">
              {/* Avatar */}
              <View className="items-center mb-4">
                <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
                  <Text className="text-white text-3xl font-bold">
                    {(user?.name?.charAt(0) || "U").toUpperCase()}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-foreground">
                  {isAuthenticated ? user?.name || "未命名用戶" : "未登入"}
                </Text>
                <Text className="text-muted text-sm mt-2">{isAuthenticated ? user?.email || "" : "登入後可管理訂閱與內容"}</Text>
              </View>

              {/* Bio */}
              <Text className="text-muted text-sm text-center leading-relaxed">
                {isAuthenticated
                  ? subscriptionQuery.data?.active
                    ? "已訂閱，可查看聯絡資訊"
                    : "未訂閱，只可查看工作內容"
                  : "請先登入"}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <View className="px-6 py-4 gap-2">
            {!isAuthenticated ? (
              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="bg-primary rounded-lg p-4 flex-row items-center justify-between active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="log-in" size={20} color="white" />
                  <Text className="text-white font-medium">登入 / 註冊</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/paywall")}
                className="bg-surface rounded-lg p-4 flex-row items-center justify-between border border-border active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="card" size={20} color={colors.primary} />
                  <Text className="text-foreground font-medium">訂閱與付款</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            )}

            <TouchableOpacity className="bg-surface rounded-lg p-4 flex-row items-center justify-between border border-border active:opacity-80">
              <View className="flex-row items-center gap-3">
                <Ionicons name="settings" size={20} color={colors.primary} />
                <Text className="text-foreground font-medium">設定</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/privacy")}
              className="bg-surface rounded-lg p-4 flex-row items-center justify-between border border-border active:opacity-80"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text className="text-foreground font-medium">私隱條款</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/terms")}
              className="bg-surface rounded-lg p-4 flex-row items-center justify-between border border-border active:opacity-80"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text className="text-foreground font-medium">使用條款</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/contact")}
              className="bg-surface rounded-lg p-4 flex-row items-center justify-between border border-border active:opacity-80"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="chatbubbles" size={20} color={colors.primary} />
                <Text className="text-foreground font-medium">聯絡我們</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>

            {role === "admin" && (
              <TouchableOpacity
                onPress={() => router.push("/admin/moderation")}
                className="bg-primary bg-opacity-10 rounded-lg p-4 flex-row items-center justify-between border border-primary border-opacity-20 active:opacity-80 mt-4"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                  <Text className="text-foreground font-medium">管理：清理垃圾內容</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            )}

            {isAuthenticated && (
              <TouchableOpacity
                onPress={() => logout()}
                className="bg-error bg-opacity-10 rounded-lg p-4 flex-row items-center justify-between border border-error border-opacity-20 active:opacity-80 mt-4"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="log-out" size={20} color={colors.error} />
                  <Text className="text-error font-medium">登出</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          <View className="px-6 pt-4 pb-10">
            <Text className="text-muted text-xs text-center">© Hyphen - All Rights Reserved</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
