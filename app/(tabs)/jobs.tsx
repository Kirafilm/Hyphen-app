import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { categories } from "@/lib/mock-data";

export default function JobsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");

  const jobsQuery = trpc.jobs.list.useQuery();
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
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary px-6 py-6 gap-4">
        <Text className="text-2xl font-bold text-background">職位</Text>
        {/* Search Bar */}
        <View className="flex-row items-center bg-background rounded-lg px-4 py-3 gap-2">
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="搜尋職位..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
            className="flex-1 text-foreground"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {["全部", ...categories].map((cat) => {
            const active = cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={
                  active
                    ? "bg-background border border-background rounded-full px-3 py-2"
                    : "bg-transparent border border-background/40 rounded-full px-3 py-2"
                }
              >
                <Text className={active ? "text-primary font-semibold text-xs" : "text-background text-xs"}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Jobs List */}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-4">
          {filteredJobs.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="search" size={48} color={colors.muted} />
              <Text className="text-foreground font-semibold mt-4">找不到相關職位</Text>
              <Text className="text-muted text-sm mt-2">試試其他搜尋條件</Text>
            </View>
          ) : (
            <FlatList
              data={filteredJobs}
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
                      <View className="flex-row items-center gap-2 mt-2">
                        {item.skills.slice(0, 2).map((skill, index) => (
                          <View key={index} className="bg-primary bg-opacity-10 rounded px-2 py-1">
                            <Text className="text-primary text-xs font-medium">{skill}</Text>
                          </View>
                        ))}
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
      </ScrollView>
    </ScreenContainer>
  );
}
