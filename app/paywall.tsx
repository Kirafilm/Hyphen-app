import { useAuth } from "@/hooks/use-auth";
import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import {
  REVENUECAT_ENTITLEMENT_ID,
  revenueCatGetCustomerInfo,
  revenueCatGetOfferings,
  revenueCatPurchasePackage,
  revenueCatRestorePurchases,
} from "@/lib/revenuecat";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";

const APP_VARIANT = Constants.expoConfig?.extra?.appVariant ?? "production";

/** Shown in dev/preview when StoreKit offerings are unavailable (e.g. ASC Missing Metadata). */
const PAYWALL_PREVIEW_PLANS = [
  { id: "hyphen_pro_monthly", title: "Hyphen Pro 月費計劃", priceLabel: "HK$288/月" },
  { id: "hyphen_pro_yearly", title: "Hyphen Pro 年費計劃", priceLabel: "HK$2,888/年" },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const { isAuthenticated } = useAuth();

  const meQuery = trpc.subscription.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const activateMutation = trpc.subscription.debugActivate.useMutation({
    onSuccess: () => meQuery.refetch(),
  });

  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);

  const entitlement = useMemo(() => {
    return customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID];
  }, [customerInfo]);

  const isEntitled = Boolean(entitlement);
  const entitlementExpiresAt = entitlement?.expirationDate ? new Date(entitlement.expirationDate).toLocaleString() : "—";

  const availablePackages: PurchasesPackage[] = useMemo(() => {
    const pkgs = offerings?.current?.availablePackages;
    return Array.isArray(pkgs) ? pkgs : [];
  }, [offerings]);

  const showPreviewPlans =
    Platform.OS !== "web" &&
    (APP_VARIANT !== "production" || __DEV__) &&
    !isEntitled &&
    availablePackages.length === 0;

  useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;
    (async () => {
      const nextOfferings = await revenueCatGetOfferings();
      if (nextOfferings) setOfferings(nextOfferings);
      const nextCustomerInfo = await revenueCatGetCustomerInfo();
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
    })().catch((e) => setRcError(e instanceof Error ? e.message : String(e)));
  }, [isAuthenticated]);

  const maybeActivateDebugSubscription = (pkg: PurchasesPackage, nextCustomerInfo?: CustomerInfo | null) => {
    const info = nextCustomerInfo ?? customerInfo;
    const entitled = info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID];
    if (!entitled) return;

    const productId = pkg.product?.identifier ?? "";
    if (productId === "hyphen_pro_monthly") {
      activateMutation.mutate({ plan: "monthly" });
    }
    if (productId === "hyphen_pro_yearly") {
      activateMutation.mutate({ plan: "yearly" });
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setRcError(null);
    setPurchasingId(pkg.identifier);
    try {
      const result = await revenueCatPurchasePackage(pkg);
      const nextCustomerInfo = result?.customerInfo ?? null;
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
      maybeActivateDebugSubscription(pkg, nextCustomerInfo);
    } catch (e) {
      setRcError(e instanceof Error ? e.message : String(e));
    } finally {
      setPurchasingId(null);
    }
  };

  const handleRestore = async () => {
    setRcError(null);
    setRestoreLoading(true);
    try {
      const nextCustomerInfo = await revenueCatRestorePurchases();
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
    } catch (e) {
      setRcError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoreLoading(false);
    }
  };

  const goBackToJob = () => {
    if (params.jobId) {
      router.replace(`/job/${params.jobId}`);
      return;
    }
    router.back();
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <PageHeader
            title="解鎖聯絡資訊"
            subtitle="未訂閱可查看工作內容，但無法查看電話與電郵。"
            showBack
            onBack={goBackToJob}
          />

          <View style={{ paddingHorizontal: 24, paddingVertical: 16, gap: 16 }}>
            {!isAuthenticated ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 12 }}>
                <Ionicons name="lock-closed" size={40} color={colors.muted} />
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>請先登入</Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, marginTop: 8 }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>前往登入</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>你的訂閱狀態</Text>
                  <Text style={{ color: colors.muted, fontSize: 14 }}>
                    方案：{meQuery.data?.plan ?? "載入中"}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 14 }}>
                    到期：{meQuery.data?.expiresAt ? new Date(meQuery.data.expiresAt).toLocaleString() : "—"}
                  </Text>
                </View>

                {Platform.OS === "web" ? (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>選擇訂閱</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
                      Web 版暫未支援內購，請使用 iOS/Android App 內完成訂閱。
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>選擇訂閱</Text>

                    {isEntitled ? (
                      <View style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: `${colors.primary}33`, gap: 4 }}>
                        <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>已解鎖</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>到期：{entitlementExpiresAt}</Text>
                      </View>
                    ) : null}

                    {showPreviewPlans ? (
                      PAYWALL_PREVIEW_PLANS.map((plan) => (
                        <View
                          key={plan.id}
                          style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}
                        >
                          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                            {plan.title}（{plan.priceLabel}）
                          </Text>
                        </View>
                      ))
                    ) : availablePackages.length === 0 ? (
                      <Text style={{ color: colors.muted, fontSize: 14 }}>載入訂閱方案中…</Text>
                    ) : (
                      availablePackages.map((pkg) => (
                        <TouchableOpacity
                          key={pkg.identifier}
                          onPress={() => handlePurchase(pkg)}
                          disabled={Boolean(purchasingId) || restoreLoading}
                          style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}
                        >
                          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                            {pkg.product?.title ?? "訂閱"}（{pkg.product?.priceString ?? "—"}）
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}

                    <TouchableOpacity
                      onPress={handleRestore}
                      disabled={Boolean(purchasingId) || restoreLoading}
                      style={{ backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>
                        {restoreLoading ? "恢復中…" : "恢復購買"}
                      </Text>
                    </TouchableOpacity>

                    {rcError && !showPreviewPlans ? (
                      <Text style={{ color: colors.error, fontSize: 12 }}>{rcError}</Text>
                    ) : null}
                  </View>
                )}

                <View style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: `${colors.primary}33` }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>訂閱說明</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                        {showPreviewPlans
                          ? "付款將由 App Store 處理。訂閱會自動續期，可隨時在 App Store 設定中取消。"
                          : APP_VARIANT !== "production"
                            ? "App 端完成購買後，會先以 RevenueCat entitlement 判斷是否解鎖；目前亦會同步更新測試訂閱狀態，方便你即時驗證「查看聯絡資訊」流程。"
                            : "付款將由 App Store 處理。訂閱會自動續期，可隨時在 App Store 設定中取消。"}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
