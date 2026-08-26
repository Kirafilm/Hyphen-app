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
import { mobileSubscriptionFromCustomerInfo } from "@/lib/subscription-sync";
import {
  formatSubscriptionExpiry,
  isMeaningfulSubscriptionExpiry,
  resolveDisplayedSubscription,
  type SubscriptionPlan,
} from "@/lib/subscription-display";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, Text, TouchableOpacity, View, Linking } from "react-native";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";
import { formatMessage } from "@/lib/i18n/helpers";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/types";
import {
  formatLaunchPromoPrice,
  formatSubscriptionAmount,
  launchPromoDisplay,
  launchPromoForLocale,
  subscriptionCurrencyForLocale,
  type SubscriptionCurrency,
} from "@/lib/subscription-pricing";
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";

const APP_VARIANT = Constants.expoConfig?.extra?.appVariant ?? "production";

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

function planDisplayTitle(
  plan: SubscriptionPlan | null,
  fallback: string,
  t: (key: string) => string,
) {
  if (plan === "monthly") return t("paywall.planMonthly");
  if (plan === "yearly") return t("paywall.planYearly");
  return fallback;
}

function billingPeriodForPlan(plan: SubscriptionPlan | null, t: (key: string) => string) {
  if (plan === "monthly") return t("paywall.lengthMonth");
  if (plan === "yearly") return t("paywall.lengthYear");
  return "—";
}

function LaunchPromoBadge({ colors, badge }: { colors: ReturnType<typeof useColors>; badge: string }) {
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
      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>{badge}</Text>
    </View>
  );
}

function PlanPrice({
  sale,
  suffix,
  currency,
  saleColor,
  saleSize,
}: {
  sale: number;
  suffix: string;
  currency: SubscriptionCurrency;
  saleColor: string;
  saleSize: number;
}) {
  return (
    <Text style={{ color: saleColor, fontWeight: "800", fontSize: saleSize, textAlign: "center" }}>
      {formatSubscriptionAmount(sale, currency)}
      {suffix}
    </Text>
  );
}

function WebPlanPrice({
  sale,
  suffix,
  currency,
  saleColor,
}: {
  sale: number;
  suffix: string;
  currency: SubscriptionCurrency;
  saleColor: string;
}) {
  return <PlanPrice sale={sale} suffix={suffix} currency={currency} saleColor={saleColor} saleSize={16} />;
}

