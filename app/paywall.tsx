import { useAuth } from "@/hooks/use-auth";
import { useMobileSubscriptionSync } from "@/hooks/use-mobile-subscription-sync";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { SubscriptionDisclosure } from "@/components/subscription-disclosure";
import { useColors } from "@/hooks/use-colors";
import {
  findStoreProductById,
  formatRevenueCatPaywallError,
  linkRevenueCatAccount,
  planFromProductId,
  productIdsMatch,
  revenueCatGetCustomerInfo,
  revenueCatGetOfferings,
  revenueCatGetSubscriptionProducts,
  revenueCatPurchasePackage,
  revenueCatPurchaseStoreProduct,
  revenueCatRestorePurchases,
  SUBSCRIPTION_PRODUCT_IDS,
  type PurchasesStoreProduct,
} from "@/lib/revenuecat";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, Text, TouchableOpacity, View, Linking } from "react-native";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";

const APP_VARIANT = Constants.expoConfig?.extra?.appVariant ?? "production";

const LAUNCH_PROMO = {
  badge: "平台新上線特價優惠",
  monthly: { original: 288, sale: 128 },
  yearly: { original: 2888, sale: 1328 },
} as const;

function launchPromoForPlan(plan: "monthly" | "yearly" | null) {
  if (!plan) return null;
  return {
    original: LAUNCH_PROMO[plan].original,
    sale: LAUNCH_PROMO[plan].sale,
    suffix: plan === "monthly" ? "/月" : "/年",
  };
}

function launchPromoPriceLabel(plan: "monthly" | "yearly") {
  return `HK$${LAUNCH_PROMO[plan].sale.toLocaleString()}${plan === "monthly" ? "/月" : "/年"}`;
}

function mobileStoreName() {
  return Platform.OS === "android" ? "Google Play" : "App Store";
}

function storeProductLoadError() {
  return formatRevenueCatPaywallError(new Error("configuration"), {
    storeName: mobileStoreName(),
  })!;
}

function setPaywallError(
  setter: (value: string | null) => void,
  error: unknown,
) {
  setter(formatRevenueCatPaywallError(error, { storeName: mobileStoreName() }));
}

function planDisplayTitle(plan: "monthly" | "yearly" | null, fallback: string) {
  if (plan === "monthly") return "Hyphen Pro 月費計劃";
  if (plan === "yearly") return "Hyphen Pro 年費計劃";
  return fallback;
}

function LaunchPromoBadge({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: `${colors.primary}18`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>{LAUNCH_PROMO.badge}</Text>
    </View>
  );
}

function PlanPrice({
  original,
  sale,
  suffix,
  strikeColor,
  saleColor,
  strikeSize,
  saleSize,
}: {
  original: number;
  sale: number;
  suffix: string;
  strikeColor: string;
  saleColor: string;
  strikeSize: number;
  saleSize: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      <Text style={{ color: strikeColor, fontSize: strikeSize, textDecorationLine: "line-through" }}>
        HK${original.toLocaleString()}
        {suffix}
      </Text>
      <Text style={{ color: saleColor, fontWeight: "800", fontSize: saleSize }}>
        HK${sale.toLocaleString()}
        {suffix}
      </Text>
    </View>
  );
}

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
    <PlanPrice
      original={original}
      sale={sale}
      suffix={suffix}
      strikeColor={strikeColor}
      saleColor={saleColor}
      strikeSize={14}
      saleSize={16}
    />
  );
}

/** Shown in dev/preview when StoreKit / Play Billing products are unavailable. */
const PAYWALL_PREVIEW_PLANS = [
  { id: "hyphen_pro_monthly", title: "Hyphen Pro 月費計劃", priceLabel: launchPromoPriceLabel("monthly") },
  { id: "hyphen_pro_yearly", title: "Hyphen Pro 年費計劃", priceLabel: launchPromoPriceLabel("yearly") },
] as const;

