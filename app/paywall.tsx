import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";

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
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="bg-primary px-6 py-6 gap-2">
            <TouchableOpacity onPress={goBackToJob} className="w-8 h-8">
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-background mt-2">解鎖聯絡資訊</Text>
            <Text className="text-sm text-background opacity-90">
              未訂閱可查看工作內容，但無法查看電話與電郵。
            </Text>
          </View>

          <View className="px-6 py-8 gap-4">
            {!isAuthenticated ? (
              <View className="bg-surface rounded-lg p-6 border border-border items-center gap-3">
                <Ionicons name="lock-closed" size={40} color={colors.muted} />
                <Text className="text-foreground font-semibold">請先登入</Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  className="bg-primary rounded-lg py-3 px-5 mt-2 active:opacity-80"
                >
                  <Text className="text-white font-semibold">前往登入</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View className="bg-surface rounded-lg p-6 border border-border gap-2">
                  <Text className="text-foreground font-bold text-lg">你的訂閱狀態</Text>
                  <Text className="text-muted text-sm">
                    方案：{meQuery.data?.plan ?? "載入中"}
                  </Text>
                  <Text className="text-muted text-sm">
                    到期：{meQuery.data?.expiresAt ? new Date(meQuery.data.expiresAt).toLocaleString() : "—"}
                  </Text>
                </View>

                {Platform.OS === "web" ? (
                  <View className="bg-surface rounded-lg p-6 border border-border gap-2">
                    <Text className="text-foreground font-bold text-lg">選擇訂閱</Text>
                    <Text className="text-muted text-sm leading-relaxed">
                      Web 版暫未支援內購，請使用 iOS/Android App 內完成訂閱。
                    </Text>
                  </View>
                ) : (
                  <View className="bg-surface rounded-lg p-6 border border-border gap-4">
                    <Text className="text-foreground font-bold text-lg">選擇訂閱</Text>

                    {isEntitled ? (
                      <View className="bg-primary bg-opacity-10 rounded-lg p-4 border border-primary border-opacity-20 gap-1">
                        <Text className="text-foreground font-semibold text-sm">已解鎖</Text>
                        <Text className="text-muted text-xs">到期：{entitlementExpiresAt}</Text>
                      </View>
                    ) : null}

                    {availablePackages.length === 0 ? (
                      <Text className="text-muted text-sm">載入訂閱方案中…</Text>
                    ) : (
                      availablePackages.map((pkg) => (
                        <TouchableOpacity
                          key={pkg.identifier}
                          onPress={() => handlePurchase(pkg)}
                          disabled={Boolean(purchasingId) || restoreLoading}
                          className="bg-primary rounded-lg py-4 items-center justify-center active:opacity-80"
                        >
                          <Text className="text-white font-semibold text-base">
                            {pkg.product?.title ?? "訂閱"}（{pkg.product?.priceString ?? "—"}）
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}

                    <TouchableOpacity
                      onPress={handleRestore}
                      disabled={Boolean(purchasingId) || restoreLoading}
                      className="bg-surface rounded-lg py-4 items-center justify-center border border-border active:opacity-80"
                    >
                      <Text className="text-foreground font-semibold text-base">
                        {restoreLoading ? "恢復中…" : "恢復購買"}
                      </Text>
                    </TouchableOpacity>

                    {rcError ? <Text className="text-error text-xs">{rcError}</Text> : null}
                  </View>
                )}

                <View className="bg-primary bg-opacity-10 rounded-lg p-4 border border-primary border-opacity-20">
                  <View className="flex-row gap-3">
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold text-sm">RevenueCat</Text>
                      <Text className="text-muted text-xs mt-1 leading-relaxed">
                        App 端完成購買後，會先以 RevenueCat entitlement 判斷是否解鎖；目前亦會同步更新測試訂閱狀態，方便你即時驗證「查看聯絡資訊」流程。
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