/** Shown in dev/preview when StoreKit / Play Billing products are unavailable. */
function getPaywallPreviewPlans(
  t: (key: string) => string,
  locale: Locale,
  periodMonth: string,
  periodYear: string,
) {
  return [
    {
      id: "hyphen_pro_monthly",
      title: t("paywall.planMonthly"),
      priceLabel: formatLaunchPromoPrice("monthly", locale, periodMonth),
    },
    {
      id: "hyphen_pro_yearly",
      title: t("paywall.planYearly"),
      priceLabel: formatLaunchPromoPrice("yearly", locale, periodYear),
    },
  ] as const;
}

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
  promoPrice?: { sale: number; suffix: string; currency: SubscriptionCurrency } | null;
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
          sale={promoPrice.sale}
          suffix={promoPrice.suffix}
          currency={promoPrice.currency}
          saleColor={isOutline ? colors.primary : "#ffffff"}
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
  const { t, locale } = useLocale();
  const periodMonth = t("paywall.periodMonth");
  const periodYear = t("paywall.periodYear");
  const params = useLocalSearchParams<{ jobId?: string }>();
  const { isAuthenticated, user } = useAuth();

  const meQuery = trpc.subscription.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const authMeQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = authMeQuery.data?.role === "admin";
  const utils = trpc.useUtils();
  const { syncSubscription } = useMobileSubscriptionSync();
  const stripeCheckoutMutation = trpc.subscription.createStripeCheckout.useMutation();
  const stripePortalMutation = trpc.subscription.createStripePortal.useMutation();
  const debugActivateMutation = trpc.subscription.debugActivate.useMutation({
    onSuccess: async () => {
      await utils.subscription.me.invalidate();
      setRcError(null);
    },
    onError: (err) => {
      setRcError(err.message);
    },
  });
  const showDebugUnlock =
    isAuthenticated &&
    !meQuery.data?.active &&
    (isAdmin || __DEV__ || APP_VARIANT !== "production");

  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [storeProducts, setStoreProducts] = useState<PurchasesStoreProduct[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);
  const [lastPurchasedPlan, setLastPurchasedPlan] = useState<SubscriptionPlan | null>(null);

  const localStoreSubscription = useMemo(
    () => mobileSubscriptionFromCustomerInfo(customerInfo),
    [customerInfo],
  );
  const displayedSubscription = useMemo(() => {
    const resolved = resolveDisplayedSubscription({
      serverPlan: meQuery.data?.plan,
      serverExpiresAt: meQuery.data?.expiresAt,
      local: localStoreSubscription,
      preferLocal: Platform.OS !== "web",
    });
    const plan =
      lastPurchasedPlan && resolved.plan === "monthly" && lastPurchasedPlan === "yearly"
        ? lastPurchasedPlan
        : lastPurchasedPlan ?? resolved.plan;
    return { plan, expiresAt: resolved.expiresAt };
  }, [lastPurchasedPlan, localStoreSubscription, meQuery.data?.expiresAt, meQuery.data?.plan]);
  const isSubscribed =
    Platform.OS === "web"
      ? Boolean(meQuery.data?.active)
      : Boolean(meQuery.data?.active) || Boolean(localStoreSubscription);
  const subscriptionPlanLabel = planDisplayTitle(
    displayedSubscription.plan,
    meQuery.data?.plan ?? t("paywall.planFallback"),
    t,
  );
  const subscriptionBillingPeriod = billingPeriodForPlan(displayedSubscription.plan, t);
  const subscriptionRenewsAt =
    displayedSubscription.expiresAt && isMeaningfulSubscriptionExpiry(displayedSubscription.expiresAt)
      ? formatSubscriptionExpiry(displayedSubscription.expiresAt, locale)
      : t("paywall.autoRenews");
  const requiresWebLogin = Platform.OS === "web" && !isAuthenticated;

  const invalidateJobQueries = async () => {
    await utils.jobs.list.invalidate();
    if (params.jobId) {
      await utils.jobs.byId.invalidate({ id: params.jobId });
    }
  };

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
  const launchPromo = useMemo(() => launchPromoForLocale(locale), [locale]);
  const promoCurrency = subscriptionCurrencyForLocale(locale);

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
      return t("paywall.subscriptionNoteWeb");
    }
    if (showPreviewPlans) {
      return formatMessage(t("paywall.subscriptionNotePreview"), { store: mobileStoreName() });
    }
    if (APP_VARIANT !== "production") {
      return t("paywall.subscriptionNoteNonProd");
    }
    if (Platform.OS === "android") {
      return t("paywall.subscriptionNoteAndroid");
    }
    return t("paywall.subscriptionNoteIos");
  }, [showPreviewPlans, t]);

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
    if (Platform.OS === "web") return;

    (async () => {
      setRcError(null);
      try {
        if (isAuthenticated && user?.openId) {
          await linkRevenueCatAccount(user.openId, user.email ?? null);
        }
      } catch (e) {
        console.warn("[Paywall] RevenueCat login failed:", e);
      }

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
  }, [isAuthenticated, user?.email, user?.openId]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setRcError(null);
    setPurchasingId(pkg.identifier);
    const purchasedPlan = planFromProductId(pkg.product?.identifier ?? pkg.identifier);
    if (purchasedPlan) setLastPurchasedPlan(purchasedPlan);
    try {
      const result = await revenueCatPurchasePackage(pkg);
      const nextCustomerInfo = result?.customerInfo ?? null;
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
      await syncSubscription(nextCustomerInfo);
      await invalidateJobQueries();
      if (isAuthenticated) {
        await meQuery.refetch();
      }
    } catch (e) {
      setPaywallError(setRcError, e);
    } finally {
      setPurchasingId(null);
    }
  };

  const handlePurchaseProduct = async (product: PurchasesStoreProduct) => {
    setRcError(null);
    setPurchasingId(product.identifier);
    const purchasedPlan = planFromProductId(product.identifier);
    if (purchasedPlan) setLastPurchasedPlan(purchasedPlan);
    try {
      const result = await revenueCatPurchaseStoreProduct(product);
      const nextCustomerInfo = result?.customerInfo ?? null;
      if (nextCustomerInfo) setCustomerInfo(nextCustomerInfo);
      await syncSubscription(nextCustomerInfo);
      await invalidateJobQueries();
      if (isAuthenticated) {
        await meQuery.refetch();
      }
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
        await invalidateJobQueries();
        if (isAuthenticated) {
          await meQuery.refetch();
        }
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
          title: t("paywall.planMonthly"),
          length: t("paywall.lengthMonth"),
          price: formatLaunchPromoPrice("monthly", locale, periodMonth),
        },
        {
          title: t("paywall.planYearly"),
          length: t("paywall.lengthYear"),
          price: formatLaunchPromoPrice("yearly", locale, periodYear),
        },
      ];
    }

    const rows: Array<{ title: string; length: string; price: string }> = [];

    for (const product of sortedStoreProducts) {
      const plan = planFromProductId(product.identifier);
      if (!plan) continue;
      rows.push({
        title: planDisplayTitle(plan, product.title || product.identifier, t),
        length: plan === "monthly" ? t("paywall.lengthMonth") : t("paywall.lengthYear"),
        price: product.priceString ?? "—",
      });
    }

    for (const pkg of sortedPackages) {
      const plan = planFromProductId(pkg.product?.identifier ?? pkg.identifier);
      if (!plan) continue;
      const title = planDisplayTitle(plan, pkg.product?.title ?? t("paywall.planFallback"), t);
      if (rows.some((row) => row.title === title)) continue;
      rows.push({
        title,
        length: plan === "monthly" ? t("paywall.lengthMonth") : t("paywall.lengthYear"),
        price: pkg.product?.priceString ?? "—",
      });
    }

    if (rows.length === 0) {
      return [
        {
          title: t("paywall.planMonthly"),
          length: t("paywall.lengthMonth"),
          price: formatLaunchPromoPrice("monthly", locale, periodMonth),
        },
        {
          title: t("paywall.planYearly"),
          length: t("paywall.lengthYear"),
          price: formatLaunchPromoPrice("yearly", locale, periodYear),
        },
      ];
    }

    return rows;
  }, [locale, sortedPackages, sortedStoreProducts, t, periodMonth, periodYear]);

  const previewPlans = useMemo(
    () => getPaywallPreviewPlans(t, locale, periodMonth, periodYear),
    [locale, t, periodMonth, periodYear],
  );

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
            title={t("paywall.title")}
            subtitle={t("paywall.subtitle")}
            showBack
            onBack={goBackToJob}
          />

          <View style={{ paddingHorizontal: pad, paddingVertical: 16, gap: 16 }}>
            {requiresWebLogin ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 12 }}>
                <Ionicons name="lock-closed" size={40} color={colors.muted} />
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>{t("paywall.pleaseLogin")}</Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, marginTop: 8 }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>{t("paywall.goToLogin")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {isAuthenticated || isSubscribed ? (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>{t("paywall.statusTitle")}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14 }}>
                      {t("paywall.planLabel")}
                      {subscriptionPlanLabel}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 14 }}>
                      {t("paywall.billingPeriodLabel")}
                      {subscriptionBillingPeriod}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 14 }}>
                      {t("paywall.renewsAtLabel")}
                      {subscriptionRenewsAt}
                    </Text>
                  </View>
                ) : null}

                {Platform.OS !== "web" && !isAuthenticated ? (
                  <View
                    style={{
                      backgroundColor: `${colors.primary}10`,
                      borderRadius: 8,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: `${colors.primary}22`,
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 22 }}>{t("paywall.optionalSignInHint")}</Text>
                    <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.85}>
                      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{t("paywall.optionalSignInAction")}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {Platform.OS === "web" ? (
                  <View style={{ flexDirection: isWeb ? "row" : "column", flexWrap: "wrap", gap: 16 }}>
                    <View style={{ flex: 1, minWidth: 280, backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>{t("paywall.choosePlan")}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
                      {t("paywall.webStripeHint")}
                    </Text>
                    {!meQuery.data?.active ? <LaunchPromoBadge colors={colors} badge={t("paywall.promoBadge")} /> : null}
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
                          <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{t("paywall.subscribed")}</Text>
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
                              {stripePortalMutation.isPending || purchasingId === "portal" ? t("paywall.opening") : t("paywall.manageSubscription")}
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
                          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>{t("paywall.planMonthly")}</Text>
                          <WebPlanPrice
                            sale={launchPromo.monthly.sale}
                            suffix={periodMonth}
                            currency={promoCurrency}
                            saleColor="#ffffff"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleStripeCheckout("yearly")}
                          disabled={Boolean(purchasingId) || stripeCheckoutMutation.isPending}
                          style={{ backgroundColor: colors.background, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.primary }}
                        >
                          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>{t("paywall.planYearly")}</Text>
                          <WebPlanPrice
                            sale={launchPromo.yearly.sale}
                            suffix={periodYear}
                            currency={promoCurrency}
                            saleColor={colors.primary}
                          />
                        </TouchableOpacity>
                        {showDebugUnlock ? (
                          <TouchableOpacity
                            onPress={() =>
                              debugActivateMutation.mutate({
                                plan: "yearly",
                                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                              })
                            }
                            disabled={debugActivateMutation.isPending}
                            style={{
                              backgroundColor: "rgba(59, 130, 246, 0.12)",
                              borderRadius: 12,
                              paddingVertical: 14,
                              paddingHorizontal: 12,
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: "rgba(59, 130, 246, 0.35)",
                            }}
                          >
                            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                              {debugActivateMutation.isPending
                                ? "解鎖中…"
                                : isAdmin
                                  ? "萬用帳號：測試解鎖一年訂閱"
                                  : "開發測試：解鎖一年訂閱"}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </>
                    )}
                    {rcError ? <Text style={{ color: colors.error, fontSize: 12 }}>{rcError}</Text> : null}
                    </View>
                  </View>
                ) : isSubscribed ? (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>{t("paywall.manageTitle")}</Text>
                    <View style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: `${colors.primary}33`, gap: 4 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{t("paywall.unlocked")}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{t("paywall.renewsAtLabel")}{subscriptionRenewsAt}</Text>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
                      {Platform.OS === "android" ? t("paywall.androidManageHint") : t("paywall.iosManageHint")}
                    </Text>
                    {Platform.OS === "ios" ? (
                      <TouchableOpacity
                        onPress={() => void Linking.openURL("https://apps.apple.com/account/subscriptions")}
                        style={{ backgroundColor: colors.background, borderRadius: 8, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
                      >
                        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}>{t("paywall.openAppStoreManage")}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 18 }}>{t("paywall.choosePlan")}</Text>

                    {showLaunchPromo ? <LaunchPromoBadge colors={colors} badge={t("paywall.promoBadge")} /> : null}

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
                              title={planDisplayTitle(plan, product.title || product.identifier, t)}
                              promoPrice={showLaunchPromo ? launchPromoDisplay(plan, locale, periodMonth, periodYear) : null}
                              priceLabel={product.priceString ?? "—"}
                              variant={plan === "yearly" ? "outline" : "primary"}
                              onPress={() => handlePurchaseProduct(product)}
                              disabled={Boolean(purchasingId) || restoreLoading}
                              loadingLabel={
                                purchasingId === product.identifier ? t("paywall.processing") : null
                              }
                              colors={colors}
                            />
                          );
                        })
                      : null}

                    {showPreviewPlans ? (
                      previewPlans.map((plan) => {
                        const planType = planFromProductId(plan.id);
                        return (
                          <SubscriptionPlanButton
                            key={plan.id}
                            title={plan.title}
                            promoPrice={showLaunchPromo ? launchPromoDisplay(planType, locale, periodMonth, periodYear) : null}
                            priceLabel={plan.priceLabel}
                            variant={planType === "yearly" ? "outline" : "primary"}
                            onPress={() => handlePurchaseProductId(plan.id)}
                            disabled={Boolean(purchasingId) || restoreLoading}
                            loadingLabel={purchasingId === plan.id ? t("paywall.processing") : null}
                            colors={colors}
                          />
                        );
                      })
                    ) : availablePackages.length === 0 && storeProducts.length === 0 ? (
                      <Text style={{ color: colors.muted, fontSize: 14 }}>{t("paywall.loadingPlans")}</Text>
                    ) : (
                      sortedPackages.map((pkg) => {
                        const productId = pkg.product?.identifier ?? pkg.identifier;
                        const plan = planFromProductId(productId);
                        return (
                          <SubscriptionPlanButton
                            key={pkg.identifier}
                            title={planDisplayTitle(plan, pkg.product?.title ?? t("paywall.planFallback"), t)}
                            promoPrice={showLaunchPromo ? launchPromoDisplay(plan, locale, periodMonth, periodYear) : null}
                            priceLabel={pkg.product?.priceString ?? "—"}
                            variant={plan === "yearly" ? "outline" : "primary"}
                            onPress={() => handlePurchase(pkg)}
                            disabled={Boolean(purchasingId) || restoreLoading}
                            loadingLabel={purchasingId === pkg.identifier ? t("paywall.processing") : null}
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
                        {restoreLoading ? t("paywall.restoring") : t("paywall.restorePurchases")}
                      </Text>
                    </TouchableOpacity>

                    {rcError ? <Text style={{ color: colors.error, fontSize: 12 }}>{rcError}</Text> : null}
                  </View>
                )}

                <View style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: `${colors.primary}33` }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{t("paywall.noteTitle")}</Text>
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
                            {stripePortalMutation.isPending || purchasingId === "portal" ? t("paywall.opening") : t("paywall.manageSubscriptionShort")}
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
