// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
// Bundle ID can only contain letters, numbers, and dots
// Android requires each dot-separated segment to start with a letter
const rawBundleId = "space.manus.freehunter.app.t20260427031216";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".") // Replace hyphens/underscores with dots
    .replace(/[^a-zA-Z0-9.]/g, "") // Remove invalid chars
    .replace(/\.+/g, ".") // Collapse consecutive dots
    .replace(/^\.+|\.+$/g, "") // Trim leading/trailing dots
    .toLowerCase()
    .split(".")
    .map((segment) => {
      // Android requires each segment to start with a letter
      // Prefix with 'x' if segment starts with a digit
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.manus.app";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

// VPS / staging often uses http://IP:3000 until HTTPS is configured
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const allowsInsecureApi = apiBaseUrl.startsWith("http://");
// Only embed expo-dev-client for EAS "development" profile builds.
const isDevClientBuild = process.env.APP_VARIANT === "development";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Hyphen自由職",
  appSlug: "freehunter-app",
  // Leave empty to use ./assets/images/icon.png
  logoUrl: "",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "0.1.1",
  orientation: "default",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      ...(allowsInsecureApi
        ? {
            NSAppTransportSecurity: {
              NSAllowsArbitraryLoads: true,
            },
          }
        : {}),
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    ...(isDevClientBuild
      ? [
          [
            "expo-dev-client",
            {
              ios: {
                launchMode: "launcher",
              },
            },
          ] as const,
        ]
      : []),
    [
      "expo-notifications",
      {
        // Android status-bar icon (white silhouette). iOS uses AppIcon from `icon` above.
        icon: "./assets/images/android-icon-monochrome.png",
        color: "#0D9488",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
        dark: {
          backgroundColor: "#FFFFFF",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        ios: allowsInsecureApi
          ? {
              infoPlist: {
                NSAppTransportSecurity: {
                  NSAllowsArbitraryLoads: true,
                },
              },
            }
          : {},
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
          usesCleartextTraffic: allowsInsecureApi,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
    appVariant: process.env.APP_VARIANT ?? "production",
    eas: {
      projectId: "1df52b3d-10ce-4f91-86fb-552cd7a910e9",
    },
  },
};

export default config;
