import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { EtherealBackground } from "@/components/ethereal-background";

type AppScreenProps = ViewProps & {
  edges?: Edge[];
  safeArea?: boolean;
  children: React.ReactNode;
};

/** Full-screen wrapper with the shared ethereal background. */
export function AppScreen({ edges = ["top", "left", "right"], safeArea = true, children, style, ...props }: AppScreenProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]} {...props}>
      <EtherealBackground baseColor={colors.background} variant={colorScheme} />
      {safeArea ? (
        <SafeAreaView edges={edges} style={{ flex: 1 }}>
          {children}
        </SafeAreaView>
      ) : (
        children
      )}
    </View>
  );
}
