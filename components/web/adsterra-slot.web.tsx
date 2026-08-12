import { type ViewStyle } from "react-native";

type AdsterraSlotProps = {
  style?: ViewStyle;
};

/**
 * Adsterra temporarily disabled — their invoke.js was serving full-page / popunder ads.
 * Keep the export so call sites compile; restore a banner-only unit later if needed.
 */
export function AdsterraSlot(_props: AdsterraSlotProps) {
  return null;
}
