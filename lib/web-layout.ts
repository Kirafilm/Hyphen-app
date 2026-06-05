import { Platform } from "react-native";

export const isWeb = Platform.OS === "web";

/** Horizontal padding for screen content; web uses WebContainer instead. */
export function screenPaddingHorizontal() {
  return isWeb ? 0 : 24;
}
