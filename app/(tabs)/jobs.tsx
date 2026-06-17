import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import { useJobsList } from "@/hooks/use-jobs-list";
import { categories, jobLocations } from "@/lib/mock-data";
import { formatJobSchedule } from "@/lib/job-schedule";
import { formatPublishedDate } from "@/lib/utils";
import { screenPaddingHorizontal, useWebLayout } from "@/lib/web-layout";

export default function JobsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDesktopWeb } = useWebLayout();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [selectedLocation, setSelectedLocation] = useState<string>("全部");

  useEffect(() => {
    if (typeof categoryParam !== "string" || !categoryParam) return;
    if (categoryParam === "全部" || categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const jobsQuery = useJobsList();
  const jobs = jobsQuery.data ?? [];
  const locationOptions = useMemo(() => {
    const extra = jobs
      .map((job) => job.location)
      .filter((loc) => loc && !jobLocations.includes(loc));
    return ["全部", ...jobLocations, ...Array.from(new Set(extra)).sort()];
  }, [jobs]);
  const normalizedQuery = searchText.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const categoryMatch = selectedCategory === "全部" ? true : job.category === selectedCategory;
    const locationMatch = selectedLocation === "全部" ? true : job.location === selectedLocation;
    if (!categoryMatch || !locationMatch) return false;
    if (!normalizedQuery) return true;
    return (
      job.title.toLowerCase().includes(normalizedQuery) ||
      job.category.toLowerCase().includes(normalizedQuery) ||
      job.location.toLowerCase().includes(normalizedQuery)
    );
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

  const pad = screenPaddingHorizontal();
  const refreshControl = (
    <RefreshControl refreshing={jobsQuery.isFetching} onRefresh={() => void jobsQuery.refetch()} />
  );
  const chipRowStyle = { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 };
  const categoryChips = ["全部", ...categories].map((cat) => {
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
  });
  const locationChips = locationOptions.map((loc) => {
    const active = loc === selectedLocation;
    return (
      <TouchableOpacity
        key={loc}
        onPress={() => setSelectedLocation(loc)}
        activeOpacity={0.85}
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: active ? colors.primary : colors.surface,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        {loc !== "全部" ? <Ionicons name="location-outline" size={12} color={active ? "#ffffff" : colors.muted} /> : null}
        <Text style={{ color: active ? "#ffffff" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{loc}</Text>
      </TouchableOpacity>
    );
  });

  const pageContent = (
    <>
      <PageHeader title="職位" subtitle={isDesktopWeb ? "按分類、地區或關鍵字搜尋自由工作" : undefined} />
      <View style={{ paddingHorizontal: pad, paddingBottom: 12, gap: 12 }}>
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
        {isDesktopWeb ? (
          <View style={chipRowStyle}>{categoryChips}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categoryChips}
          </ScrollView>
        )}
        {isDesktopWeb ? (
          <View style={chipRowStyle}>{locationChips}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {locationChips}
          </ScrollView>
        )}
      </View>

      <View style={{ paddingHorizontal: pad, paddingTop: 4 }}>
        {jobsQuery.isError ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 8 }}>
            <Ionicons name="cloud-offline" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>無法載入職位</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>
              {jobsQuery.error.message.includes("timed out") || jobsQuery.error.message.includes("Network")
                ? "API 連線失敗，請下拉重新整理"
                : jobsQuery.error.message}
            </Text>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
            <Ionicons name="search" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 16 }}>找不到相關職位</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>試試其他搜尋條件</Text>
          </View>
        ) : (
          <View style={{ flexDirection: isDesktopWeb ? "row" : "column", flexWrap: isDesktopWeb ? "wrap" : "nowrap", gap: 16 }}>
            {filteredJobs.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/job/${item.id}`)}
                activeOpacity={0.85}
                style={{
                  flexGrow: isDesktopWeb ? 1 : 0,
                  flexBasis: isDesktopWeb ? "48%" : "auto",
                  minWidth: isDesktopWeb ? 320 : undefined,
                  maxWidth: isDesktopWeb ? "100%" : undefined,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 18,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700", lineHeight: 20 }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={{ marginTop: 8, gap: 4 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{formatBudget(item.budget)}</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>•</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>{item.category}</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>•</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>{item.location}</Text>
                      </View>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{formatJobSchedule(item)}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>發佈日期：{formatPublishedDate(item.createdAt)}</Text>
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
      </View>
    </>
  );

  return (
    <AppScreen refreshControl={refreshControl} contentContainerStyle={{ paddingBottom: 32 }}>
      {pageContent}
    </AppScreen>
  );
}
