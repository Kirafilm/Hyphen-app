import { Text, TouchableOpacity, View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { AdSenseBanner } from "@/components/adsense-banner";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trpc } from "@/lib/trpc";
import { screenPaddingHorizontal, useWebLayout } from "@/lib/web-layout";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isDesktopWeb } = useWebLayout();
  const { t, messages } = useLocale();
  const { user, isAuthenticated, logout } = useAuth();
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const subscriptionQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const role = meQuery.data?.role ?? "user";

  const MenuRow = ({ icon, label, onPress, accent, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; accent?: string; danger?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: danger ? "rgba(239, 68, 68, 0.10)" : colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: danger ? "rgba(239, 68, 68, 0.20)" : colors.border,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexBasis: isDesktopWeb ? "48%" : "auto",
        minWidth: isDesktopWeb ? 280 : undefined,
        flexGrow: isDesktopWeb ? 1 : 0,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : accent ?? colors.primary} />
        <Text style={{ color: danger ? colors.error : colors.foreground, fontSize: 15, fontWeight: "700" }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={danger ? colors.error : colors.muted} />
    </TouchableOpacity>
  );

  const pad = screenPaddingHorizontal();

  const promoIcons = ["mail-outline", "shield-checkmark-outline", "eye-outline"] as const;
  const promoPoints = messages.profile.promoPoints.map((text, index) => ({
    icon: promoIcons[index] ?? ("mail-outline" as const),
    text,
  }));

  const PromoBox = () => (
    <View
      style={{
        flex: isDesktopWeb ? 1 : undefined,
        backgroundColor: colors.surface,
        borderRadius: isDesktopWeb ? 24 : 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: isDesktopWeb ? 28 : 20,
        gap: 16,
        maxWidth: isDesktopWeb ? undefined : 560,
        alignSelf: isDesktopWeb ? "stretch" : "center",
        width: isDesktopWeb ? undefined : "100%",
      }}
    >
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: `${colors.primary}18`,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>{t("profile.promoBadge")}</Text>
      </View>
      <Text style={{ color: colors.foreground, fontSize: isDesktopWeb ? 22 : 18, fontWeight: "800", lineHeight: isDesktopWeb ? 30 : 26 }}>
        {t("profile.promoTitle")}
      </Text>
      <View style={{ gap: 14 }}>
        {promoPoints.map((point) => (
          <View key={point.text} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: `${colors.primary}14`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={point.icon} size={18} color={colors.primary} />
            </View>
            <Text style={{ flex: 1, color: colors.muted, fontSize: 14, lineHeight: 22 }}>{point.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <AppScreen contentContainerStyle={{ paddingBottom: 32 }}>
        <ScreenScroll contentContainerStyle={{ paddingBottom: 32 }}>
          <PageHeader title={t("profile.title")} subtitle={isDesktopWeb ? t("profile.subtitle") : undefined} />

          <View
            style={{
              paddingHorizontal: pad,
              paddingBottom: 16,
              flexDirection: isDesktopWeb ? "row" : "column",
              gap: isDesktopWeb ? 24 : 16,
              maxWidth: isDesktopWeb ? 960 : undefined,
              alignSelf: isDesktopWeb ? "center" : "stretch",
              width: isDesktopWeb ? "100%" : undefined,
              alignItems: "stretch",
            }}
          >
            <View
              style={{
                flex: isDesktopWeb ? 1.2 : undefined,
                backgroundColor: colors.surface,
                borderRadius: isDesktopWeb ? 24 : 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 24,
                maxWidth: isDesktopWeb ? undefined : 560,
                alignSelf: isDesktopWeb ? "stretch" : "center",
                width: isDesktopWeb ? undefined : "100%",
              }}
            >
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 30, fontWeight: "800" }}>{(user?.name?.charAt(0) || "U").toUpperCase()}</Text>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>{isAuthenticated ? user?.name || t("profile.title") : t("profile.guestTitle")}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>{isAuthenticated ? user?.email || "" : t("profile.guestBody")}</Text>
              </View>

              <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
                {isAuthenticated
                  ? subscriptionQuery.data?.active
                    ? t("profile.subscriptionActive")
                    : t("profile.subscriptionInactive")
                  : t("profile.pleaseLogin")}
              </Text>
            </View>

            <PromoBox />
          </View>

          <View
            style={{
              paddingHorizontal: pad,
              gap: 10,
              flexDirection: isDesktopWeb ? "row" : "column",
              flexWrap: isDesktopWeb ? "wrap" : "nowrap",
              maxWidth: isDesktopWeb ? 720 : undefined,
              alignSelf: isDesktopWeb ? "center" : "stretch",
              width: isDesktopWeb ? "100%" : undefined,
            }}
          >
            {(Platform.OS !== "web" || isAuthenticated) && (
              <MenuRow icon="card" label={t("profile.menuSubscription")} onPress={() => router.push("/paywall")} />
            )}

            {!isAuthenticated ? (
              <TouchableOpacity
                onPress={() => router.push("/login")}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexBasis: isDesktopWeb ? "100%" : "auto",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Ionicons name="log-in" size={20} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}>{t("profile.guestCta")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              null
            )}

            <MenuRow icon="settings" label={t("profile.menuSettings")} onPress={() => router.push("/settings")} />
            <MenuRow icon="document-text" label={t("profile.menuPrivacy")} onPress={() => router.push("/privacy")} />
            <MenuRow icon="document-text" label={t("profile.menuTerms")} onPress={() => router.push("/terms")} />
            <MenuRow icon="chatbubbles" label={t("profile.menuContact")} onPress={() => router.push("/contact")} />

            {role === "admin" && <MenuRow icon="shield-checkmark" label={t("profile.menuAdmin")} onPress={() => router.push("/admin/moderation")} />}
            {isAuthenticated && <MenuRow icon="log-out" label={t("profile.menuLogout")} onPress={() => logout()} danger />}
          </View>

          <View style={{ paddingHorizontal: pad, maxWidth: isDesktopWeb ? 720 : undefined, alignSelf: isDesktopWeb ? "center" : "stretch", width: isDesktopWeb ? "100%" : undefined }}>
            <AdSenseBanner />
          </View>

          <View style={{ paddingHorizontal: pad, paddingTop: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>© Hyphen - All Rights Reserved</Text>
          </View>
        </ScreenScroll>
    </AppScreen>
  );
}
