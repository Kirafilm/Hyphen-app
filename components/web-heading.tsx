import { createElement, type CSSProperties, type ReactNode } from "react";
import { Platform, StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

type WebHeadingProps = {
  level?: 1 | 2 | 3;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

/** RN numbers → CSS: fontSize gets px automatically, but lineHeight stays unitless (multiplier). */
function toDomHeadingStyle(style: StyleProp<TextStyle>): CSSProperties {
  const flat = StyleSheet.flatten(style) ?? {};
  const out: Record<string, unknown> = {
    margin: 0,
    fontWeight: "800",
    ...flat,
  };

  for (const key of ["lineHeight", "letterSpacing", "paddingTop", "paddingBottom", "marginTop", "marginBottom"] as const) {
    const value = out[key];
    if (typeof value === "number") {
      out[key] = `${value}px`;
    }
  }

  return out as CSSProperties;
}

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
      style: toDomHeadingStyle(style),
      "aria-label": accessibilityLabel,
    },
    children,
  );
}
