import { createElement } from "react";
import { Platform, View, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";

const SMARTLINK_URL =
  "https://accuracyinstalled.com/uz92t45si?key=2e796aa2215bca4d870f6fe4dc0a63cc";

type WebAdBannerProps = {
  style?: ViewStyle;
};

/**
 * Web-only reserved ad slot — Smartlink (opens in a new tab on click).
 * Native app never imports this file (`.web.tsx`).
 */
export function WebAdBanner({ style }: WebAdBannerProps) {
  const colors = useColors();
  const { locale } = useLocale();
  const isEn = locale === "en";
  const label = isEn ? "Sponsored" : "贊助";
  const cta = isEn ? "Learn more" : "了解更多";

  if (Platform.OS !== "web") return null;

  return (
    <View style={[{ width: "100%", maxWidth: 728, alignSelf: "center", paddingVertical: 12 }, style]}>
      {createElement(
        "a",
        {
          href: SMARTLINK_URL,
          target: "_blank",
          rel: "sponsored noopener noreferrer",
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minHeight: 90,
            width: "100%",
            padding: "16px 20px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: `linear-gradient(135deg, #F8FAFC 0%, ${colors.surface} 100%)`,
            textDecoration: "none",
            boxSizing: "border-box",
          },
        },
        createElement(
          "span",
          {
            style: {
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#94A3B8",
            },
          },
          label,
        ),
        createElement(
          "span",
          {
            style: {
              fontSize: 16,
              fontWeight: 700,
              color: colors.primary,
            },
          },
          cta,
        ),
      )}
    </View>
  );
}
