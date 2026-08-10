import { createElement, type ReactNode } from "react";
import { Platform, StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

type WebHeadingProps = {
  level?: 1 | 2 | 3;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

/**
 * Renders semantic h1–h3 on web for SEO; plain Text on native.
 */
export function WebHeading({ level = 1, children, style, accessibilityLabel }: WebHeadingProps) {
  if (Platform.OS !== "web") {
    return (
      <Text style={style} accessibilityRole="header" accessibilityLabel={accessibilityLabel}>
        {children}
      </Text>
    );
  }

  const tag = (`h${level}` as const);
  return createElement(
    tag,
    {
      style: StyleSheet.flatten([
        {
          margin: 0,
          fontWeight: "800" as const,
        },
        style,
      ]),
      "aria-label": accessibilityLabel,
    },
    children,
  );
}
