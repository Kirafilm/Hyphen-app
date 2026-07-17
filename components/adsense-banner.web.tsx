import { View, type ViewStyle } from "react-native";

import { AdSenseSlot } from "@/components/web/adsense-slot.web";

type AdSenseBannerProps = {
  style?: ViewStyle;
};

/** Web-only AdSense banner for shared screens (jobs, profile, …). */
export function AdSenseBanner({ style }: AdSenseBannerProps) {
  return (
    <View style={[{ width: "100%", paddingVertical: 20 }, style]}>
      <AdSenseSlot />
    </View>
  );
}
