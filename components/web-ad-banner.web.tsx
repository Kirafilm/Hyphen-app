import { View, type ViewStyle } from "react-native";

import { AdsterraSlot } from "@/components/web/adsterra-slot.web";

type WebAdBannerProps = {
  style?: ViewStyle;
};

/** Web-only Adsterra banner for shared screens (jobs, profile, …). */
export function WebAdBanner({ style }: WebAdBannerProps) {
  return (
    <View style={[{ width: "100%", paddingVertical: 20 }, style]}>
      <AdsterraSlot />
    </View>
  );
}
