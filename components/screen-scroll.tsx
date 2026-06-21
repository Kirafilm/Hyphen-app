import { Platform, ScrollView, type ScrollViewProps } from "react-native";

/** Native: vertical ScrollView. Web page scroll is handled by AppScreen; nested dropdowns still need ScrollView. */
export function ScreenScroll({
  children,
  style,
  contentContainerStyle,
  nestedScrollEnabled,
  ...props
}: ScrollViewProps) {
  if (Platform.OS === "web" && !nestedScrollEnabled) {
    return <>{children}</>;
  }

  return (
    <ScrollView
      style={[{ flex: nestedScrollEnabled ? undefined : 1 }, style]}
      contentContainerStyle={contentContainerStyle}
      nestedScrollEnabled={nestedScrollEnabled}
      showsVerticalScrollIndicator={nestedScrollEnabled ? true : props.showsVerticalScrollIndicator}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
