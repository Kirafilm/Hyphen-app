import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { isTaiwanMarketingHome } from "@/lib/i18n/locale-routing";
import { LOCALES, type Locale } from "@/lib/i18n/types";

const LOCALE_LABEL_KEYS: Record<Locale, "zhHK" | "zhTW" | "zhHans" | "en"> = {
  "zh-HK": "zhHK",
  "zh-TW": "zhTW",
  "zh-Hans": "zhHans",
  en: "en",
};

type LanguagePickerProps = {
  compact?: boolean;
};

export function LanguagePicker({ compact = false }: LanguagePickerProps) {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(Platform.OS !== "web");

  const selectLocale = (code: Locale) => {
    setLocale(code);
    setOpen(false);

    if (Platform.OS !== "web") return;

    if (code === "zh-TW") {
      if (!isTaiwanMarketingHome(pathname)) {
        router.replace("/tw");
      }
      return;
    }

    if (isTaiwanMarketingHome(pathname)) {
      router.replace("/");
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") setLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!open || Platform.OS !== "web" || typeof document === "undefined") return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const rootRef = useRef<View>(null);

  if (!layoutReady) return null;

  return (
    <View ref={rootRef} style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("language.label")}
        onPress={(e) => {
          if (Platform.OS === "web") {
            (e as unknown as { stopPropagation?: () => void }).stopPropagation?.();
          }
          setOpen((v) => !v);
        }}
        style={[
          styles.trigger,
          compact && styles.triggerCompact,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Ionicons name="globe-outline" size={compact ? 18 : 20} color={colors.foreground} />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.menu,
            compact ? styles.menuCompact : styles.menuDesktop,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          {LOCALES.map((code) => {
            const active = locale === code;
            const labelKey = LOCALE_LABEL_KEYS[code];
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                onPress={() => selectLocale(code)}
                style={[styles.item, active && { backgroundColor: `${colors.primary}12` }]}
              >
                <Text style={{ color: active ? colors.primary : colors.foreground, fontWeight: active ? "700" : "500", fontSize: 13 }}>
                  {t(`language.${labelKey}`)}
                </Text>
                {active ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    zIndex: 200,
  },
  trigger: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerCompact: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  menu: {
    position: "absolute",
    top: 44,
    right: 0,
    minWidth: 188,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuDesktop: {
    top: 46,
  },
  menuCompact: {
    top: 40,
    right: 0,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
