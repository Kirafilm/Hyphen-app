import { Platform, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { usePathname, useRouter } from "expo-router";

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
  const compactNav = width < WEB_DESKTOP_BREAKPOINT;

  return (
    <View
      style={{
        width: "100%",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: Platform.OS === "web" ? "rgba(255,255,255,0.92)" : `${colors.background}E6`,
        ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, zIndex: 100 } as object) : {}),
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: WEB_MAX_WIDTH,
          alignSelf: "center",
          paddingHorizontal: WEB_HORIZONTAL_PADDING,
          paddingVertical: compactNav ? 10 : 0,
          minHeight: compactNav ? undefined : 64,
          flexDirection: compactNav ? "column" : "row",
          alignItems: compactNav ? "stretch" : "center",
          justifyContent: "space-between",
          gap: compactNav ? 10 : 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flexShrink: 1,
            alignSelf: compactNav ? "center" : undefined,
          }}
        >
          <HyphenLogo height={compactNav ? 28 : 32} />
          <Text style={{ fontSize: compactNav ? 16 : 18, fontWeight: "800", color: colors.foreground }}>
            Hyphen <Text style={{ color: colors.primary }}>自由職</Text>
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: compactNav ? "center" : "flex-end",
            gap: 8,
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = isNavActive(pathname, link.key);
            return (
              <TouchableOpacity
                key={link.label}
                onPress={() => router.push(link.href)}
                activeOpacity={0.85}
                style={{ paddingHorizontal: 4, paddingVertical: 6 }}
              >
                <Text style={{ color: active ? colors.primary : colors.muted, fontWeight: "600", fontSize: 14 }}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => router.push(isAuthenticated ? "/(tabs)/profile" : "/login")}
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              marginLeft: 4,
            }}
          >
            <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 14 }}>{isAuthenticated ? "帳戶" : "登入"}</Text>
          </TouchableOpacity>
          {!isAuthenticated ? (
            <TouchableOpacity
              onPress={() => router.push("/login")}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>免費註冊</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
