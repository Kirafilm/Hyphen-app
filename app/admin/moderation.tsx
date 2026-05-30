import { useAuth } from "@/hooks/use-auth";
import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ModerationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();

  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = meQuery.data?.role === "admin";

  const jobsQuery = trpc.jobs.listForModeration.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();

  const invalidateJobs = async () => {
    await Promise.all([utils.jobs.list.invalidate(), utils.jobs.listForModeration.invalidate()]);
  };

  const removeMutation = trpc.jobs.remove.useMutation({
    onSuccess: invalidateJobs,
  });

  const deleteMutation = trpc.jobs.delete.useMutation({
    onSuccess: invalidateJobs,
  });

  const confirmRemove = (id: string) => {
    Alert.alert("下架工作", "下架後一般用户將看不到此工作，可在下方「已下架」區永久刪除。", [
      { text: "取消", style: "cancel" },
      { text: "下架", style: "destructive", onPress: () => removeMutation.mutate({ id }) },
    ]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("永久刪除", "此操作無法復原，確定要永久刪除此工作嗎？", [
      { text: "取消", style: "cancel" },
      { text: "刪除", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const activeJobs = (jobsQuery.data ?? []).filter((item) => !item.removedAt);
  const removedJobs = (jobsQuery.data ?? []).filter((item) => Boolean(item.removedAt));

  const renderJobCard = (item: (typeof activeJobs)[number], removed: boolean) => (
    <View
      key={item.id}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: removed ? "rgba(239, 68, 68, 0.20)" : colors.border,
        gap: 12,
        opacity: removed ? 0.85 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>{item.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{item.category}</Text>
          {removed ? (
            <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>已下架</Text>
          ) : null}
        </View>
        <View style={{ gap: 8 }}>
          {!removed ? (
            <TouchableOpacity
              onPress={() => confirmRemove(item.id)}
              disabled={removeMutation.isPending || deleteMutation.isPending}
              activeOpacity={0.85}
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.25)",
              }}
            >
              <Text style={{ color: "#d97706", fontWeight: "600", fontSize: 12 }}>下架</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => confirmDelete(item.id)}
            disabled={removeMutation.isPending || deleteMutation.isPending}
            activeOpacity={0.85}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.10)",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: "rgba(239, 68, 68, 0.20)",
            }}
          >
            <Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>刪除</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => router.push(`/job/${item.id}`)}
        activeOpacity={0.85}
        style={{
          backgroundColor: `${colors.primary}1A`,
          borderRadius: 8,
          paddingVertical: 12,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${colors.primary}33`,
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: "600" }}>查看</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <PageHeader title="內容管理" subtitle="下架隱藏工作，刪除則永久移除" showBack />

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 20 }}>
            {!isAdmin ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Ionicons name="lock-closed" size={40} color={colors.muted} />
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>需要管理員權限</Text>
              </View>
            ) : jobsQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>進行中 ({activeJobs.length})</Text>
                  {activeJobs.length === 0 ? (
                    <Text style={{ color: colors.muted, fontSize: 14 }}>沒有進行中的工作</Text>
                  ) : (
                    activeJobs.map((item) => renderJobCard(item, false))
                  )}
                </View>
                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>已下架 ({removedJobs.length})</Text>
                  {removedJobs.length === 0 ? (
                    <Text style={{ color: colors.muted, fontSize: 14 }}>沒有已下架的工作</Text>
                  ) : (
                    removedJobs.map((item) => renderJobCard(item, true))
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
