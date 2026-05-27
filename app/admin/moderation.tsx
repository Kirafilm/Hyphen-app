import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ModerationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();

  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = meQuery.data?.role === "admin";

  const jobsQuery = trpc.jobs.list.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const removeMutation = trpc.jobs.remove.useMutation({
    onSuccess: async () => {
      await utils.jobs.list.invalidate();
    },
  });

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="bg-primary px-6 py-6 gap-2">
            <TouchableOpacity onPress={() => router.back()} className="w-8 h-8">
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-background mt-2">內容管理</Text>
            <Text className="text-sm text-background opacity-90">清理垃圾工作或廣告內容</Text>
          </View>

          <View className="px-6 py-6 gap-4">
            {!isAdmin ? (
              <View className="bg-surface rounded-lg p-6 border border-border items-center gap-3">
                <Ionicons name="lock-closed" size={40} color={colors.muted} />
                <Text className="text-foreground font-semibold">需要管理員權限</Text>
              </View>
            ) : (
              <FlatList
                data={jobsQuery.data ?? []}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View className="bg-surface rounded-lg p-4 mb-3 border border-border gap-3">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">{item.title}</Text>
                        <Text className="text-muted text-xs mt-1">{item.category}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeMutation.mutate({ id: item.id })}
                        disabled={removeMutation.isPending}
                        className="bg-error bg-opacity-10 rounded-lg px-3 py-2 border border-error border-opacity-20 active:opacity-80"
                      >
                        <Text className="text-error font-semibold text-xs">下架</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push(`/job/${item.id}`)}
                      className="bg-primary bg-opacity-10 rounded-lg py-3 items-center justify-center border border-primary border-opacity-20 active:opacity-80"
                    >
                      <Text className="text-primary font-semibold">查看</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

