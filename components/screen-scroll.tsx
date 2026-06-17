import { Platform, ScrollView, type ScrollViewProps } from "react-native";

/** Native: vertical ScrollView. Web: parent AppScreen webScroll handles scrolling. */
export function ScreenScroll({ children, style, contentContainerStyle, ...props }: ScrollViewProps) {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }

  return (
    <ScrollView style={[{ flex: 1 }, style]} contentContainerStyle={contentContainerStyle} {...props}>
      {children}
    </ScrollView>
  );
}
