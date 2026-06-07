import { Platform, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { useThemeContext } from "@/lib/theme-provider";

export function ThemeStatusBar() {
  const { colorScheme } = useThemeContext();
  const style = colorScheme === "dark" ? "light" : "dark";

  // Avoid mounting RN StatusBar on Android — backgroundColor/translucent props call deprecated edge-to-edge APIs.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    RNStatusBar.setBarStyle(style === "light" ? "light-content" : "dark-content", false);
  }, [style]);

  if (Platform.OS === "android") {
    return null;
  }

  return <StatusBar style={style} />;
}
