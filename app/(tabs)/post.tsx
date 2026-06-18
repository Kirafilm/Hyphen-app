import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n/locale-provider";
import { screenPaddingHorizontal, useWebLayout } from "@/lib/web-layout";

export default function PostScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const { isDesktopWeb } = useWebLayout();

  const pad = screenPaddingHorizontal();

  return (
    <AppScreen contentContainerStyle={{ paddingBottom: 32 }}>
      <ScreenScroll contentContainerStyle={{ paddingBottom: 32 }}>
        <PageHeader title={t("post.title")} subtitle={t("post.subtitle")} />

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
                <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textAlign: "center" }}>{t("post.cardTitle")}</Text>
                <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 10 }}>
                  {t("post.cardBody")}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: isDesktopWeb ? "row" : "column", gap: 12, alignItems: "stretch" }}>
            {[
              ["1", t("post.step1Title"), t("post.step1Body")],
              ["2", t("post.step2Title"), t("post.step2Body")],
              ["3", t("post.step3Title"), t("post.step3Body")],
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
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>{t("post.cta")}</Text>
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
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{t("post.tipTitle")}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                  {t("post.tipBody")}
                </Text>
              </View>
            </View>
          </View>
        </ScreenScroll>
    </AppScreen>
  );
}
