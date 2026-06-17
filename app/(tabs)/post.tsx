import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { screenPaddingHorizontal, useWebLayout } from "@/lib/web-layout";

export default function PostScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const { isDesktopWeb } = useWebLayout();

  const pad = screenPaddingHorizontal();

  return (
    <AppScreen contentContainerStyle={{ paddingBottom: 32 }}>
      <ScreenScroll contentContainerStyle={{ paddingBottom: 32 }}>
        <PageHeader title="發佈工作" subtitle="快速找到最合適的 Freelancer" />

          <View style={{ paddingHorizontal: pad, paddingTop: 8, gap: 16, width: "100%" }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 24,
                maxWidth: isDesktopWeb ? 640 : undefined,
                alignSelf: isDesktopWeb ? "center" : "stretch",
                width: isDesktopWeb ? "100%" : undefined,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="create" size={32} color="#ffffff" />
                </View>
                <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textAlign: "center" }}>發佈您的工作需求</Text>
                <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 10 }}>
                  詳細描述您的工作需求，我們的 Freelancer 將快速回應並提供報價。
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: isDesktopWeb ? "row" : "column", gap: 12, alignItems: "stretch" }}>
            {[
              ["1", "選擇行業類別", "從設計、開發、營銷等多個行業中選擇"],
              ["2", "填寫工作詳情", "描述您的需求、預算和期限"],
              ["3", "收到報價", "在幾分鐘內收到合適的 Freelancer 報價"],
            ].map(([step, title, body]) => (
              <View
                key={step}
                style={{
                  flex: isDesktopWeb ? 1 : undefined,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: isDesktopWeb ? 20 : 16,
                  flexDirection: isDesktopWeb ? "column" : "row",
                  alignItems: isDesktopWeb ? "flex-start" : "center",
                  gap: isDesktopWeb ? 12 : 14,
                  alignSelf: "stretch",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontWeight: "800" }}>{step}</Text>
                </View>
                <View style={{ flex: isDesktopWeb ? undefined : 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }}>{title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>{body}</Text>
                </View>
              </View>
            ))}
            </View>

            <TouchableOpacity
              onPress={() => (isAuthenticated ? router.push("/job/new") : router.push("/login"))}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
                maxWidth: isDesktopWeb ? 360 : undefined,
                alignSelf: isDesktopWeb ? "center" : "stretch",
                width: isDesktopWeb ? "100%" : undefined,
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>開始發佈工作</Text>
            </TouchableOpacity>

            <View
              style={{
                backgroundColor: "rgba(124, 103, 255, 0.10)",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(124, 103, 255, 0.20)",
                padding: 16,
                flexDirection: "row",
                gap: 12,
                maxWidth: isDesktopWeb ? 640 : undefined,
                alignSelf: isDesktopWeb ? "center" : "stretch",
                width: isDesktopWeb ? "100%" : undefined,
              }}
            >
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>提示</Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                  發佈工作完全免費。
                </Text>
              </View>
            </View>
          </View>
        </ScreenScroll>
    </AppScreen>
  );
}
