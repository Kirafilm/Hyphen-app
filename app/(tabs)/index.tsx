import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/use-colors";
import { useJobsList } from "@/hooks/use-jobs-list";
import { categories } from "@/lib/mock-data";
import { AppScreen } from "@/components/app-screen";
import { HyphenLogo } from "@/components/hyphen-logo";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const jobsQuery = useJobsList();
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
    <AppScreen>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={jobsQuery.isFetching} onRefresh={() => void jobsQuery.refetch()} />}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <HyphenLogo height={44} />
              <View>
                <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, lineHeight: 30 }}>Hyphen</Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.muted, marginTop: 2 }}>自由職</Text>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/jobs")}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="briefcase" size={24} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700", marginTop: 8 }}>瀏覽職位</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/post")}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700", marginTop: 8 }}>發佈工作</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginBottom: 12 }}>熱門分類</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {categories.slice(0, 6).map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => router.push("/(tabs)/jobs")}
                  activeOpacity={0.85}
                  style={{
                    width: "48%",
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", textAlign: "center" }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>最新職位</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")} activeOpacity={0.85}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>查看全部</Text>
              </TouchableOpacity>
            </View>

            {jobsQuery.isLoading ? (
              <View style={{ paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : latestJobs.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>暫時未有職位</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {latestJobs.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/job/${item.id}`)}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8, gap: 6 }}>
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{formatBudget(item.budget)}</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>•</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>{item.category}</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>•</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>{item.location}</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>•</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>{formatSchedule(item)}</Text>
                        </View>
                      </View>
                      <View
                        style={{
                          backgroundColor: colors.primary,
                          borderRadius: 999,
                          width: 24,
                          height: 24,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="briefcase" size={12} color="#ffffff" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
    </AppScreen>
  );
}
