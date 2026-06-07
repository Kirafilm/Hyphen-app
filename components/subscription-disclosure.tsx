import { Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/use-colors";
import { getPrivacyPolicyUrl, getTermsOfUseUrl } from "@/lib/legal-urls";

type PlanRow = {
  title: string;
  length: string;
  price: string;
};

type SubscriptionDisclosureProps = {
  plans: PlanRow[];
};

function LegalLink({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function SubscriptionDisclosure({ plans }: SubscriptionDisclosureProps) {
  const colors = useColors();
  const router = useRouter();

  const openPrivacy = () => {
    if (Platform.OS === "web") {
      router.push("/privacy");
      return;
    }
    void Linking.openURL(getPrivacyPolicyUrl());
  };

  const openTerms = () => {
    if (Platform.OS === "web") {
      router.push("/terms");
      return;
    }
    void Linking.openURL(getTermsOfUseUrl());
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>Hyphen Pro 訂閱內容</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
          訂閱後可解鎖查看自由工作聯絡資訊（電話、電郵），並持續使用完整瀏覽功能。未訂閱用戶只可查看工作描述，無法查看聯絡方式。
        </Text>
      </View>

      {plans.map((plan) => (
        <View
          key={plan.title}
          style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 4,
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>{plan.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>訂閱週期：{plan.length}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>價格：{plan.price}（自動續期，直至取消）</Text>
        </View>
      ))}

      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
        付款會從你的 Apple ID 或 Google Play 帳戶扣款。訂閱會自動續期，除非在當期結束前至少 24 小時關閉自動續期。你可於 App Store /
        Google Play 的訂閱設定中管理或取消。
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <LegalLink label="私隱政策" onPress={openPrivacy} colors={colors} />
        <LegalLink label="使用條款（EULA）" onPress={openTerms} colors={colors} />
      </View>
    </View>
  );
}
