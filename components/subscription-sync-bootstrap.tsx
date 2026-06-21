import { useEffect } from "react";
import { Platform } from "react-native";

import { isRevenueCatEnabled, revenueCatGetCustomerInfo } from "@/lib/revenuecat";

/** Configure RevenueCat on launch so anonymous store subscribers can unlock contacts via API headers. */
export function SubscriptionSyncBootstrap() {
  useEffect(() => {
    if (Platform.OS === "web" || !isRevenueCatEnabled()) return;
    void revenueCatGetCustomerInfo().catch(() => {});
  }, []);

  return null;
}
