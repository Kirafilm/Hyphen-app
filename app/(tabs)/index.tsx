import { ActivityIndicator, ScrollView, Text, View, TouchableOpacity, FlatList, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { categories } from "@/lib/mock-data";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const jobsQuery = trpc.jobs.list.useQuery();
  const latestJobs = useMemo(() => (jobsQuery.data ?? []).slice(0, 10), [jobsQuery.data]);

  const formatBudget = (budget: { currency: string; min: number; max: number }) => {
    const invalid =
      !Number.isFinite(budget.min) ||
      !Number.isFinite(budget.max) ||
      budget.min <= 0 ||
      budget.max <= 0 ||
      budget.max < budget.min;
    if (invalid) return `${budget.currency} $待確認`;
    return `${budget.currency} $${budget.min.toLocaleString()}-${budget.max.toLocaleString()}`;
  };

  const formatSchedule = (job: any) => {
    const dateTbd = Boolean(job?.workDateTbd);
    const timeTbd = Boolean(job?.workTimeTbd);
    const d = job?.workDate;
    const s = job?.workStartTime;
    const e = job?.workEndTime;
    if (dateTbd && timeTbd) return "日期未定／時間未定";
    if (dateTbd && s && e) return `日期未定 ${s}-${e}`;
    if (timeTbd && d) return `${d} 時間未定`;
    if (dateTbd) return "日期未定";
    if (timeTbd) return "時間未定";
    if (d && s && e) return `${d} ${s}-${e}`;
    return job?.timeline ?? "未指定";
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          {/* Header Section */}
          <View className="px-6 pt-10 pb-6">
            <View className="flex-row items-center gap-3">
              <Image
                source={require("../../assets/images/hyphen-mark.png")}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-foreground">Hyphen自由職</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="px-6 py-6 gap-3">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/jobs")}
                className="flex-1 bg-primary rounded-lg p-4 items-center justify-center active:opacity-80"
              >
                <Ionicons name="briefcase" size={24} color="white" />
                <Text className="text-white text-sm font-semibold mt-2">瀏覽職位</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/post")}
                className="flex-1 bg-surface rounded-lg p-4 items-center justify-center active:opacity-80 border border-border"
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
                <Text className="text-foreground text-sm font-semibold mt-2">發佈工作</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories */}
          <View className="px-6 py-4">
            <Text className="text-lg font-bold text-foreground mb-3">熱門分類</Text>
            <FlatList
              data={categories.slice(0, 6)}
              keyExtractor={(item) => item}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/jobs")}
                  className="flex-1 bg-surface rounded-lg p-3 items-center justify-center border border-border active:opacity-80"
                >
                  <Text className="text-foreground text-xs font-medium text-center">{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Featured Jobs */}
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">最新職位</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
                <Text className="text-primary font-semibold">查看全部</Text>
              </TouchableOpacity>
            </View>
            {jobsQuery.isLoading ? (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : latestJobs.length === 0 ? (
              <View className="py-6 items-center justify-center">
                <Text className="text-muted text-sm">暫時未有職位</Text>
              </View>
            ) : (
              <FlatList
                data={latestJobs}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => router.push(`/job/${item.id}`)}
                    className="bg-surface rounded-lg p-4 mb-3 border border-border active:opacity-80"
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold text-sm leading-tight" numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                          <Text className="text-primary font-bold text-xs">
                            {formatBudget(item.budget)}
                          </Text>
                          <Text className="text-muted text-xs">•</Text>
                          <Text className="text-muted text-xs">{item.category}</Text>
                          <Text className="text-muted text-xs">•</Text>
                          <Text className="text-muted text-xs">{item.location}</Text>
                          <Text className="text-muted text-xs">•</Text>
                          <Text className="text-muted text-xs">{formatSchedule(item)}</Text>
                        </View>
                      </View>
                      <View className="bg-primary rounded-full p-1">
                        <Ionicons name="briefcase" size={12} color="white" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
