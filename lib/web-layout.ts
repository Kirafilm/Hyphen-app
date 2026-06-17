import { Platform, useWindowDimensions } from "react-native";

export const isWeb = Platform.OS === "web";

/** Match global.css — desktop web layout from this width up. */
export const WEB_DESKTOP_BREAKPOINT = 768;

export function useWebLayout() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = isWeb && width >= WEB_DESKTOP_BREAKPOINT;
  const isMobileWeb = isWeb && !isDesktopWeb;
  return { isWeb, isDesktopWeb, isMobileWeb, width };
}

/** Horizontal padding for screen content; web uses WebContainer instead. */
export function screenPaddingHorizontal() {
  return isWeb ? 0 : 24;
}
