import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";

import { AppScreen } from "@/components/app-screen";
import { AdSenseBanner } from "@/components/adsense-banner";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { useColors } from "@/hooks/use-colors";
import { useJobsList } from "@/hooks/use-jobs-list";
import { categories, jobLocations } from "@/lib/mock-data";
import { isJobLocation, formatJobBudget } from "@/lib/job-locations";
import { translateCategory, translateLocation } from "@/lib/i18n/helpers";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatJobSchedule } from "@/lib/job-schedule";
import { formatPublishedDate } from "@/lib/utils";
import { screenPaddingHorizontal, useWebLayout } from "@/lib/web-layout";

export default function JobsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDesktopWeb } = useWebLayout();
  const { t, messages, locale } = useLocale();
  const allLabel = t("common.all");
  const isAll = (value: string) => value === allLabel || value === "全部" || value === "All";
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(allLabel);
  const [selectedLocation, setSelectedLocation] = useState<string>(allLabel);

  useEffect(() => {
    if (typeof categoryParam !== "string" || !categoryParam) return;
    if (categoryParam === allLabel || categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam === allLabel ? allLabel : categoryParam);
    }
  }, [categoryParam, allLabel]);

  useEffect(() => {
    setSelectedCategory((prev) => (isAll(prev) ? allLabel : prev));
    setSelectedLocation((prev) => (isAll(prev) ? allLabel : prev));
  }, [locale, allLabel]);

  const jobsQuery = useJobsList();
  const jobs = jobsQuery.data ?? [];
  const locationOptions = useMemo(() => {
    const extra = jobs
      .map((job) => job.location)
      .filter((loc) => loc && !isJobLocation(loc));
    return [allLabel, ...jobLocations, ...Array.from(new Set(extra)).sort()];
  }, [jobs, allLabel]);
  const normalizedQuery = searchText.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const categoryMatch = isAll(selectedCategory) ? true : job.category === selectedCategory;
    const locationMatch = isAll(selectedLocation) ? true : job.location === selectedLocation;
    if (!categoryMatch || !locationMatch) return false;
    if (!normalizedQuery) return true;
    return (
      job.title.toLowerCase().includes(normalizedQuery) ||
      job.category.toLowerCase().includes(normalizedQuery) ||
      job.location.toLowerCase().includes(normalizedQuery)
    );
  });

  const formatBudget = (budget: { currency: string; min: number; max: number }) =>
    formatJobBudget(budget, { pendingLabel: t("jobDetail.budgetPending") });

  const pad = screenPaddingHorizontal();
  const refreshControl = (
    <RefreshControl refreshing={jobsQuery.isFetching} onRefresh={() => void jobsQuery.refetch()} />
  );
  const chipRowStyle = { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 };
  const categoryChips = [allLabel, ...categories].map((cat) => {
    const active = cat === selectedCategory || (isAll(cat) && isAll(selectedCategory));
    const label = isAll(cat) ? allLabel : translateCategory(messages, cat);
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
        <Text style={{ color: active ? "#ffffff" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      </TouchableOpacity>
    );
  });
  const locationChips = locationOptions.map((loc) => {
    const active = loc === selectedLocation || (isAll(loc) && isAll(selectedLocation));
    const label = isAll(loc) ? allLabel : translateLocation(messages, loc);
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
        {isAll(loc) ? null : <Ionicons name="location-outline" size={12} color={active ? "#ffffff" : colors.muted} />}
        <Text style={{ color: active ? "#ffffff" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      </TouchableOpacity>
    );
  });

  const pageContent = (
    <>
      <PageHeader title={t("jobs.title")} subtitle={isDesktopWeb ? t("jobs.subtitle") : undefined} />
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
            placeholder={t("jobs.searchPlaceholder")}
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
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>{t("jobs.loadError")}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>
              {jobsQuery.error.message.includes("timed out") || jobsQuery.error.message.includes("Network")
                ? t("jobs.loadErrorNetwork")
                : jobsQuery.error.message}
            </Text>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
            <Ionicons name="search" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 16 }}>{t("jobs.emptyTitle")}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>{t("jobs.emptyHint")}</Text>
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
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        {item.timeline && item.timeline !== "未指定" ? item.timeline : formatJobSchedule(item)}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{t("jobs.publishedAt")}{formatPublishedDate(item.createdAt)}</Text>
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
        <AdSenseBanner style={{ paddingTop: 24, paddingBottom: 8 }} />
      </View>
    </>
  );

  return (
    <AppScreen>
      <ScreenScroll contentContainerStyle={{ paddingBottom: 32 }} refreshControl={refreshControl}>
        {pageContent}
      </ScreenScroll>
    </AppScreen>
  );
}
