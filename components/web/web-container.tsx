import { Platform, ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";

import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "./constants";

type WebContainerProps = ViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
};

/** Centers page content on desktop web with shared max width. */
export function WebContainer({
  children,
  scroll = false,
  refreshControl,
  contentContainerStyle,
  style,
  ...props
}: WebContainerProps) {
  const inner = (
    <View
      style={{
        width: "100%",
        maxWidth: WEB_MAX_WIDTH,
        alignSelf: "center",
        paddingHorizontal: WEB_HORIZONTAL_PADDING,
      }}
    >
      {children}
    </View>
  );

  if (Platform.OS === "web" && scroll) {
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
