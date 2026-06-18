import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { AppScreen } from "@/components/app-screen";
import { HomeLandingWeb } from "@/components/web/home-landing.web";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function HomeWebScreen() {
  const router = useRouter();
  const colors = useColors();
  const { locale, ready } = useLocale();

  useEffect(() => {
    if (!ready || locale !== "zh-TW") return;
    router.replace("/tw");
  }, [locale, ready, router]);

  if (!ready || locale === "zh-TW") {
    return (
      <AppScreen webScroll webContentWide safeArea={false} edges={[]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 120 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen webScroll webContentWide safeArea={false} edges={[]}>
      <HomeLandingWeb />
    </AppScreen>
  );
}
