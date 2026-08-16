import { View, type ViewStyle } from "react-native";

type WebAdBannerProps = {
  style?: ViewStyle;
};

/**
 * Web-only ad placement placeholder (home / jobs / profile).
 * No network ad scripts — swap in a provider here when ready.
 */
export function WebAdBanner({ style }: WebAdBannerProps) {
  return (
    <View
      style={[
        {
          width: "100%",
          maxWidth: 728,
          alignSelf: "center",
          minHeight: 90,
          paddingVertical: 20,
        },
        style,
      ]}
    />
  );
}
