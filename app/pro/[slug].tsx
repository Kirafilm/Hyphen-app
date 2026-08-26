import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { SeoHead } from "@/components/seo-head";
import { WebHeading } from "@/components/web-heading";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { breadcrumbJsonLd } from "@/lib/seo";
import { storagePublicUrl } from "@/lib/storage-url";
import { trpc } from "@/lib/trpc";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";

function notify(title: string, body: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(body ? `${title}\n\n${body}` : title);
    return;
  }
  const { Alert } = require("react-native") as typeof import("react-native");
  Alert.alert(title, body);
}

function TagGroup({ label, tags, colors }: { label: string; tags: string[]; colors: ReturnType<typeof useColors> }) {
  if (tags.length === 0) return null;
  return (
    <View style={{ gap: 10 }}>
      <WebHeading level={2} style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
        {label}
      </WebHeading>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => (
          <View
            key={tag}
            style={{
              backgroundColor: `${colors.primary}12`,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ServiceProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const router = useRouter();
  const { t } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const pad = screenPaddingHorizontal();
  const [contactLoading, setContactLoading] = useState(false);

  const profileQuery = trpc.serviceProfiles.bySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: Boolean(slug) },
  );
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = meQuery.data?.role === "admin";
  const utils = trpc.useUtils();
  const startThread = trpc.serviceMessages.startThread.useMutation();
  const adminDeleteMutation = trpc.serviceProfiles.adminDelete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.serviceProfiles.listPublished.invalidate(),
        utils.serviceProfiles.listForModeration.invalidate(),
      ]);
      notify(t("serviceProfile.adminRemovedTitle"), t("serviceProfile.adminRemovedBody"));
      router.replace("/pro" as never);
    },
    onError: (err) => {
      notify(t("serviceProfile.contactErrorTitle"), err.message);
    },
  });

  const profile = profileQuery.data;
  const displayTitle = profile?.headline?.trim() || t("serviceProfile.fallbackTitle");
  const avatarLetter = displayTitle.charAt(0).toUpperCase();
  const isOwnProfile = Boolean(user && profile && user.id === profile.userId);

  const handleAdminRemove = () => {
    if (!profile) return;
    const run = () => adminDeleteMutation.mutate({ userId: profile.userId });
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`${t("serviceProfile.adminRemoveTitle")}\n\n${t("serviceProfile.adminRemoveBody")}`)) {
        run();
      }
      return;
    }
    const { Alert } = require("react-native") as typeof import("react-native");
    Alert.alert(t("serviceProfile.adminRemoveTitle"), t("serviceProfile.adminRemoveBody"), [
      { text: "取消", style: "cancel" },
      { text: t("serviceProfile.adminRemoveAction"), style: "destructive", onPress: run },
    ]);
  };

  const seoDescription = useMemo(() => {
    if (!profile) return "";
    return profile.intro.slice(0, 160);
  }, [profile]);

  const handleContact = async () => {
    if (!slug) return;
    if (!isAuthenticated) {
      router.push({ pathname: "/login", params: { returnTo: `/pro/${slug}` } } as never);
      return;
    }
    if (isOwnProfile) {
      router.push("/messages" as never);
      return;
    }
    setContactLoading(true);
    try {
      const result = await startThread.mutateAsync({ profileSlug: slug });
      router.push(`/messages/${result.threadId}` as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("serviceProfile.contactErrorBody");
      notify(t("serviceProfile.contactErrorTitle"), message);
    } finally {
      setContactLoading(false);
    }
  };

  if (profileQuery.isLoading) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!profile) {
    return (
      <AppScreen>
        <PageHeader title={t("serviceProfile.notFoundTitle")} />
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.muted }}>{t("serviceProfile.notFoundBody")}</Text>
        </View>
      </AppScreen>
    );
  }

  const path = `/pro/${profile.slug}`;

  return (
    <AppScreen webContentWide>
      <SeoHead
        title={`${displayTitle} | Hyphen 專業服務`}
        description={seoDescription}
        path={path}
        locale="zh-HK"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: t("serviceDirectory.title"), path: "/pro" },
            { name: displayTitle, path },
          ]),
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View
          style={{
            paddingHorizontal: pad,
            paddingTop: isWeb ? 24 : 8,
            maxWidth: 960,
            width: "100%",
            alignSelf: "center",
            gap: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 24,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: isWeb ? "row" : "column", gap: 20, alignItems: isWeb ? "center" : "flex-start" }}>
              {profile.avatarStorageKey ? (
                <Image
                  source={{ uri: storagePublicUrl(profile.avatarStorageKey) }}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 999,
                    backgroundColor: colors.border,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800" }}>{avatarLetter}</Text>
                </View>
              )}

              <View style={{ flex: 1, gap: 6 }}>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: `${colors.primary}18`,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                    {t("serviceProfile.badge")}
                  </Text>
                </View>
                <WebHeading level={1} style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>
                  {displayTitle}
                </WebHeading>
              </View>

              <TouchableOpacity
                onPress={handleContact}
                disabled={contactLoading}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  alignSelf: isWeb ? "flex-start" : "stretch",
                  justifyContent: "center",
                }}
              >
                {contactLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={isOwnProfile ? "mail-open-outline" : "chatbubble-ellipses"} size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                      {isOwnProfile ? t("serviceProfile.ownInboxCta") : t("serviceProfile.contactCta")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
              {isOwnProfile ? t("serviceProfile.ownPageNotice") : t("serviceProfile.contactNotice")}
            </Text>

            {isAdmin ? (
              <TouchableOpacity
                onPress={handleAdminRemove}
                disabled={adminDeleteMutation.isPending}
                activeOpacity={0.85}
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(239, 68, 68, 0.10)",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.25)",
                }}
              >
                <Text style={{ color: colors.error, fontWeight: "700", fontSize: 13 }}>
                  {adminDeleteMutation.isPending
                    ? t("serviceProfile.adminRemoving")
                    : t("serviceProfile.adminRemoveTitle")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ gap: 28 }}>
            <View style={{ gap: 10 }}>
              <WebHeading level={2} style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                {t("serviceProfile.introTitle")}
              </WebHeading>
              <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 26 }}>{profile.intro}</Text>
            </View>

            <View style={{ gap: 10 }}>
              <WebHeading level={2} style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                {t("serviceProfile.serviceTitle")}
              </WebHeading>
              <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 26 }}>{profile.serviceInfo}</Text>
            </View>

            <TagGroup label={t("serviceProfile.categoriesTitle")} tags={profile.categories} colors={colors} />
            <TagGroup label={t("serviceProfile.locationsTitle")} tags={profile.locations} colors={colors} />
            <TagGroup label={t("serviceProfile.skillsTitle")} tags={profile.skills} colors={colors} />

            {profile.portfolioImages.length > 0 ? (
              <View style={{ gap: 12 }}>
                <WebHeading level={2} style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                  {t("serviceProfile.portfolioTitle")}
                </WebHeading>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {profile.portfolioImages.map((img) => (
                    <Image
                      key={img.id}
                      source={{ uri: storagePublicUrl(img.storageKey) }}
                      style={{
                        width: isWeb ? 220 : "47%",
                        aspectRatio: 4 / 3,
                        borderRadius: 14,
                        backgroundColor: colors.border,
                      }}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
