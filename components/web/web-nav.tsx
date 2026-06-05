import { Text, TouchableOpacity, View } from "react-native";
import { usePathname, useRouter } from "expo-router";

import { HyphenLogo } from "@/components/hyphen-logo";
import { useColors } from "@/hooks/use-colors";
import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "./constants";

const NAV_LINKS = [
  { label: "首頁", href: "/(tabs)" as const, key: "home" },
  { label: "職位", href: "/(tabs)/jobs" as const, key: "jobs" },
  { label: "發佈", href: "/(tabs)/post" as const, key: "post" },
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

  return (
    <View
      style={{
        width: "100%",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: `${colors.background}E6`,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: WEB_MAX_WIDTH,
          alignSelf: "center",
          paddingHorizontal: WEB_HORIZONTAL_PADDING,
          paddingTop: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.85}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}
        >
          <HyphenLogo height={40} />
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>Hyphen 自由職</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginTop: 1 }}>Web Beta</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }}>
          {NAV_LINKS.map((link) => {
            const active = isNavActive(pathname, link.key);
            return (
              <TouchableOpacity
                key={link.label}
                onPress={() => router.push(link.href)}
                activeOpacity={0.85}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? `${colors.primary}18` : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: active ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 13 }}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
