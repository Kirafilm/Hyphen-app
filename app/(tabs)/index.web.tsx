import { ActivityIndicator, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/use-colors";
import { useJobsList } from "@/hooks/use-jobs-list";
import { categories } from "@/lib/mock-data";
import { formatJobSchedule } from "@/lib/job-schedule";
import { AppScreen } from "@/components/app-screen";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type JobItem = inferRouterOutputs<AppRouter>["jobs"]["list"][number];

function formatBudget(budget: { currency: string; min: number; max: number }) {
  const invalid =
    !Number.isFinite(budget.min) ||
    !Number.isFinite(budget.max) ||
    budget.min <= 0 ||
    budget.max <= 0 ||
    budget.max < budget.min;
  if (invalid) return `${budget.currency} $待確認`;
  return `${budget.currency} $${budget.min.toLocaleString()}-${budget.max.toLocaleString()}`;
}

function JobCard({
  item,
  colors,
  onPress,
}: {
  item: JobItem;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: "32%",
        minWidth: 280,
        flexGrow: 0,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
      }}
    >
      <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15, lineHeight: 22 }} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={{ marginTop: 10, gap: 4 }}>
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "800" }}>{formatBudget(item.budget)}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {item.category} · {item.location}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{formatJobSchedule(item)}</Text>
      </View>
      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: 12 }}>查看詳情</Text>
    </TouchableOpacity>
  );
}

export default function HomeWebScreen() {
  const router = useRouter();
  const colors = useColors();
  const jobsQuery = useJobsList();
  const jobs = jobsQuery.data ?? [];

  const featuredJobs = useMemo(() => jobs.slice(0, 3), [jobs]);
  const latestJobs = useMemo(() => jobs.slice(0, 12), [jobs]);
  const regionCount = useMemo(() => new Set(jobs.map((j) => j.location).filter(Boolean)).size || 1, [jobs]);

  return (
    <AppScreen
      webScroll
      refreshControl={<RefreshControl refreshing={jobsQuery.isFetching} onRefresh={() => void jobsQuery.refetch()} />}
    >
      <View style={{ width: "100%", paddingTop: 8 }}>
          <View style={{ flexDirection: "row", gap: 24, alignItems: "stretch" }}>
            <View style={{ flex: 2, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 28, gap: 16 }}>
              <View style={{ alignSelf: "flex-start", backgroundColor: `${colors.primary}18`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>Web 桌面優先體驗</Text>
              </View>
              <Text style={{ fontSize: 34, fontWeight: "800", color: colors.foreground, lineHeight: 42 }}>
                用桌面版更快搵自由工作，同時保留 App 發佈流程。
              </Text>
              <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 24 }}>
                在網頁瀏覽職缺、按分類搜尋；需要發佈或完整訂閱流程時，可繼續使用 iOS / Android App。
              </Text>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/jobs")}
                  style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 22 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>開始瀏覽職位</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/post")}
                  style={{ backgroundColor: colors.background, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 22, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>發佈新工作</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1, gap: 12 }}>
              {[
                { label: "最新職位", value: String(jobs.length) },
                { label: "熱門分類", value: String(categories.length) },
                { label: "服務地區", value: String(regionCount) },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, justifyContent: "center" }}
                >
                  <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>{stat.label}</Text>
                  <Text style={{ color: colors.foreground, fontSize: 32, fontWeight: "800", marginTop: 8 }}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 36 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: 16 }}>熱門分類</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {categories.slice(0, 8).map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => router.push({ pathname: "/(tabs)/jobs", params: { category: item } })}
                  style={{
                    width: "23%",
                    minWidth: 200,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 18,
                    paddingHorizontal: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600", textAlign: "center" }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 36 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: 16 }}>精選職位</Text>
            {jobsQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                {featuredJobs.map((item) => (
                  <JobCard key={item.id} item={item} colors={colors} onPress={() => router.push(`/job/${item.id}`)} />
                ))}
              </View>
            )}
          </View>

          <View style={{ marginTop: 36 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>最新職位</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>查看全部</Text>
              </TouchableOpacity>
            </View>
            {jobsQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                {latestJobs.map((item) => (
                  <JobCard key={item.id} item={item} colors={colors} onPress={() => router.push(`/job/${item.id}`)} />
                ))}
              </View>
            )}
          </View>
        </View>
    </AppScreen>
  );
}