function SubscriptionPlanButton({
  title,
  priceLabel,
  promoPrice,
  variant = "primary",
  onPress,
  disabled,
  loadingLabel,
  colors,
}: {
  title: string;
  priceLabel?: string;
  promoPrice?: { original: number; sale: number; suffix: string } | null;
  variant?: "primary" | "outline";
  onPress: () => void;
  disabled?: boolean;
  loadingLabel?: string | null;
  colors: ReturnType<typeof useColors>;
}) {
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: isOutline ? colors.background : colors.primary,
        borderRadius: isOutline ? 12 : 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        borderWidth: isOutline ? 1 : 0,
        borderColor: isOutline ? colors.primary : undefined,
      }}
    >
      <Text
        style={{
          color: isOutline ? colors.primary : "white",
          fontWeight: "700",
          fontSize: 13,
          lineHeight: 18,
          textAlign: "center",
        }}
      >
        {loadingLabel ?? title}
      </Text>
      {!loadingLabel && promoPrice ? (
        <PlanPrice
          original={promoPrice.original}
          sale={promoPrice.sale}
          suffix={promoPrice.suffix}
          strikeColor={isOutline ? colors.muted : "rgba(255,255,255,0.75)"}
          saleColor={isOutline ? colors.primary : "#ffffff"}
          strikeSize={12}
          saleSize={13}
        />
      ) : !loadingLabel && priceLabel ? (
        <Text
          style={{
            color: isOutline ? colors.primary : "rgba(255,255,255,0.92)",
            fontWeight: "600",
            fontSize: 13,
            lineHeight: 18,
            textAlign: "center",
          }}
        >
          {priceLabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const { isAuthenticated, user } = useAuth();

  const meQuery = trpc.subscription.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { syncSubscription } = useMobileSubscriptionSync();
  const stripeCheckoutMutation = trpc.subscription.createStripeCheckout.useMutation();
  const stripePortalMutation = trpc.subscription.createStripePortal.useMutation();

  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [storeProducts, setStoreProducts] = useState<PurchasesStoreProduct[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);

  const isSubscribed = Boolean(meQuery.data?.active);
  const subscriptionExpiresAt = meQuery.data?.expiresAt
    ? new Date(meQuery.data.expiresAt).toLocaleString()
    : "—";

  const availablePackages: PurchasesPackage[] = useMemo(() => {
    const pkgs = offerings?.current?.availablePackages;
    return Array.isArray(pkgs) ? pkgs : [];
  }, [offerings]);

  const showPreviewPlans =
    Platform.OS !== "web" &&
    (APP_VARIANT !== "production" || __DEV__) &&
    !isSubscribed &&
    availablePackages.length === 0 &&
    storeProducts.length === 0;

  const showLaunchPromo = !isSubscribed;

  const sortedStoreProducts = useMemo(() => {
    const order = { monthly: 0, yearly: 1 } as const;
    return [...storeProducts].sort((a, b) => {
      const planA = planFromProductId(a.identifier);
      const planB = planFromProductId(b.identifier);
      return (planA ? order[planA] : 2) - (planB ? order[planB] : 2);
    });
  }, [storeProducts]);

  const sortedPackages = useMemo(() => {
    const order = { monthly: 0, yearly: 1 } as const;
    return [...availablePackages].sort((a, b) => {
      const planA = planFromProductId(a.product?.identifier ?? a.identifier);
      const planB = planFromProductId(b.product?.identifier ?? b.identifier);
      return (planA ? order[planA] : 2) - (planB ? order[planB] : 2);
    });
  }, [availablePackages]);

  const subscriptionNote = useMemo(() => {
    if (Platform.OS === "web") {
      return "付款由 Stripe 安全處理。訂閱會自動續期。如需取消或更改方案，請點擊「管理訂閱」進入 Stripe 安全頁面自行操作。";
    }
    if (showPreviewPlans) {
      return `付款將由 ${mobileStoreName()} 處理。訂閱會自動續期，可隨時在 ${mobileStoreName()} 設定中取消。`;
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
      if (!product.identifier) continue;
      map.set(product.identifier, product);
      for (const productId of SUBSCRIPTION_PRODUCT_IDS) {
        if (productIdsMatch(product.identifier, productId)) {
          map.set(productId, product);
        }
      }
    }
    return map;
  }, [storeProducts]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;

    (async () => {
      setRcError(null);
      try {
        if (user?.openId) {
          await linkRevenueCatAccount(user.openId, user.email ?? null);
        }
      } catch (e) {
        console.warn("[Paywall] RevenueCat login failed:", e);
      }

      if (isSubscribed) return;

      try {
        const nextOfferings = await revenueCatGetOfferings();
        if (nextOfferings) setOfferings(nextOfferings);
      } catch (e) {
        console.warn("[Paywall] offerings unavailable:", e);
      }

      try {
        const products = await revenueCatGetSubscriptionProducts();
        setStoreProducts(products);
      } catch (e) {
        console.warn("[Paywall] store products unavailable:", e);
      }

      try {
        const nextCustomerInfo = await revenueCatGetCustomerInfo();
        if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
      } catch (e) {
        console.warn("[Paywall] customer info unavailable:", e);
      }
    })();
  }, [isAuthenticated, isSubscribed, user?.email, user?.openId]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setRcError(null);
    setPurchasingId(pkg.identifier);
    try {
      const result = await revenueCatPurchasePackage(pkg);
      const nextCustomerInfo = result?.customerInfo ?? null;
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
      await syncSubscription(nextCustomerInfo);
      await meQuery.refetch();
    } catch (e) {
      setPaywallError(setRcError, e);
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
      await syncSubscription(nextCustomerInfo);
      await meQuery.refetch();
    } catch (e) {
      setPaywallError(setRcError, e);
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
      const product = findStoreProductById(products, productId);
      if (!product) {
        setRcError(storeProductLoadError());
        return;
      }
      await handlePurchaseProduct(product);
    } catch (e) {
      setPaywallError(setRcError, e);
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
        await syncSubscription(nextCustomerInfo);
        await meQuery.refetch();
      }
    } catch (e) {
      setPaywallError(setRcError, e);
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

  const disclosurePlans = useMemo(() => {
    if (Platform.OS === "web") {
      return [
        {
          title: "Hyphen Pro 月費計劃",
          length: "1 個月",
          price: `HK$${LAUNCH_PROMO.monthly.sale.toLocaleString()}/月`,
        },
        {
          title: "Hyphen Pro 年費計劃",
          length: "1 年",
          price: `HK$${LAUNCH_PROMO.yearly.sale.toLocaleString()}/年`,
        },
      ];
    }

    const rows: Array<{ title: string; length: string; price: string }> = [];

    for (const product of sortedStoreProducts) {
      const plan = planFromProductId(product.identifier);
      if (!plan) continue;
      rows.push({
        title: planDisplayTitle(plan, product.title || product.identifier),
        length: plan === "monthly" ? "1 個月" : "1 年",
        price: product.priceString ?? "—",
      });
    }

    for (const pkg of sortedPackages) {
      const plan = planFromProductId(pkg.product?.identifier ?? pkg.identifier);
      if (!plan) continue;
      if (rows.some((row) => row.title === planDisplayTitle(plan, pkg.product?.title ?? "訂閱"))) continue;
      rows.push({
        title: planDisplayTitle(plan, pkg.product?.title ?? "訂閱"),
        length: plan === "monthly" ? "1 個月" : "1 年",
        price: pkg.product?.priceString ?? "—",
      });
    }

    if (rows.length === 0) {
      return [
        {
          title: "Hyphen Pro 月費計劃",
          length: "1 個月",
          price: launchPromoPriceLabel("monthly"),
        },
        {
          title: "Hyphen Pro 年費計劃",
          length: "1 年",
          price: launchPromoPriceLabel("yearly"),
        },
      ];
    }

    return rows;
  }, [sortedPackages, sortedStoreProducts]);

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
      <ScreenScroll contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
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
                    {!meQuery.data?.active ? <LaunchPromoBadge colors={colors} /> : null}
                    {!meQuery.data?.active ? (
                      <View
                        style={{
                          backgroundColor: colors.background,
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <SubscriptionDisclosure plans={disclosurePlans} />
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
                            original={LAUNCH_PROMO.monthly.original}
                            sale={LAUNCH_PROMO.monthly.sale}
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
                            original={LAUNCH_PROMO.yearly.original}
                            sale={LAUNCH_PROMO.yearly.sale}
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
                ) : isSubscribed ? (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>訂閱管理</Text>
                    <View style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: `${colors.primary}33`, gap: 4 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>已解鎖</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>到期：{subscriptionExpiresAt}</Text>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
                      {Platform.OS === "android"
                        ? "如需取消或更改方案，請前往 Google Play → 付款與訂閱 管理。"
                        : "如需取消或更改方案，請前往 設定 → Apple ID → 訂閱 管理。"}
                    </Text>
                    {Platform.OS === "ios" ? (
                      <TouchableOpacity
                        onPress={() => void Linking.openURL("https://apps.apple.com/account/subscriptions")}
                        style={{ backgroundColor: colors.background, borderRadius: 8, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
                      >
                        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}>前往 App Store 管理訂閱</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>選擇訂閱</Text>

                    {showLaunchPromo ? <LaunchPromoBadge colors={colors} /> : null}

                    <View
                      style={{
                        backgroundColor: colors.background,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <SubscriptionDisclosure plans={disclosurePlans} />
                    </View>

                    {sortedStoreProducts.length > 0 && availablePackages.length === 0
                      ? sortedStoreProducts.map((product) => {
                          const plan = planFromProductId(product.identifier);
                          return (
                            <SubscriptionPlanButton
                              key={product.identifier}
                              title={planDisplayTitle(plan, product.title || product.identifier)}
                              promoPrice={showLaunchPromo ? launchPromoForPlan(plan) : null}
                              priceLabel={product.priceString ?? "—"}
                              variant={plan === "yearly" ? "outline" : "primary"}
                              onPress={() => handlePurchaseProduct(product)}
                              disabled={Boolean(purchasingId) || restoreLoading}
                              loadingLabel={
                                purchasingId === product.identifier ? "處理中…" : null
                              }
                              colors={colors}
                            />
                          );
                        })
                      : null}

                    {showPreviewPlans ? (
                      PAYWALL_PREVIEW_PLANS.map((plan) => {
                        const planType = planFromProductId(plan.id);
                        return (
                          <SubscriptionPlanButton
                            key={plan.id}
                            title={plan.title}
                            promoPrice={showLaunchPromo ? launchPromoForPlan(planType) : null}
                            priceLabel={plan.priceLabel}
                            variant={planType === "yearly" ? "outline" : "primary"}
                            onPress={() => handlePurchaseProductId(plan.id)}
                            disabled={Boolean(purchasingId) || restoreLoading}
                            loadingLabel={purchasingId === plan.id ? "處理中…" : null}
                            colors={colors}
                          />
                        );
                      })
                    ) : availablePackages.length === 0 && storeProducts.length === 0 ? (
                      <Text style={{ color: colors.muted, fontSize: 14 }}>載入訂閱方案中…</Text>
                    ) : (
                      sortedPackages.map((pkg) => {
                        const productId = pkg.product?.identifier ?? pkg.identifier;
                        const plan = planFromProductId(productId);
                        return (
                          <SubscriptionPlanButton
                            key={pkg.identifier}
                            title={planDisplayTitle(plan, pkg.product?.title ?? "訂閱")}
                            promoPrice={showLaunchPromo ? launchPromoForPlan(plan) : null}
                            priceLabel={pkg.product?.priceString ?? "—"}
                            variant={plan === "yearly" ? "outline" : "primary"}
                            onPress={() => handlePurchase(pkg)}
                            disabled={Boolean(purchasingId) || restoreLoading}
                            loadingLabel={purchasingId === pkg.identifier ? "處理中…" : null}
                            colors={colors}
                          />
                        );
                      })
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
      </ScreenScroll>
    </AppScreen>
  );
}
