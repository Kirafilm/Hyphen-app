import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { EtherealBackground } from "@/components/ethereal-background";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string;
  safeAreaClassName?: string;
}

export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();

  return (
    <View className={cn("flex-1 relative overflow-hidden", containerClassName)} {...props}>
      <EtherealBackground baseColor={colors.background} variant={colorScheme} />
      <SafeAreaView edges={edges} className={cn("flex-1", safeAreaClassName)} style={style}>
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
