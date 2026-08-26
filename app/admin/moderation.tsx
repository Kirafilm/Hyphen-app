import { useAuth } from "@/hooks/use-auth";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Platform, Text, TouchableOpacity, View } from "react-native";

function confirmAction(title: string, body: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.confirm(`${title}\n\n${body}`)) onConfirm();
    return;
  }
  Alert.alert(title, body, [
    { text: "取消", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}

export default function ModerationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();

  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = meQuery.data?.role === "admin";

  const jobsQuery = trpc.jobs.listForModeration.useQuery(undefined, { enabled: isAdmin });
  const profilesQuery = trpc.serviceProfiles.listForModeration.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();

  const invalidateJobs = async () => {
    await Promise.all([utils.jobs.list.invalidate(), utils.jobs.listForModeration.invalidate()]);
  };

  const invalidateProfiles = async () => {
    await Promise.all([
      utils.serviceProfiles.listForModeration.invalidate(),
      utils.serviceProfiles.listPublished.invalidate(),
    ]);
  };

  const removeMutation = trpc.jobs.remove.useMutation({
    onSuccess: invalidateJobs,
  });

  const deleteMutation = trpc.jobs.delete.useMutation({
    onSuccess: invalidateJobs,
  });

  const deleteProfileMutation = trpc.serviceProfiles.adminDelete.useMutation({
    onSuccess: invalidateProfiles,
  });

  const confirmRemove = (id: string) => {
    confirmAction("下架工作", "下架後一般用户將看不到此工作，可在下方「已下架」區永久刪除。", "下架", () =>
      removeMutation.mutate({ id }),
    );
  };

  const confirmDelete = (id: string) => {
    confirmAction("永久刪除", "此操作無法復原，確定要永久刪除此工作嗎？", "刪除", () =>
      deleteMutation.mutate({ id }),
    );
  };

  const confirmDeleteProfile = (userId: number, headline: string) => {
    confirmAction(
      "移除專業頁",
      `確定永久移除「${headline || "未命名"}」？此操作無法復原，用於處理不雅或違規內容。`,
      "移除",
      () => deleteProfileMutation.mutate({ userId }),
    );
  };

  const activeJobs = (jobsQuery.data ?? []).filter((item) => !item.removedAt);
  const removedJobs = (jobsQuery.data ?? []).filter((item) => Boolean(item.removedAt));
  const profiles = profilesQuery.data ?? [];

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

  const renderProfileCard = (item: (typeof profiles)[number]) => (
    <View
      key={item.userId}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>{item.headline || "未命名"}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>/pro/{item.slug}</Text>
          <Text style={{ color: item.isPublished ? colors.primary : colors.muted, fontSize: 12, fontWeight: "600" }}>
            {item.isPublished ? "已公開" : "未公開"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmDeleteProfile(item.userId, item.headline)}
          disabled={deleteProfileMutation.isPending}
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
          <Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>移除</Text>
        </TouchableOpacity>
      </View>
      {item.isPublished ? (
        <TouchableOpacity
          onPress={() => router.push(`/pro/${item.slug}` as never)}
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
      ) : null}
    </View>
  );

  const loading = jobsQuery.isLoading || profilesQuery.isLoading;

  return (
    <AppScreen>
      <ScreenScroll contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <PageHeader title="內容管理" subtitle="管理工作發佈與專業頁，防止違規內容" showBack />

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 28 }}>
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
            ) : loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                    專業頁 ({profiles.length})
                  </Text>
                  {profiles.length === 0 ? (
                    <Text style={{ color: colors.muted, fontSize: 14 }}>沒有專業頁</Text>
                  ) : (
                    profiles.map((item) => renderProfileCard(item))
                  )}
                </View>

                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                    進行中工作 ({activeJobs.length})
                  </Text>
                  {activeJobs.length === 0 ? (
                    <Text style={{ color: colors.muted, fontSize: 14 }}>沒有進行中的工作</Text>
                  ) : (
                    activeJobs.map((item) => renderJobCard(item, false))
                  )}
                </View>
                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
                    已下架工作 ({removedJobs.length})
                  </Text>
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
      </ScreenScroll>
    </AppScreen>
  );
}
