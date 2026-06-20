import { Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/use-colors";
import { formatMessage } from "@/lib/i18n/helpers";
import { useLocale } from "@/lib/i18n/locale-provider";
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
  const { t } = useLocale();

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

  const paymentNoteKey =
    Platform.OS === "ios"
      ? "subscriptionDisclosure.paymentNoteIos"
      : Platform.OS === "android"
        ? "subscriptionDisclosure.paymentNoteAndroid"
        : "subscriptionDisclosure.paymentNote";

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>{t("subscriptionDisclosure.title")}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{t("subscriptionDisclosure.body")}</Text>
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
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {t("subscriptionDisclosure.cycleLabel")}
            {plan.length}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {formatMessage(t("subscriptionDisclosure.priceLabel"), { price: plan.price })}
          </Text>
        </View>
      ))}

      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{t(paymentNoteKey)}</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <LegalLink label={t("subscriptionDisclosure.privacyLink")} onPress={openPrivacy} colors={colors} />
        <LegalLink label={t("subscriptionDisclosure.termsLink")} onPress={openTerms} colors={colors} />
      </View>
    </View>
  );
}
