import * as Linking from "expo-linking";
import { Platform } from "react-native";

const bundleId = "space.manus.freehunter.app.t20260427031216";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const deepLinkScheme = `manus${timestamp}`;

const configuredWebUrl = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://hyphenjob.com").replace(/\/$/, "");

/** Redirect URL for Supabase email links (password reset, etc.). */
export function getAuthRedirectUrl(path = "/login"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      const { origin, hostname } = window.location;
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return `${origin}${normalizedPath}`;
      }
    }
    return `${configuredWebUrl}${normalizedPath}`;
  }

  return Linking.createURL(normalizedPath, { scheme: deepLinkScheme });
}
