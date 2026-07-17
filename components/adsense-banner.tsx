import type { ViewStyle } from "react-native";

type AdSenseBannerProps = {
  style?: ViewStyle;
};

/** Native: no ads. Web uses `adsense-banner.web.tsx`. */
export function AdSenseBanner(_props: AdSenseBannerProps) {
  return null;
}
