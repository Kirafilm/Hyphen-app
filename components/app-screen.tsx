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
  safeArea = true,
  children,
  webScroll = false,
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
    <>
      <WebNav />
      <WebContainer scroll={webScroll} contentWide={webContentWide} refreshControl={refreshControl} contentContainerStyle={contentContainerStyle}>
        {children}
      </WebContainer>
    </>
  ) : (
    children
  );

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]} {...props}>
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
