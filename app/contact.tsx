import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { isEmailJsConfigured, sendContactEmail } from "@/lib/emailjs";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocale } from "@/lib/i18n/locale-provider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FormRow({
  label,
  required,
  borderColor,
  labelColor,
  errorColor,
  children,
}: {
  label: string;
  required?: boolean;
  borderColor: string;
  labelColor: string;
  errorColor: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <Text style={{ color: labelColor, fontWeight: "700", fontSize: 14 }}>
        {label}
        {required ? <Text style={{ color: errorColor }}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export default function ContactScreen() {
  const colors = useColors();
  const { t } = useLocale();

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const emailJsReady = isEmailJsConfigured();

  const canSubmit = useMemo(() => {
    return Boolean(contactName.trim() && email.trim() && message.trim());
  }, [contactName, email, message]);

  const inputStyle = {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    minHeight: 48,
  } as const;

  const handleSend = async () => {
    const trimmedName = contactName.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setError(t("contact.errors.allRequired"));
      setSuccess(null);
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("contact.errors.invalidEmail"));
      setSuccess(null);
      return;
    }
    if (!emailJsReady) {
      setError(t("contact.errors.notReady"));
      setSuccess(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await sendContactEmail({
        contactName: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });
      setSuccess(t("contact.success"));
      setContactName("");
      setEmail("");
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("contact.errors.sendFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <PageHeader title={t("contact.title")} subtitle={t("contact.subtitle")} showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScreenScroll
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 40 }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                backgroundColor: `${colors.primary}14`,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>{t("contact.formTitle")}</Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              <FormRow
                label={t("contact.nameLabel")}
                required
                borderColor={colors.border}
                labelColor={colors.foreground}
                errorColor={colors.error}
              >
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder={t("contact.namePlaceholder")}
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  style={inputStyle}
                />
              </FormRow>

              <FormRow
                label={t("contact.emailLabel")}
                required
                borderColor={colors.border}
                labelColor={colors.foreground}
                errorColor={colors.error}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={inputStyle}
                />
              </FormRow>

              <FormRow
                label={t("contact.messageLabel")}
                required
                borderColor={colors.border}
                labelColor={colors.foreground}
                errorColor={colors.error}
              >
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t("contact.messagePlaceholder")}
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  style={{ ...inputStyle, minHeight: 140, paddingTop: 12 }}
                />
              </FormRow>
            </View>
          </View>

          {error ? <Text style={{ color: colors.error, fontSize: 14, marginTop: 16 }}>{error}</Text> : null}
          {success ? <Text style={{ color: colors.primary, fontSize: 14, marginTop: 16, fontWeight: "600" }}>{success}</Text> : null}

          {!emailJsReady && (
            <View
              style={{
                marginTop: 16,
                backgroundColor: `${colors.primary}14`,
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: `${colors.primary}33`,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
                {t("contact.notReadyHint")}
              </Text>
            </View>
          )}

          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel={t("contact.send")}
            onPress={handleSend}
            disabled={!canSubmit || submitting || !emailJsReady}
            style={{
              marginTop: 20,
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              opacity: !canSubmit || submitting || !emailJsReady ? 0.65 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}>{t("contact.send")}</Text>
            )}
          </TouchableOpacity>

          <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 24 }}>
            © Hyphen - All Rights Reserved
          </Text>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
