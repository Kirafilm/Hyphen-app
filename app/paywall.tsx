import { useAuth } from "@/hooks/use-auth";
import { useMobileSubscriptionSync } from "@/hooks/use-mobile-subscription-sync";
import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useColors } from "@/hooks/use-colors";
import {
  REVENUECAT_ENTITLEMENT_ID,
  revenueCatGetCustomerInfo,
  revenueCatGetOfferings,
  revenueCatGetSubscriptionProducts,
  revenueCatPurchasePackage,
  revenueCatPurchaseStoreProduct,
  revenueCatRestorePurchases,
  type PurchasesStoreProduct,
} from "@/lib/revenuecat";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";

const APP_VARIANT = Constants.expoConfig?.extra?.appVariant ?? "production";

const WEB_LAUNCH_PROMO = {
  badge: "平台新上線特價優惠",
  monthly: { original: 288, sale: 128 },
  yearly: { original: 2888, sale: 1328 },
} as const;

function WebPlanPrice({
  original,
  sale,
  suffix,
  strikeColor,
  saleColor,
}: {
  original: number;
  sale: number;
  suffix: string;
  strikeColor: string;
  saleColor: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      <Text style={{ color: strikeColor, fontSize: 14, textDecorationLine: "line-through" }}>
        HK${original.toLocaleString()}
        {suffix}
      </Text>
      <Text style={{ color: saleColor, fontWeight: "800", fontSize: 16 }}>
        HK${sale.toLocaleString()}
        {suffix}
      </Text>
    </View>
  );
}

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
  const { syncFromCustomerInfo } = useMobileSubscriptionSync();
  const stripeCheckoutMutation = trpc.subscription.createStripeCheckout.useMutation();
  const stripePortalMutation = trpc.subscription.createStripePortal.useMutation();

  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [storeProducts, setStoreProducts] = useState<PurchasesStoreProduct[]>([]);
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
    availablePackages.length === 0 &&
    storeProducts.length === 0;

  const subscriptionNote = useMemo(() => {
    if (Platform.OS === "web") {
      return "付款由 Stripe 安全處理。訂閱會自動續期。如需取消或更改方案，請點擊「管理訂閱」進入 Stripe 安全頁面自行操作。";
    }
    if (showPreviewPlans) {
      return "付款將由 App Store 處理。訂閱會自動續期，可隨時在 App Store 設定中取消。";
    }
    if (APP_VARIANT !== "production") {
      return "App 端完成購買後，會先以 RevenueCat entitlement 判斷是否解鎖；目前亦會同步更新測試訂閱狀態，方便你即時驗證「查看聯絡資訊」流程。";
    }
    if (Platform.OS === "android") {
      return "付款將由 Google Play 處理。訂閱會自動續期，可隨時在 Google Play → 付款與訂閱 中取消。";
    }
    return "付款將由 App Store 處理。訂閱會自動續期，可隨時在 App Store 設定中取消。";
  }, [showPreviewPlans]);

  const storeProductById = useMemo(() => {
    const map = new Map<string, PurchasesStoreProduct>();
    for (const product of storeProducts) {
      if (product.identifier) map.set(product.identifier, product);
    }
    return map;
  }, [storeProducts]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;
    (async () => {
      setRcError(null);
      const nextOfferings = await revenueCatGetOfferings();
      if (nextOfferings) setOfferings(nextOfferings);
      const products = await revenueCatGetSubscriptionProducts();
      setStoreProducts(products);
      const nextCustomerInfo = await revenueCatGetCustomerInfo();
      if (nextCustomerInfo) {
        setCustomerInfo(nextCustomerInfo);
        if (!meQuery.data?.active) {
          syncFromCustomerInfo(nextCustomerInfo);
        }
      }
    })().catch((e) => setRcError(e instanceof Error ? e.message : String(e)));
  }, [isAuthenticated, meQuery.data?.active, syncFromCustomerInfo]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setRcError(null);
    setPurchasingId(pkg.identifier);
    try {
      const result = await revenueCatPurchasePackage(pkg);
      const nextCustomerInfo = result?.customerInfo ?? null;
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
      syncFromCustomerInfo(nextCustomerInfo);
    } catch (e) {
      setRcError(e instanceof Error ? e.message : String(e));
    } finally {
      setPurchasingId(null);
    }
  };

  const handlePurchaseProduct = async (product: PurchasesStoreProduct) => {
    setRcError(null);
    setPurchasingId(product.identifier);
    try {
      const result = await revenueCatPurchaseStoreProduct(product);
      const nextCustomerInfo = result?.customerInfo ?? null;
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
      syncFromCustomerInfo(nextCustomerInfo);
    } catch (e) {
      setRcError(e instanceof Error ? e.message : String(e));
    } finally {
      setPurchasingId(null);
    }
  };

  const handlePurchaseProductId = async (productId: string) => {
    const existing = storeProductById.get(productId);
    if (existing) {
      await handlePurchaseProduct(existing);
      return;
    }
    setRcError(null);
    setPurchasingId(productId);
    try {
      const products = await revenueCatGetSubscriptionProducts();
      setStoreProducts(products);
      const product = products.find((p) => p.identifier === productId);
      if (!product) {
        setRcError("無法從 App Store 載入此訂閱產品，請稍後再試。");
        return;
      }
      await handlePurchaseProduct(product);
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
      if (nextCustomerInfo) {
        setCustomerInfo(nextCustomerInfo);
        syncFromCustomerInfo(nextCustomerInfo);
      }
    } catch (e) {
      setRcError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleStripeCheckout = async (plan: "monthly" | "yearly") => {
    setRcError(null);
    setPurchasingId(plan);
    try {
      const result = await stripeCheckoutMutation.mutateAsync({ plan });
      if (typeof window !== "undefined" && result.url) {
        window.location.href = result.url;
      }
    } catch (e) {
      setRcError(e instanceof Error ? e.message : String(e));
    } finally {
      setPurchasingId(null);
    }
  };

  const handleStripePortal = async () => {
    setRcError(null);
    setPurchasingId("portal");
    try {
      const result = await stripePortalMutation.mutateAsync();
      if (typeof window !== "undefined" && result.url) {
        window.location.href = result.url;
      }
    } catch (e) {
      setRcError(e instanceof Error ? e.message : String(e));
    } finally {
      setPurchasingId(null);
    }
  };

  const canManageStripeOnWeb =
    Platform.OS === "web" && Boolean(meQuery.data?.active || meQuery.data?.stripeCustomerId);

  const goBackToJob = () => {
    if (params.jobId) {
      router.replace(`/job/${params.jobId}`);
      return;
    }
    router.back();
  };

  const pad = screenPaddingHorizontal();

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
        <View style={{ flex: 1, maxWidth: isWeb ? 720 : undefined, alignSelf: isWeb ? "center" : "stretch", width: isWeb ? "100%" : undefined }}>
          <PageHeader
            title="解鎖聯絡資訊"
            subtitle="未訂閱可查看工作內容，但無法查看電話與電郵。"
            showBack
            onBack={goBackToJob}
          />

          <View style={{ paddingHorizontal: pad, paddingVertical: 16, gap: 16 }}>
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
                  <View style={{ flexDirection: isWeb ? "row" : "column", flexWrap: "wrap", gap: 16 }}>
                    <View style={{ flex: 1, minWidth: 280, backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>選擇訂閱</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
                      網頁版使用 Stripe 付款。同一帳戶在 App 內購買亦可解鎖聯絡資訊。
                    </Text>
                    {!meQuery.data?.active ? (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: `${colors.primary}18`,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 999,
                        }}
                      >
                        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>{WEB_LAUNCH_PROMO.badge}</Text>
                      </View>
                    ) : null}
                    {meQuery.data?.active ? (
                      <View style={{ gap: 12 }}>
                        <View style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: `${colors.primary}33` }}>
                          <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>已訂閱</Text>
                        </View>
                        {canManageStripeOnWeb ? (
                          <TouchableOpacity
                            onPress={handleStripePortal}
                            disabled={Boolean(purchasingId) || stripePortalMutation.isPending}
                            style={{
                              backgroundColor: colors.background,
                              borderRadius: 12,
                              paddingVertical: 16,
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>
                              {stripePortalMutation.isPending || purchasingId === "portal" ? "開啟中…" : "管理訂閱（取消 / 更改）"}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() => handleStripeCheckout("monthly")}
                          disabled={Boolean(purchasingId) || stripeCheckoutMutation.isPending}
                          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, alignItems: "center", gap: 6 }}
                        >
                          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Hyphen Pro 月費計劃</Text>
                          <WebPlanPrice
                            original={WEB_LAUNCH_PROMO.monthly.original}
                            sale={WEB_LAUNCH_PROMO.monthly.sale}
                            suffix="/月"
                            strikeColor="rgba(255,255,255,0.75)"
                            saleColor="#ffffff"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleStripeCheckout("yearly")}
                          disabled={Boolean(purchasingId) || stripeCheckoutMutation.isPending}
                          style={{ backgroundColor: colors.background, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.primary }}
                        >
                          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>Hyphen Pro 年費計劃</Text>
                          <WebPlanPrice
                            original={WEB_LAUNCH_PROMO.yearly.original}
                            sale={WEB_LAUNCH_PROMO.yearly.sale}
                            suffix="/年"
                            strikeColor={colors.muted}
                            saleColor={colors.primary}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                    {rcError ? <Text style={{ color: colors.error, fontSize: 12 }}>{rcError}</Text> : null}
                    </View>
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

                    {storeProducts.length > 0 && availablePackages.length === 0
                      ? storeProducts.map((product) => (
                          <TouchableOpacity
                            key={product.identifier}
                            onPress={() => handlePurchaseProduct(product)}
                            disabled={Boolean(purchasingId) || restoreLoading}
                            style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}
                          >
                            <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                              {product.title || product.identifier}（{product.priceString ?? "—"}）
                            </Text>
                          </TouchableOpacity>
                        ))
                      : null}

                    {showPreviewPlans ? (
                      PAYWALL_PREVIEW_PLANS.map((plan) => (
                        <TouchableOpacity
                          key={plan.id}
                          onPress={() => handlePurchaseProductId(plan.id)}
                          disabled={Boolean(purchasingId) || restoreLoading}
                          style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}
                        >
                          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                            {plan.title}（{plan.priceLabel}）
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : availablePackages.length === 0 && storeProducts.length === 0 ? (
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

                    {rcError ? <Text style={{ color: colors.error, fontSize: 12 }}>{rcError}</Text> : null}
                  </View>
                )}

                <View style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: `${colors.primary}33` }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>訂閱說明</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                        {subscriptionNote}
                      </Text>
                      {canManageStripeOnWeb ? (
                        <TouchableOpacity
                          onPress={handleStripePortal}
                          disabled={Boolean(purchasingId) || stripePortalMutation.isPending}
                          style={{ marginTop: 10 }}
                        >
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                            {stripePortalMutation.isPending || purchasingId === "portal" ? "開啟中…" : "管理訂閱 →"}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
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
