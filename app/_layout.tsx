import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { LogBox, Platform } from "react-native";

if (__DEV__) {
  LogBox.ignoreLogs([
    "SafeAreaView has been deprecated",
    "Using a Test Store API key",
    "The appUserID passed to logIn is the same as the one already cached",
  ]);
}
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationBootstrap } from "@/components/notification-bootstrap";
import { SubscriptionSyncBootstrap } from "@/components/subscription-sync-bootstrap";
import { ThemeStatusBar } from "@/components/theme-status-bar";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="tw" />
            <Stack.Screen name="login" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
            <Stack.Screen name="admin/moderation" options={{ presentation: "modal" }} />
            <Stack.Screen name="oauth/callback" />
            <Stack.Screen name="settings" />
          </Stack>
          <NotificationBootstrap />
          <SubscriptionSyncBootstrap />
          <ThemeStatusBar />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  if (Platform.OS === "web") {
    return (
      <LocaleProvider>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={providerInitialMetrics}>
            <SafeAreaFrameContext.Provider value={providerInitialMetrics.frame}>
              <SafeAreaInsetsContext.Provider value={providerInitialMetrics.insets}>
                <AuthProvider>{content}</AuthProvider>
              </SafeAreaInsetsContext.Provider>
            </SafeAreaFrameContext.Provider>
          </SafeAreaProvider>
        </ThemeProvider>
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider>
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <AuthProvider>{content}</AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
