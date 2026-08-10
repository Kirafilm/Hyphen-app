import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { SeoHead } from "@/components/seo-head";
import { useColors } from "@/hooks/use-colors";
import { GUIDES, guideCopy, guideLabel } from "@/lib/content/guides";
import { useLocale } from "@/lib/i18n/locale-provider";
import { breadcrumbJsonLd } from "@/lib/seo";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const INDEX_TITLE: Record<string, { title: string; lead: string }> = {
  "zh-HK": {
    title: "使用指南",
    lead: "以下文章說明如何發佈工作、接案、理解收費，以及新手如何開始。內容供你在使用 Hyphen 前參考。",
  },
  "zh-TW": {
    title: "使用指南",
    lead: "以下文章說明如何刊登案件、接案、理解收費，以及新手如何開始。",
  },
  "zh-Hans": {
    title: "使用指南",
    lead: "以下文章说明如何发布工作、接案、理解收费，以及新手如何开始。",
  },
  en: {
    title: "Guides",
    lead: "Learn how to post jobs, find freelance work, understand pricing, and get started on Hyphen.",
  },
};

export default function GuidesIndexScreen() {
  const colors = useColors();
  const { locale } = useLocale();
  const router = useRouter();
  const meta = INDEX_TITLE[locale] ?? INDEX_TITLE["zh-HK"];

  return (
    <AppScreen>
      <SeoHead
        title={meta.title}
        description={meta.lead}
        path="/guides"
        locale={(locale as "zh-HK" | "zh-TW" | "zh-Hans" | "en") || "zh-HK"}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: meta.title, path: "/guides" },
        ])}
      />
      <PageHeader title={meta.title} />
      <ScreenScroll>
        <View style={{ paddingHorizontal: 24, paddingBottom: 40, gap: 16, maxWidth: 720, width: "100%", alignSelf: "center" }}>
          <Text style={{ fontSize: 16, lineHeight: 26, color: colors.muted }}>{meta.lead}</Text>
          {GUIDES.map((guide) => {
            const copy = guideCopy(guide, locale);
            return (
              <TouchableOpacity
                key={guide.slug}
                onPress={() => router.push(guide.path as never)}
                activeOpacity={0.75}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  gap: 6,
                  backgroundColor: colors.background,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>{guideLabel(guide, locale)}</Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: colors.muted }} numberOfLines={3}>
                  {copy.lead}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
