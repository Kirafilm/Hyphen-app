import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ColorScheme } from "@/constants/theme";

export const THEME_PREFERENCE_KEY = "hyphen_theme_preference";

export async function getStoredThemePreference(): Promise<ColorScheme | null> {
  const value = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
  if (value === "light" || value === "dark") return value;
  return null;
}

export async function setStoredThemePreference(scheme: ColorScheme): Promise<void> {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, scheme);
}
