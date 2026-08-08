import { createElement, useEffect, useRef } from "react";
import { Platform, Text, View, type ViewStyle } from "react-native";

const AD_KEY = "38293ea339dba5bc588c2356bbff619a";
const AD_SCRIPT = `https://www.highperformanceformat.com/${AD_KEY}/invoke.js`;
const AD_WIDTH = 728;
const AD_HEIGHT = 90;

type AdsterraSlotProps = {
  style?: ViewStyle;
};

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

/**
 * Web-only Adsterra Banner (728×90 iframe).
 * Localhost often stays empty — inventory usually serves on hyphenjob.com only.
 */
export function AdsterraSlot({ style }: AdsterraSlotProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const local = Platform.OS === "web" && isLocalHost();

  useEffect(() => {
    if (typeof document === "undefined" || !mountRef.current) return;

    const host = mountRef.current;
    host.innerHTML = "";

    // Adsterra iframe units expect atOptions on window before invoke.js runs.
    (window as Window & { atOptions?: Record<string, unknown> }).atOptions = {
      key: AD_KEY,
      format: "iframe",
      height: AD_HEIGHT,
      width: AD_WIDTH,
      params: {},
    };

    const script = document.createElement("script");
    script.src = `${AD_SCRIPT}?t=${Date.now()}`;
    script.async = true;
    host.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, []);

  return (
    <View
      style={[
        {
          width: "100%",
          maxWidth: AD_WIDTH,
          alignSelf: "center",
          minHeight: AD_HEIGHT,
          alignItems: "center",
          overflow: "visible",
        },
        style,
      ]}
    >
      {local ? (
        <View
          style={{
            width: "100%",
            maxWidth: AD_WIDTH,
            height: AD_HEIGHT,
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderStyle: "dashed",
            borderRadius: 8,
            backgroundColor: "#F8FAFC",
            justifyContent: "center",
            paddingHorizontal: 12,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: "#64748B", textAlign: "center", lineHeight: 18 }}>
            Adsterra 728×90（本機預覽）· 正式網域 hyphenjob.com 先會出廣告
          </Text>
        </View>
      ) : null}
      {createElement("div", {
        ref: (node: HTMLDivElement | null) => {
          mountRef.current = node;
        },
        style: {
          width: AD_WIDTH,
          maxWidth: "100%",
          height: AD_HEIGHT,
          overflow: "hidden",
        },
      })}
    </View>
  );
}
