import { ActivityIndicator, Alert, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import { formatJobSchedule } from "@/lib/job-schedule";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = meQuery.data?.role === "admin";
  const utils = trpc.useUtils();
  const invalidateJobs = async () => {
    await Promise.all([utils.jobs.list.invalidate(), utils.jobs.listForModeration.invalidate()]);
  };
  const removeMutation = trpc.jobs.remove.useMutation({
    onSuccess: async () => {
      await invalidateJobs();
      await utils.jobs.byId.invalidate({ id: id ?? "" });
      router.back();
    },
  });
  const deleteMutation = trpc.jobs.delete.useMutation({
    onSuccess: async () => {
      await invalidateJobs();
      router.back();
    },
  });

  const jobQuery = trpc.jobs.byId.useQuery(
    { id: id ?? "" },
    {
      enabled: Boolean(id),
    },
  );
  const job = jobQuery.data;

  const budgetText = useMemo(() => {
    if (!job) return "";
    const min = job.budget.min;
    const max = job.budget.max;
    const invalid = !Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0 || max < min;
    if (invalid) return `${job.budget.currency} $待確認`;
    return `${job.budget.currency} $${min.toLocaleString()}-${max.toLocaleString()}`;
  }, [job]);

  const scheduleDisplay = useMemo(() => formatJobSchedule(job ?? {}), [job]);

  const pad = screenPaddingHorizontal();

  if (jobQuery.isLoading) {
    return (
      <AppScreen>
        <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!job) {
    return (
      <AppScreen>
        <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={{ color: colors.foreground, fontWeight: "600", marginTop: 16 }}>職位未找到</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 24, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>返回</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <PageHeader
            title={job.title}
            subtitle={
              isAdmin && job.removedAt ? `${job.category} · 已下架` : job.category
            }
            showBack
          />

          <View style={{ paddingHorizontal: pad, paddingBottom: 24, gap: 24 }}>
            <View style={{ flexDirection: isWeb ? "row" : "column", gap: 16, alignItems: "stretch" }}>
            {/* Budget & Location */}
            <View style={{ flex: isWeb ? 1 : undefined, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>預算</Text>
                  <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18, marginTop: 4 }}>{budgetText}</Text>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>工作日期</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 15, marginTop: 4 }}>{scheduleDisplay}</Text>
                </View>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.location}</Text>
              </View>
            </View>

            <View style={{ flex: isWeb ? 1 : undefined, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>聯絡資訊</Text>
              {job.contactLocked ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="lock-closed" size={16} color={colors.muted} />
                    <Text style={{ color: colors.muted, fontSize: 14 }}>訂閱後才可查看電話與電郵</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => (isAuthenticated ? router.push({ pathname: "/paywall", params: { jobId: job.id } }) : router.push("/login"))}
                      style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ color: "white", fontWeight: "600" }}>立即訂閱</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/jobs")}
                      style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text style={{ color: colors.foreground, fontWeight: "600" }}>返回列表</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ gap: 8 }}>
                  {job.contact.person ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="person" size={16} color={colors.primary} />
                      <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.contact.person}</Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.contact.phone ?? "—"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="mail" size={16} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.contact.email ?? "—"}</Text>
                  </View>
                </View>
              )}
            </View>
            </View>

            {/* Description */}
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>工作描述</Text>
              <Text style={{ color: colors.foreground, lineHeight: 22 }}>{job.description}</Text>
            </View>

            {/* Skills */}
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>所需技能</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {job.skills.map((skill, index) => (
                  <View
                    key={index}
                    style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: `${colors.primary}33` }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "500", fontSize: 14 }}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA Buttons */}
            <View style={{ gap: 12, paddingBottom: 24 }}>
              <TouchableOpacity
                onPress={() => (job.contactLocked ? router.push({ pathname: "/paywall", params: { jobId: job.id } }) : null)}
                style={{ backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.primary }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>
                  {job.contactLocked ? "解鎖聯絡資訊" : "已解鎖聯絡資訊"}
                </Text>
              </TouchableOpacity>
              {isAdmin ? (
                <>
                  {!job.removedAt ? (
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert("下架工作", "下架後一般用户將看不到此工作。", [
                          { text: "取消", style: "cancel" },
                          {
                            text: "下架",
                            style: "destructive",
                            onPress: () => removeMutation.mutate({ id: job.id }),
                          },
                        ])
                      }
                      disabled={removeMutation.isPending || deleteMutation.isPending}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: "rgba(245, 158, 11, 0.12)",
                        borderRadius: 8,
                        paddingVertical: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "rgba(245, 158, 11, 0.25)",
                      }}
                    >
                      <Text style={{ color: "#d97706", fontWeight: "600", fontSize: 16 }}>
                        {removeMutation.isPending ? "下架中…" : "下架工作"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("永久刪除", "此操作無法復原，確定要永久刪除此工作嗎？", [
                        { text: "取消", style: "cancel" },
                        {
                          text: "刪除",
                          style: "destructive",
                          onPress: () => deleteMutation.mutate({ id: job.id }),
                        },
                      ])
                    }
                    disabled={removeMutation.isPending || deleteMutation.isPending}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.10)",
                      borderRadius: 8,
                      paddingVertical: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(239, 68, 68, 0.20)",
                    }}
                  >
                    <Text style={{ color: colors.error, fontWeight: "600", fontSize: 16 }}>
                      {deleteMutation.isPending ? "刪除中…" : "永久刪除"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
