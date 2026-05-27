import { View, type ViewProps, Platform } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  const colorScheme = useColorScheme();
  const showAurora = colorScheme === "light";

  const auroraStyle =
    Platform.OS === "web"
      ? ({
          backgroundColor: "var(--color-background)",
          backgroundImage:
            "radial-gradient(900px circle at 18% 8%, rgba(196,181,253,0.45), transparent 58%), radial-gradient(760px circle at 82% 16%, rgba(251,207,232,0.35), transparent 60%), radial-gradient(860px circle at 52% 92%, rgba(186,230,253,0.28), transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.30), rgba(250,248,255,0.92))",
        } as any)
      : null;

  return (
    <View
      className={cn(
        "flex-1",
        "bg-background",
        "relative overflow-hidden",
        containerClassName
      )}
      {...props}
    >
      {showAurora && (
        <>
          <View
            pointerEvents="none"
            className="absolute inset-0"
            style={auroraStyle as any}
          />
          {Platform.OS !== "web" && (
            <>
              <View
                pointerEvents="none"
                className="absolute"
                style={{
                  top: -140,
                  left: -120,
                  width: 360,
                  height: 360,
                  borderRadius: 9999,
                  backgroundColor: "rgba(196, 181, 253, 0.45)",
                }}
              />
              <View
                pointerEvents="none"
                className="absolute"
                style={{
                  top: -120,
                  right: -150,
                  width: 420,
                  height: 420,
                  borderRadius: 9999,
                  backgroundColor: "rgba(251, 207, 232, 0.32)",
                }}
              />
              <View
                pointerEvents="none"
                className="absolute"
                style={{
                  bottom: -180,
                  left: 40,
                  width: 520,
                  height: 520,
                  borderRadius: 9999,
                  backgroundColor: "rgba(186, 230, 253, 0.24)",
                }}
              />
            </>
          )}
        </>
      )}
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
