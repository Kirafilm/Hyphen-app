import { Platform, View, type ScrollViewProps, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { EtherealBackground } from "@/components/ethereal-background";
import { WebContainer } from "@/components/web/web-container";
import { WebNav } from "@/components/web/web-nav";

type AppScreenProps = ViewProps & {
  edges?: Edge[];
  safeArea?: boolean;
  children: React.ReactNode;
  /** Full-width page scroll on web (scrollbar at viewport edge). */
  webScroll?: boolean;
  /** Homepage-style layout: no max-width wrapper on web. */
  webContentWide?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
};

/** Full-screen wrapper with the shared ethereal background. */
export function AppScreen({
  edges = ["top", "left", "right"],
  safeArea = Platform.OS !== "web",
  children,
  webScroll = Platform.OS === "web",
  webContentWide = false,
  refreshControl,
  contentContainerStyle,
  style,
  ...props
}: AppScreenProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();

  const isWeb = Platform.OS === "web";
  const content = isWeb ? (
    <View style={{ width: "100%" }}>
      <WebNav />
      <WebContainer
        scroll={false}
        contentWide={webContentWide}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </WebContainer>
    </View>
  ) : (
    children
  );

  const rootStyle = isWeb
    ? { width: "100%" as const, minHeight: "100%" as const, backgroundColor: colors.background }
    : { flex: 1 as const, backgroundColor: colors.background };

  return (
    <View style={[rootStyle, style]} {...props}>
      {!webContentWide ? <EtherealBackground baseColor={colors.background} variant={colorScheme} /> : null}
      {safeArea ? (
        <SafeAreaView edges={edges} style={{ flex: 1 }}>
          {content}
        </SafeAreaView>
      ) : (
        content
      )}
    </View>
  );
}
