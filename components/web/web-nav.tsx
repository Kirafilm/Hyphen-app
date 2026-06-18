import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { HyphenLogo } from "@/components/hyphen-logo";
import { LanguagePicker } from "@/components/web/language-picker";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { isDefaultMarketingHome, isTaiwanMarketingHome } from "@/lib/i18n/locale-routing";
import type { Locale } from "@/lib/i18n/types";
import { WEB_DESKTOP_BREAKPOINT } from "@/lib/web-layout";
import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "./constants";

const NAV_KEYS = [
  { key: "home", href: "/(tabs)" as const },
  { key: "jobs", href: "/(tabs)/jobs" as const },
  { key: "post", href: "/(tabs)/post" as const },
  { key: "profile", href: "/(tabs)/profile" as const },
] as const;

function isNavActive(pathname: string, key: string, locale: Locale) {
  const path = pathname || "/";
  if (key === "jobs") return path.includes("/jobs");
  if (key === "post") return path.includes("/post");
  if (key === "profile") return path.includes("/profile");
  if (key === "home") {
    if (locale === "zh-TW") return isTaiwanMarketingHome(path);
    return isDefaultMarketingHome(path);
  }
  return false;
}

export function WebNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const [layoutReady, setLayoutReady] = useState(Platform.OS !== "web");
  useEffect(() => {
    if (Platform.OS === "web") setLayoutReady(true);
  }, []);
  const isDesktopWeb = !layoutReady || width >= WEB_DESKTOP_BREAKPOINT;

  const shellStyle = {
    borderBottomColor: colors.border,
    backgroundColor: Platform.OS === "web" ? "rgba(255,255,255,0.92)" : `${colors.background}E6`,
  };

  const marketingHomeHref = locale === "zh-TW" ? "/tw" : "/(tabs)";

  const link = (item: (typeof NAV_KEYS)[number]) => {
    const active = isNavActive(pathname, item.key, locale);
    const label = t(`nav.${item.key}`);
    const href = item.key === "home" ? marketingHomeHref : item.href;
    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => router.push(href)}
        activeOpacity={0.85}
        style={styles.linkHit}
      >
        <Text style={{ color: active ? colors.primary : colors.muted, fontWeight: "600", fontSize: 14 }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const authButtons = (compact = false) => (
    <View style={[styles.authRow, compact && styles.authRowCompact]}>
      <TouchableOpacity
        onPress={() => router.push(isAuthenticated ? "/(tabs)/profile" : "/login")}
        activeOpacity={0.85}
        style={[styles.outlineBtn, { borderColor: colors.border }]}
      >
        <Text style={{ color: colors.muted, fontWeight: "600", fontSize: compact ? 13 : 14 }}>
          {isAuthenticated ? t("nav.account") : t("nav.login")}
        </Text>
      </TouchableOpacity>
      {!isAuthenticated ? (
        <TouchableOpacity
          onPress={() => router.push("/login")}
          activeOpacity={0.85}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: compact ? 13 : 14 }}>{t("nav.signup")}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const brandParts = t("nav.brand").split(" ");
  const brandName = brandParts[0] ?? "Hyphen";
  const brandTag = brandParts.slice(1).join(" ") || t("nav.brand");

  return (
    <View style={[styles.shell, shellStyle]}>
      {isDesktopWeb ? (
        <View style={styles.desktopBar}>
          <TouchableOpacity onPress={() => router.push(marketingHomeHref)} activeOpacity={0.85} style={styles.logoRow}>
            <HyphenLogo height={32} />
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
              {brandName} <Text style={{ color: colors.primary }}>{brandTag}</Text>
            </Text>
          </TouchableOpacity>
          <View style={styles.desktopRight}>
            {NAV_KEYS.map(link)}
            <LanguagePicker />
            {authButtons(false)}
          </View>
        </View>
      ) : (
        <View style={styles.mobileBar}>
          <View style={styles.mobileTop}>
            <TouchableOpacity onPress={() => router.push(marketingHomeHref)} activeOpacity={0.85} style={styles.logoRow}>
              <HyphenLogo height={28} />
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                {brandName} <Text style={{ color: colors.primary }}>{brandTag}</Text>
              </Text>
            </TouchableOpacity>
            <View style={styles.mobileActions}>
              <LanguagePicker compact />
              {authButtons(true)}
            </View>
          </View>
          <View style={styles.mobileLinks}>{NAV_KEYS.map(link)}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    borderBottomWidth: 1,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  desktopBar: {
    width: "100%",
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: WEB_HORIZONTAL_PADDING,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  mobileBar: {
    width: "100%",
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: WEB_HORIZONTAL_PADDING,
    paddingVertical: 10,
    gap: 10,
  },
  mobileTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  mobileLinks: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  desktopRight: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  linkHit: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  authRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  authRowCompact: {
    gap: 6,
  },
  outlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  primaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
});
