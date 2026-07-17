import { createElement, useEffect, useRef } from "react";
import { View, type ViewStyle } from "react-native";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const ADSENSE_CLIENT = "ca-pub-2239617378202687";

/** Display ad unit "Web_long" from AdSense. */
export const ADSENSE_SLOT =
  process.env.EXPO_PUBLIC_ADSENSE_SLOT_ID?.trim() || "8035165006";

type AdSenseSlotProps = {
  style?: ViewStyle;
};

/**
 * Web-only AdSense display unit. No-ops when slot id is missing.
 * Native app never imports this file (`.web.tsx`).
 */
export function AdSenseSlot({ style }: AdSenseSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_SLOT || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (err) {
      console.warn("[AdSense] push failed:", err);
    }
  }, []);

  if (!ADSENSE_SLOT) return null;

  return (
    <View
      style={[
        {
          width: "100%",
          maxWidth: 728,
          alignSelf: "center",
          minHeight: 100,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {createElement("ins", {
        className: "adsbygoogle",
        style: { display: "block", width: "100%", minHeight: 90 },
        "data-ad-client": ADSENSE_CLIENT,
        "data-ad-slot": ADSENSE_SLOT,
        "data-ad-format": "auto",
        "data-full-width-responsive": "true",
      })}
    </View>
  );
}
