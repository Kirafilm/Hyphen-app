import { ExternalLink } from "@/components/external-link";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ContactScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="bg-primary px-6 py-6 gap-2">
            <TouchableOpacity onPress={() => router.back()} className="w-8 h-8">
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-background mt-2">聯絡我們</Text>
          </View>

          <View className="px-6 py-8 gap-4">
            <Text className="text-muted text-sm leading-relaxed">
              如有查詢或意見，請電郵至以下地址：
            </Text>
            <ExternalLink href="mailto:hyphe.office@gmail.com" className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-primary font-semibold">hyphe.office@gmail.com</Text>
            </ExternalLink>
            <View className="pt-4">
              <Text className="text-muted text-xs text-center">© Hyphen - All Rights Reserved</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
