import { createElement, useEffect, useRef } from "react";
import { Platform, Text, View, type ViewStyle } from "react-native";

const ADSTERRA_SCRIPT =
  "https://pl30741884.effectivecpmnetwork.com/68cb7e66e4404b5749c7db7db8949f76/invoke.js";
const ADSTERRA_CONTAINER_ID = "container-68cb7e66e4404b5749c7db7db8949f76";

type AdsterraSlotProps = {
  style?: ViewStyle;
};

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

/**
 * Web-only Adsterra Native Banner.
 * Note: Adsterra usually serves inventory only on the approved site domain
 * (hyphenjob.com), so localhost often stays empty even when the code is correct.
 */
export function AdsterraSlot({ style }: AdsterraSlotProps) {
  const hostRef = useRef<View>(null);
  const local = Platform.OS === "web" && isLocalHost();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const container = document.getElementById(ADSTERRA_CONTAINER_ID);
    if (!container) return;

    // Match Adsterra snippet order: container first, then invoke.js next to it.
    document.querySelectorAll(`script[data-adsterra-invoke="${ADSTERRA_CONTAINER_ID}"]`).forEach((n) => n.remove());

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-adsterra-invoke", ADSTERRA_CONTAINER_ID);
    script.src = `${ADSTERRA_SCRIPT}?t=${Date.now()}`;

    if (container.parentNode) {
      container.parentNode.insertBefore(script, container.nextSibling);
    } else {
      document.body.appendChild(script);
    }

    return () => {
      script.remove();
    };
  }, []);

  return (
    <View
      ref={hostRef}
      style={[
        {
          width: "100%",
          maxWidth: 728,
          alignSelf: "center",
          minHeight: local ? 88 : 120,
          overflow: "visible",
        },
        style,
      ]}
    >
      {local ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderStyle: "dashed",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#F8FAFC",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 13, color: "#64748B", lineHeight: 20, textAlign: "center" }}>
            Adsterra 廣告位（本機預覽）{"\n"}
            多數情況只會喺正式網域 hyphenjob.com 顯示廣告，localhost 常見空白。
          </Text>
        </View>
      ) : null}
      {createElement("div", {
        id: ADSTERRA_CONTAINER_ID,
        // Ensure a real DOM node id for the Adsterra crawler/script
        style: { width: "100%", minHeight: local ? 0 : 90 },
      })}
    </View>
  );
}
