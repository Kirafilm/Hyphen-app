import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function PostScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          {/* Header */}
          <View className="bg-primary px-6 py-8 gap-2">
            <Text className="text-3xl font-bold text-background">發佈工作</Text>
            <Text className="text-sm text-background opacity-90">
              快速找到最合適的 Freelancer
            </Text>
          </View>

          {/* Content */}
          <View className="px-6 py-8 gap-4">
            <View className="bg-surface rounded-lg p-6 border border-border">
              <View className="items-center gap-4">
                <View className="w-16 h-16 bg-primary rounded-full items-center justify-center">
                  <Ionicons name="create" size={32} color="white" />
                </View>
                <Text className="text-lg font-bold text-foreground text-center">
                  發佈您的工作需求
                </Text>
                <Text className="text-sm text-muted text-center leading-relaxed">
                  詳細描述您的工作需求，我們的 Freelancer 將快速回應並提供報價。
                </Text>
              </View>
            </View>

            {/* Steps */}
            <View className="gap-3">
              <View className="bg-surface rounded-lg p-4 border border-border flex-row items-center gap-4">
                <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">選擇行業類別</Text>
                  <Text className="text-muted text-xs mt-1">
                    從設計、開發、營銷等多個行業中選擇
                  </Text>
                </View>
              </View>

              <View className="bg-surface rounded-lg p-4 border border-border flex-row items-center gap-4">
                <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">填寫工作詳情</Text>
                  <Text className="text-muted text-xs mt-1">
                    描述您的需求、預算和期限
                  </Text>
                </View>
              </View>

              <View className="bg-surface rounded-lg p-4 border border-border flex-row items-center gap-4">
                <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">收到報價</Text>
                  <Text className="text-muted text-xs mt-1">
                    在幾分鐘內收到合適的 Freelancer 報價
                  </Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={() => (isAuthenticated ? router.push("/job/new") : router.push("/login"))}
              className="bg-primary rounded-lg py-4 items-center justify-center mt-4 active:opacity-80"
            >
              <Text className="text-white font-semibold text-base">開始發佈工作</Text>
            </TouchableOpacity>

            {/* Info Box */}
            <View className="bg-primary bg-opacity-10 rounded-lg p-4 border border-primary border-opacity-20">
              <View className="flex-row gap-3">
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-sm">提示</Text>
                  <Text className="text-muted text-xs mt-1 leading-relaxed">
                    發佈工作完全免費。您只需在選定 Freelancer 後才需支付費用。
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
