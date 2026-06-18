import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { Text, View } from "react-native";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getPrivacySections } from "@/lib/i18n/legal/privacy";

export default function PrivacyScreen() {
  const colors = useColors();
  const { t, locale } = useLocale();
  const sections = getPrivacySections(locale);

  return (
    <AppScreen>
      <PageHeader title={t("legal.privacyTitle")} subtitle={t("legal.privacySubtitle")} showBack />

      <ScreenScroll contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, paddingBottom: 40 }}>
        {sections.map((section) => (
          <View key={section.title} style={{ marginBottom: 24, gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>{section.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{section.body}</Text>
          </View>
        ))}

        <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 8 }}>
          © Hyphen - All Rights Reserved
        </Text>
      </ScreenScroll>
    </AppScreen>
  );
}
