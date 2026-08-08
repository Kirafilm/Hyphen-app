import { View, type ViewStyle } from "react-native";

import { AdsterraSlot } from "@/components/web/adsterra-slot.web";

type AdSenseBannerProps = {
  style?: ViewStyle;
};

/** Web-only ad banner (Adsterra) for shared screens (jobs, profile, …). */
export function AdSenseBanner({ style }: AdSenseBannerProps) {
  return (
    <View style={[{ width: "100%", paddingVertical: 20 }, style]}>
      <AdsterraSlot />
    </View>
  );
}
