import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import type { ColorScheme } from "@/constants/theme";

type EtherealBackgroundProps = {
  /** Base canvas color behind the gradient washes */
  baseColor?: string;
  variant?: ColorScheme;
};

const LIGHT_GRADIENTS = {
  blue: ["#93C5FD", "#BFDBFE", "#DBEAFE"],
  cyan: ["#A5F3FC", "#CFFAFE", "#ECFEFF"],
  blend: ["#BAE6FD", "#BFDBFE", "#E0F2FE"],
  soft: ["#BFDBFE", "#DBEAFE"],
  sky: ["#7DD3FC", "#BAE6FD"],
};

const DARK_GRADIENTS = {
  blue: ["#1E40AF", "#1E3A8A", "#0B1220"],
  cyan: ["#155E75", "#083344", "#0B1220"],
  blend: ["#1D4ED8", "#0E7490", "#0B1220"],
  soft: ["#1E3A8A", "#0B1220"],
  sky: ["#0369A1", "#0B1220"],
};

/**
 * Soft blue + cyan mesh-style background (light ethereal wash).
 */
export function EtherealBackground({ baseColor = "#F8FBFF", variant = "light" }: EtherealBackgroundProps) {
  const g = variant === "dark" ? DARK_GRADIENTS : LIGHT_GRADIENTS;
  const blueOpacity = variant === "dark" ? [0.45, 0.22, 0] : [0.62, 0.28, 0];
  const cyanOpacity = variant === "dark" ? [0.38, 0.16, 0] : [0.5, 0.2, 0];
  const blendOpacity = variant === "dark" ? [0.28, 0.14, 0] : [0.34, 0.18, 0];
  const softOpacity = variant === "dark" ? [0.32, 0] : [0.36, 0];
  const skyOpacity = variant === "dark" ? [0.24, 0] : [0.22, 0];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="ethBlue" cx="18%" cy="8%" rx="62%" ry="52%">
            <Stop offset="0%" stopColor={g.blue[0]} stopOpacity={blueOpacity[0]} />
            <Stop offset="55%" stopColor={g.blue[1]} stopOpacity={blueOpacity[1]} />
            <Stop offset="100%" stopColor={g.blue[2] ?? g.blue[1]} stopOpacity={blueOpacity[2]} />
          </RadialGradient>
          <RadialGradient id="ethCyan" cx="88%" cy="38%" rx="58%" ry="54%">
            <Stop offset="0%" stopColor={g.cyan[0]} stopOpacity={cyanOpacity[0]} />
            <Stop offset="50%" stopColor={g.cyan[1]} stopOpacity={cyanOpacity[1]} />
            <Stop offset="100%" stopColor={g.cyan[2] ?? g.cyan[1]} stopOpacity={cyanOpacity[2]} />
          </RadialGradient>
          <RadialGradient id="ethBlend" cx="42%" cy="52%" rx="70%" ry="58%">
            <Stop offset="0%" stopColor={g.blend[0]} stopOpacity={blendOpacity[0]} />
            <Stop offset="45%" stopColor={g.blend[1]} stopOpacity={blendOpacity[1]} />
            <Stop offset="100%" stopColor={g.blend[2] ?? g.blend[1]} stopOpacity={blendOpacity[2]} />
          </RadialGradient>
          <RadialGradient id="ethSoft" cx="28%" cy="92%" rx="68%" ry="46%">
            <Stop offset="0%" stopColor={g.soft[0]} stopOpacity={softOpacity[0]} />
            <Stop offset="100%" stopColor={g.soft[1]} stopOpacity={softOpacity[1]} />
          </RadialGradient>
          <RadialGradient id="ethSky" cx="78%" cy="88%" rx="52%" ry="42%">
            <Stop offset="0%" stopColor={g.sky[0]} stopOpacity={skyOpacity[0]} />
            <Stop offset="100%" stopColor={g.sky[1]} stopOpacity={skyOpacity[1]} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={baseColor} />
        <Rect width="100%" height="100%" fill="url(#ethBlue)" />
        <Rect width="100%" height="100%" fill="url(#ethCyan)" />
        <Rect width="100%" height="100%" fill="url(#ethBlend)" />
        <Rect width="100%" height="100%" fill="url(#ethSoft)" />
        <Rect width="100%" height="100%" fill="url(#ethSky)" />
      </Svg>
    </View>
  );
}
