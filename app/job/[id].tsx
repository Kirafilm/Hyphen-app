import { ActivityIndicator, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();

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

  const scheduleText = useMemo(() => {
    if (!job) return "";
    if (job.workDateTbd && job.workTimeTbd) return "日期未定／時間未定";
    if (job.workDateTbd && job.workStartTime && job.workEndTime) return `日期未定 ${job.workStartTime}-${job.workEndTime}`;
    if (job.workTimeTbd && job.workDate) return `${job.workDate} 時間未定`;
    if (job.workDateTbd) return "日期未定";
    if (job.workTimeTbd) return "時間未定";
    if (job.workDate && job.workStartTime && job.workEndTime) return `${job.workDate} ${job.workStartTime}-${job.workEndTime}`;
    return job.timeline || "未指定";
  }, [job]);

  if (jobQuery.isLoading) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!job) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text className="text-foreground font-semibold mt-4">職位未找到</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">返回</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          {/* Header */}
          <View className="bg-primary px-6 py-6 gap-2">
            <TouchableOpacity onPress={() => router.back()} className="w-8 h-8">
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-background mt-2">{job.title}</Text>
          </View>

          {/* Content */}
          <View className="px-6 py-6 gap-6">
            {/* Budget & Location */}
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-muted text-xs">預算</Text>
                  <Text className="text-primary font-bold text-lg">{budgetText}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-muted text-xs">工作日期及時間</Text>
                  <Text className="text-foreground font-semibold">{scheduleText}</Text>
                </View>
              </View>
              <View className="border-t border-border pt-3 flex-row items-center gap-2">
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text className="text-foreground font-medium">{job.location}</Text>
              </View>
            </View>

            {/* Client Info */}
            <View>
              <Text className="text-lg font-bold text-foreground mb-3">客戶信息</Text>
              <View className="bg-surface rounded-lg p-4 border border-border flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                  <Text className="text-white font-bold">{job.clientName.charAt(0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{job.clientName}</Text>
                  <Text className="text-muted text-xs mt-1">{job.category}</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <View>
              <Text className="text-lg font-bold text-foreground mb-3">工作描述</Text>
              <Text className="text-foreground leading-relaxed">{job.description}</Text>
            </View>

            {/* Skills */}
            <View>
              <Text className="text-lg font-bold text-foreground mb-3">所需技能</Text>
              <View className="flex-row flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <View
                    key={index}
                    className="bg-primary bg-opacity-10 rounded-full px-4 py-2 border border-primary border-opacity-20"
                  >
                    <Text className="text-primary font-medium text-sm">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <Text className="text-lg font-bold text-foreground">聯絡資訊</Text>
              {job.contactLocked ? (
                <>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="lock-closed" size={16} color={colors.muted} />
                    <Text className="text-muted text-sm">訂閱後才可查看電話與電郵</Text>
                  </View>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => (isAuthenticated ? router.push({ pathname: "/paywall", params: { jobId: job.id } }) : router.push("/login"))}
                      className="flex-1 bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
                    >
                      <Text className="text-white font-semibold">立即訂閱</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/jobs")}
                      className="flex-1 bg-surface rounded-lg py-3 items-center justify-center border border-border active:opacity-80"
                    >
                      <Text className="text-foreground font-semibold">返回列表</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View className="gap-2">
                  {job.contact.person ? (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="person" size={16} color={colors.primary} />
                      <Text className="text-foreground font-medium">{job.contact.person}</Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text className="text-foreground font-medium">{job.contact.phone ?? "—"}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="mail" size={16} color={colors.primary} />
                    <Text className="text-foreground font-medium">{job.contact.email ?? "—"}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* CTA Buttons */}
            <View className="gap-3 pb-6">
              <TouchableOpacity
                onPress={() => (job.contactLocked ? router.push({ pathname: "/paywall", params: { jobId: job.id } }) : null)}
                className="bg-surface rounded-lg py-4 items-center justify-center border border-primary active:opacity-80"
              >
                <Text className="text-primary font-semibold text-base">
                  {job.contactLocked ? "解鎖聯絡資訊" : "已解鎖聯絡資訊"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
