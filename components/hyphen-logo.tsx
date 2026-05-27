import { Platform, View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, G, Path } from "react-native-svg";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function HyphenLogo({ size = 28 }: { size?: number }) {
  const scheme = useColorScheme();
  const outer = Math.round(size);
  const radius = Math.round(outer * 0.34);

  const stops =
    scheme === "dark"
      ? [
          { o: 0, c: "#241B3B" },
          { o: 0.45, c: "#3B2B6C" },
          { o: 1, c: "#7C67FF" },
        ]
      : [
          { o: 0, c: "#FBF8FF" },
          { o: 0.42, c: "#F3E8FF" },
          { o: 0.78, c: "#FFE4F1" },
          { o: 1, c: "#E6F3FF" },
        ];

  const markColor = scheme === "dark" ? "rgba(244,241,255,0.92)" : "rgba(27,21,48,0.90)";

  return (
    <View
      className="bg-transparent"
      style={{
        width: outer,
        height: outer,
        borderRadius: radius,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: scheme === "dark" ? 0.25 : 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Svg width={outer} height={outer} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="hyphen_bg" x1="10" y1="6" x2="54" y2="58">
            {stops.map((s) => (
              <Stop key={String(s.o)} offset={s.o} stopColor={s.c} stopOpacity={1} />
            ))}
          </LinearGradient>
          <LinearGradient
            id="hyphen_stroke"
            x1="0"
            y1="0"
            x2="64"
            y2="64"
          >
            <Stop offset="0" stopColor="rgba(255,255,255,0.55)" />
            <Stop offset="0.55" stopColor="rgba(124,103,255,0.30)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0.22)" />
          </LinearGradient>
        </Defs>

        <Rect x="4" y="4" width="56" height="56" rx="18" fill="url(#hyphen_bg)" />
        <Rect x="4.5" y="4.5" width="55" height="55" rx="18" fill="none" stroke="url(#hyphen_stroke)" strokeWidth="1" />
        <Rect
          x="7.5"
          y="7.5"
          width="49"
          height="49"
          rx="16"
          fill="none"
          stroke={scheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(27,21,48,0.06)"}
          strokeWidth="1"
        />

        <G opacity={scheme === "dark" ? 0.95 : 1}>
          <Path
            d="M22.5 19.5C22.5 18.3954 23.3954 17.5 24.5 17.5H27.2C28.3046 17.5 29.2 18.3954 29.2 19.5V44.5C29.2 45.6046 28.3046 46.5 27.2 46.5H24.5C23.3954 46.5 22.5 45.6046 22.5 44.5V19.5Z"
            fill={markColor}
          />
          <Path
            d="M34.8 19.5C34.8 18.3954 35.6954 17.5 36.8 17.5H39.5C40.6046 17.5 41.5 18.3954 41.5 19.5V44.5C41.5 45.6046 40.6046 46.5 39.5 46.5H36.8C35.6954 46.5 34.8 45.6046 34.8 44.5V19.5Z"
            fill={markColor}
          />
          <Path
            d="M28.9 30.6C28.9 29.4954 29.7954 28.6 30.9 28.6H33.1C34.2046 28.6 35.1 29.4954 35.1 30.6V33.4C35.1 34.5046 34.2046 35.4 33.1 35.4H30.9C29.7954 35.4 28.9 34.5046 28.9 33.4V30.6Z"
            fill={markColor}
            opacity={0.85}
          />
        </G>

        {Platform.OS === "web" && (
          <Rect x="4" y="4" width="56" height="56" rx="18" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        )}
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          backgroundColor: "rgba(255,255,255,0.10)",
          opacity: scheme === "dark" ? 0.1 : 0.22,
        }}
      />
    </View>
  );
}
