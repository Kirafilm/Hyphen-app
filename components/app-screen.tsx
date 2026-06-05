import { Platform, View, type ViewProps } from "react-native";
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
};

/** Full-screen wrapper with the shared ethereal background. */
export function AppScreen({ edges = ["top", "left", "right"], safeArea = true, children, style, ...props }: AppScreenProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();

  const isWeb = Platform.OS === "web";
  const content = isWeb ? (
    <>
      <WebNav />
      <WebContainer>{children}</WebContainer>
    </>
  ) : (
    children
  );

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]} {...props}>
      <EtherealBackground baseColor={colors.background} variant={colorScheme} />
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
