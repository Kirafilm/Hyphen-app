import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import type { ColorScheme } from "@/constants/theme";

type EtherealBackgroundProps = {
  /** Base canvas color behind the gradient washes */
  baseColor?: string;
  variant?: ColorScheme;
};

const LIGHT_GRADIENTS = {
  purple: ["#C4B5FD", "#DDD6FE", "#EDE9FE"],
  pink: ["#FBCFE8", "#FCE7F3", "#FDF2F8"],
  blend: ["#E9D5FF", "#F5D0FE", "#FAE8FF"],
  lavender: ["#DDD6FE", "#EDE9FE"],
  rose: ["#F9A8D4", "#FBCFE8"],
};

const DARK_GRADIENTS = {
  purple: ["#5B21B6", "#4C1D95", "#120F1A"],
  pink: ["#831843", "#500724", "#120F1A"],
  blend: ["#6D28D9", "#701A75", "#120F1A"],
  lavender: ["#4338CA", "#120F1A"],
  rose: ["#9D174D", "#120F1A"],
};

/**
 * Soft purple + pink mesh-style background (light ethereal wash).
 */
export function EtherealBackground({ baseColor = "#FDFBFF", variant = "light" }: EtherealBackgroundProps) {
  const g = variant === "dark" ? DARK_GRADIENTS : LIGHT_GRADIENTS;
  const purpleOpacity = variant === "dark" ? [0.45, 0.22, 0] : [0.62, 0.28, 0];
  const pinkOpacity = variant === "dark" ? [0.38, 0.16, 0] : [0.58, 0.22, 0];
  const blendOpacity = variant === "dark" ? [0.28, 0.14, 0] : [0.34, 0.18, 0];
  const lavenderOpacity = variant === "dark" ? [0.32, 0] : [0.36, 0];
  const roseOpacity = variant === "dark" ? [0.24, 0] : [0.22, 0];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="ethPurple" cx="18%" cy="8%" rx="62%" ry="52%">
            <Stop offset="0%" stopColor={g.purple[0]} stopOpacity={purpleOpacity[0]} />
            <Stop offset="55%" stopColor={g.purple[1]} stopOpacity={purpleOpacity[1]} />
            <Stop offset="100%" stopColor={g.purple[2] ?? g.purple[1]} stopOpacity={purpleOpacity[2]} />
          </RadialGradient>
          <RadialGradient id="ethPink" cx="88%" cy="38%" rx="58%" ry="54%">
            <Stop offset="0%" stopColor={g.pink[0]} stopOpacity={pinkOpacity[0]} />
            <Stop offset="50%" stopColor={g.pink[1]} stopOpacity={pinkOpacity[1]} />
            <Stop offset="100%" stopColor={g.pink[2] ?? g.pink[1]} stopOpacity={pinkOpacity[2]} />
          </RadialGradient>
          <RadialGradient id="ethBlend" cx="42%" cy="52%" rx="70%" ry="58%">
            <Stop offset="0%" stopColor={g.blend[0]} stopOpacity={blendOpacity[0]} />
            <Stop offset="45%" stopColor={g.blend[1]} stopOpacity={blendOpacity[1]} />
            <Stop offset="100%" stopColor={g.blend[2] ?? g.blend[1]} stopOpacity={blendOpacity[2]} />
          </RadialGradient>
          <RadialGradient id="ethLavender" cx="28%" cy="92%" rx="68%" ry="46%">
            <Stop offset="0%" stopColor={g.lavender[0]} stopOpacity={lavenderOpacity[0]} />
            <Stop offset="100%" stopColor={g.lavender[1]} stopOpacity={lavenderOpacity[1]} />
          </RadialGradient>
          <RadialGradient id="ethRose" cx="78%" cy="88%" rx="52%" ry="42%">
            <Stop offset="0%" stopColor={g.rose[0]} stopOpacity={roseOpacity[0]} />
            <Stop offset="100%" stopColor={g.rose[1]} stopOpacity={roseOpacity[1]} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={baseColor} />
        <Rect width="100%" height="100%" fill="url(#ethPurple)" />
        <Rect width="100%" height="100%" fill="url(#ethPink)" />
        <Rect width="100%" height="100%" fill="url(#ethBlend)" />
        <Rect width="100%" height="100%" fill="url(#ethLavender)" />
        <Rect width="100%" height="100%" fill="url(#ethRose)" />
      </Svg>
    </View>
  );
}
