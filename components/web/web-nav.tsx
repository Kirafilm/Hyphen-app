import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { HyphenLogo } from "@/components/hyphen-logo";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { WEB_DESKTOP_BREAKPOINT } from "@/lib/web-layout";
import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "./constants";

const NAV_LINKS = [
  { label: "首頁", href: "/(tabs)" as const, key: "home" },
  { label: "瀏覽職位", href: "/(tabs)/jobs" as const, key: "jobs" },
  { label: "發佈工作", href: "/(tabs)/post" as const, key: "post" },
  { label: "個人", href: "/(tabs)/profile" as const, key: "profile" },
] as const;

function isNavActive(pathname: string, key: string) {
  const path = pathname || "/";
  if (key === "jobs") return path.includes("/jobs");
  if (key === "post") return path.includes("/post");
  if (key === "profile") return path.includes("/profile");
  return path === "/" || (!path.includes("/jobs") && !path.includes("/post") && !path.includes("/profile"));
}

export function WebNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  // Avoid SSR/client mismatch: keep desktop nav until after mount.
  const [layoutReady, setLayoutReady] = useState(Platform.OS !== "web");
  useEffect(() => {
    if (Platform.OS === "web") setLayoutReady(true);
  }, []);
  const isDesktopWeb = !layoutReady || width >= WEB_DESKTOP_BREAKPOINT;

  const shellStyle = {
    borderBottomColor: colors.border,
    backgroundColor: Platform.OS === "web" ? "rgba(255,255,255,0.92)" : `${colors.background}E6`,
  };

  const link = (item: (typeof NAV_LINKS)[number]) => {
    const active = isNavActive(pathname, item.key);
    return (
      <TouchableOpacity
        key={item.label}
        onPress={() => router.push(item.href)}
        activeOpacity={0.85}
        style={styles.linkHit}
      >
        <Text style={{ color: active ? colors.primary : colors.muted, fontWeight: "600", fontSize: 14 }}>
          {item.label}
        </Text>
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
          {isAuthenticated ? "帳戶" : "登入"}
        </Text>
      </TouchableOpacity>
      {!isAuthenticated ? (
        <TouchableOpacity
          onPress={() => router.push("/login")}
          activeOpacity={0.85}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: compact ? 13 : 14 }}>免費註冊</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.shell, shellStyle]}>
      {isDesktopWeb ? (
        <View style={styles.desktopBar}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.85}
            style={styles.logoRow}
          >
            <HyphenLogo height={32} />
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
              Hyphen <Text style={{ color: colors.primary }}>自由職</Text>
            </Text>
          </TouchableOpacity>
          <View style={styles.desktopRight}>
            {NAV_LINKS.map(link)}
            {authButtons(false)}
          </View>
        </View>
      ) : (
        <View style={styles.mobileBar}>
          <View style={styles.mobileTop}>
            <TouchableOpacity onPress={() => router.push("/(tabs)")} activeOpacity={0.85} style={styles.logoRow}>
              <HyphenLogo height={28} />
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                Hyphen <Text style={{ color: colors.primary }}>自由職</Text>
              </Text>
            </TouchableOpacity>
            {authButtons(true)}
          </View>
          <View style={styles.mobileLinks}>{NAV_LINKS.map(link)}</View>
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
