import { StatusBar } from "expo-status-bar";

import { useThemeContext } from "@/lib/theme-provider";

export function ThemeStatusBar() {
  const { colorScheme } = useThemeContext();
  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />;
}
