import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { Text } from "react-native";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getTermsText } from "@/lib/i18n/legal/terms";

export default function TermsScreen() {
  const colors = useColors();
  const { t, locale } = useLocale();
  const termsText = getTermsText(locale);

  return (
    <AppScreen>
      <PageHeader title={t("legal.termsTitle")} showBack />

      <ScreenScroll contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, paddingBottom: 40 }}>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{termsText}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 24 }}>
          © Hyphen - All Rights Reserved
        </Text>
      </ScreenScroll>
    </AppScreen>
  );
}
