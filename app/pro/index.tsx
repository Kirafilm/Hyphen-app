import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { SeoHead } from "@/components/seo-head";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { breadcrumbJsonLd } from "@/lib/seo";
import { storagePublicUrl } from "@/lib/storage-url";
import { trpc } from "@/lib/trpc";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";

export default function ServiceDirectoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useLocale();
  const pad = screenPaddingHorizontal();
  const listQuery = trpc.serviceProfiles.listPublished.useQuery();

  return (
    <AppScreen webContentWide>
      <SeoHead
        title={`${t("serviceDirectory.title")} | Hyphen`}
        description={t("serviceDirectory.subtitle")}
        path="/pro"
        locale="zh-HK"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: t("serviceDirectory.title"), path: "/pro" },
          ]),
        ]}
      />

      <ScreenScroll contentContainerStyle={{ paddingBottom: 48 }}>
        <View
          style={{
            paddingHorizontal: pad,
            maxWidth: 960,
            width: "100%",
            alignSelf: "center",
            gap: 14,
          }}
        >
          <PageHeader title={t("serviceDirectory.title")} subtitle={t("serviceDirectory.subtitle")} />

          {listQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
          ) : (listQuery.data?.length ?? 0) === 0 ? (
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 12, lineHeight: 22 }}>
              {t("serviceDirectory.empty")}
            </Text>
          ) : (
            <View
              style={{
                flexDirection: isWeb ? "row" : "column",
                flexWrap: "wrap",
                gap: 14,
                justifyContent: "flex-start",
              }}
            >
              {listQuery.data?.map((profile) => {
                const title = profile.headline.trim() || t("serviceProfile.fallbackTitle");
                const introFull = profile.intro.trim();
                const introLimit = 220;
                const intro = introFull.slice(0, introLimit);
                return (
                  <TouchableOpacity
                    key={profile.slug}
                    onPress={() => router.push(`/pro/${profile.slug}` as never)}
                    activeOpacity={0.88}
                    style={{
                      width: isWeb ? "48%" : "100%",
                      maxWidth: isWeb ? "48%" : "100%",
                      flexGrow: 0,
                      flexShrink: 0,
                      minHeight: isWeb ? 280 : undefined,
                      backgroundColor: colors.surface,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 18,
                      gap: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      {profile.avatarStorageKey ? (
                        <Image
                          source={{ uri: storagePublicUrl(profile.avatarStorageKey) }}
                          style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: colors.border }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 999,
                            backgroundColor: colors.primary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
                            {title.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "800" }} numberOfLines={2}>
                          {title}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                    </View>

                    {intro ? (
                      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, flexGrow: 1 }} numberOfLines={5}>
                        {intro}
                        {introFull.length > introLimit ? "…" : ""}
                      </Text>
                    ) : null}

                    <View style={{ gap: 8 }}>
                      {profile.categories.length > 0 ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {profile.categories.slice(0, 4).map((tag) => (
                            <View
                              key={`${profile.slug}-cat-${tag}`}
                              style={{
                                backgroundColor: `${colors.primary}12`,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      {profile.locations.length > 0 ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {profile.locations.slice(0, 4).map((tag) => (
                            <View
                              key={`${profile.slug}-loc-${tag}`}
                              style={{
                                backgroundColor: `${colors.primary}12`,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
