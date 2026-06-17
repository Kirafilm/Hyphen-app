import { Platform, ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";

import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "./constants";

type WebContainerProps = ViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
  /** Let child sections control their own horizontal padding (e.g. full-bleed landing). */
  contentWide?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
};

/** Centers page content on desktop web with shared max width. */
export function WebContainer({
  children,
  scroll = false,
  contentWide = false,
  refreshControl,
  contentContainerStyle,
  style,
  ...props
}: WebContainerProps) {
  const inner = (
    <View
      style={{
        width: "100%",
        maxWidth: contentWide ? undefined : WEB_MAX_WIDTH,
        alignSelf: "center",
        paddingHorizontal: contentWide ? 0 : WEB_HORIZONTAL_PADDING,
      }}
    >
      {children}
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <View style={[{ width: "100%" }, style]} {...props}>
        {inner}
      </View>
    );
  }

  if (scroll) {
    return (
      <ScrollView
        style={[{ flex: 1, width: "100%" }, style]}
        contentContainerStyle={[{ paddingBottom: 48 }, contentContainerStyle]}
        refreshControl={refreshControl}
        {...props}
      >
        {inner}
      </ScrollView>
    );
  }

  return (
    <View style={[{ flex: 1, width: "100%" }, style]} {...props}>
      {inner}
    </View>
  );
}
