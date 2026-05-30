import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import { useJobsList } from "@/hooks/use-jobs-list";
import { categories } from "@/lib/mock-data";

export default function JobsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");

  const jobsQuery = useJobsList();
  const jobs = jobsQuery.data ?? [];
  const normalizedQuery = searchText.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const categoryMatch = selectedCategory === "全部" ? true : job.category === selectedCategory;
    if (!categoryMatch) return false;
    if (!normalizedQuery) return true;
    return job.title.toLowerCase().includes(normalizedQuery) || job.category.toLowerCase().includes(normalizedQuery);
  });

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
      <PageHeader title="職位" />
      <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="搜尋職位..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
            style={{ flex: 1, color: colors.foreground, fontSize: 14 }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {["全部", ...categories].map((cat) => {
            const active = cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.85}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: active ? "#ffffff" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={jobsQuery.isFetching} onRefresh={() => void jobsQuery.refetch()} />}
      >
          {filteredJobs.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
              <Ionicons name="search" size={48} color={colors.muted} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 16 }}>找不到相關職位</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>試試其他搜尋條件</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredJobs.map((item) => (
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
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700", lineHeight: 20 }} numberOfLines={2}>
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
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                        {item.skills.slice(0, 2).map((skill, index) => (
                          <View
                            key={index}
                            style={{
                              backgroundColor: "rgba(124, 103, 255, 0.10)",
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: colors.primary,
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
      </ScrollView>
    </AppScreen>
  );
}
