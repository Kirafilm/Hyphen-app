import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { SeoHead } from "@/components/seo-head";
import { WebHeading } from "@/components/web-heading";
import { useColors } from "@/hooks/use-colors";
import { getGuide, guideCopy, GUIDES, guideLabel } from "@/lib/content/guides";
import { useLocale } from "@/lib/i18n/locale-provider";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function GuideArticleScreen() {
  const colors = useColors();
  const { locale } = useLocale();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const guide = typeof slug === "string" ? getGuide(slug) : undefined;

  if (!guide) {
    return (
      <AppScreen>
        <PageHeader title="Guides" />
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.muted }}>Guide not found.</Text>
          <TouchableOpacity onPress={() => router.push("/guides")} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>← Guides</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  const copy = guideCopy(guide, locale);
  const others = GUIDES.filter((g) => g.slug !== guide.slug);
  const seoLocale = (["zh-HK", "zh-TW", "zh-Hans", "en"].includes(locale) ? locale : "zh-HK") as
    | "zh-HK"
    | "zh-TW"
    | "zh-Hans"
    | "en";

  return (
    <AppScreen>
      <SeoHead
        title={copy.title}
        description={copy.lead}
        path={guide.path}
        locale={seoLocale}
        ogType="article"
        jsonLd={[
          articleJsonLd({
            title: copy.title,
            description: copy.lead,
            path: guide.path,
            locale: seoLocale,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: locale === "en" ? "Guides" : "使用指南", path: "/guides" },
            { name: guideLabel(guide, locale), path: guide.path },
          ]),
        ]}
      />
      <PageHeader title={copy.title} />
      <ScreenScroll>
        <View style={{ paddingHorizontal: 24, paddingBottom: 48, gap: 20, maxWidth: 720, width: "100%", alignSelf: "center" }}>
          <Text style={{ fontSize: 16, lineHeight: 26, color: colors.muted }}>{copy.lead}</Text>
          {copy.sections.map((section) => (
            <View key={section.h} style={{ gap: 8 }}>
              <WebHeading level={2} style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                {section.h}
              </WebHeading>
              <Text style={{ fontSize: 15, lineHeight: 25, color: colors.muted }}>{section.p}</Text>
            </View>
          ))}

          <View style={{ marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {locale === "en" ? "More guides" : "更多指南"}
            </Text>
            <TouchableOpacity onPress={() => router.push("/guides")}>
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                {locale === "en" ? "All guides" : "全部指南"} →
              </Text>
            </TouchableOpacity>
            {others.map((g) => (
              <TouchableOpacity key={g.slug} onPress={() => router.push(g.path as never)}>
                <Text style={{ fontSize: 14, color: colors.primary }}>{guideLabel(g, locale)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
