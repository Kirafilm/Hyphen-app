import { Text, TouchableOpacity, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  large?: boolean;
};

/** Transparent page header — no solid color bar. */
export function PageHeader({ title, subtitle, showBack = false, onBack, large = true }: PageHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const { t } = useLocale();
  const isWeb = Platform.OS === "web";
  const horizontalPadding = isWeb ? 0 : 24;

  return (
    <View style={{ paddingHorizontal: horizontalPadding, paddingTop: isWeb ? 20 : 8, paddingBottom: 16, gap: 8 }}>
      {showBack ? (
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={onBack ?? (() => router.back())}
          style={{ width: 32, height: 32 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </TouchableOpacity>
      ) : null}
      <Text
        style={{
          fontSize: large ? (isWeb ? 32 : 28) : 24,
          fontWeight: "800",
          color: colors.foreground,
          marginTop: showBack ? 4 : 8,
        }}
      >
        {title}
      </Text>
      {subtitle ? <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>{subtitle}</Text> : null}
    </View>
  );
}
