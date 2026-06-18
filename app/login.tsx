import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import * as Auth from "@/lib/_core/auth";
import { persistAuthSession } from "@/lib/auth-session";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthRedirectUrl } from "@/lib/auth-redirect";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useLocale();
  const { refresh } = useAuth({ autoFetch: false });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    return true;
  }, [email, password]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setMode("login");
        setInfo(t("login.errors.setNewPassword"));
        setError(null);
      }
    });

    if (isWeb && typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecoveryMode(true);
      setInfo(t("login.errors.setNewPassword"));
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canUpdatePassword = useMemo(() => {
    return newPassword.trim().length >= 6 && newPassword === confirmPassword;
  }, [confirmPassword, newPassword]);

  const persistNativeUserInfo = async (authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null) => {
    if (!authUser) return;

    const metadata = authUser.user_metadata ?? {};
    const rawName = metadata.name ?? metadata.full_name;
    const name = typeof rawName === "string" ? rawName : null;

    await Auth.setUserInfo({
      id: authUser.id as unknown as number,
      openId: authUser.id,
      name,
      email: authUser.email ?? null,
      loginMethod: "email",
      lastSignedIn: new Date(),
    });
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("login.errors.emailRequired"));
      setInfo(null);
      return;
    }

    setResettingPassword(true);
    setError(null);
    setInfo(null);
    try {
      if (!isSupabaseConfigured) {
        setError(t("login.errors.supabaseNotConfigured"));
        return;
      }
      const redirectTo = getAuthRedirectUrl("/login");
      const result = await getSupabase().auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
      if (result.error) throw result.error;
      setInfo(t("login.errors.resetSent"));
    } catch (e) {
      const message = e instanceof Error ? e.message : t("login.errors.resetFailed");
      setError(message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!canUpdatePassword || updatingPassword) return;
    setUpdatingPassword(true);
    setError(null);
    setInfo(null);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      const { data, error: sessionError } = await getSupabase().auth.getSession();
      if (sessionError) throw sessionError;
      const token = data.session?.access_token;
      if (!token) throw new Error(t("login.errors.passwordUpdatedNoSession"));

      await persistAuthSession(data.session);
      await persistNativeUserInfo(data.session?.user ?? null);
      try {
        await refresh();
      } catch (refreshError) {
        console.warn("[Login] refresh after password reset failed:", refreshError);
      }
      setRecoveryMode(false);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("login.errors.updateFailed"));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const submit = async () => {
    if (!canSubmit || submitting) return;
    if (!isSupabaseConfigured) {
      setError(t("login.errors.supabaseNotConfigured"));
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = getSupabase();
      if (mode === "login") {
        const result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (result.error) throw result.error;
        const token = result.data.session?.access_token;
        if (!token) throw new Error(t("login.errors.loginFailed"));
        await persistAuthSession(result.data.session);
        await persistNativeUserInfo(result.data.user);
        try {
          await refresh();
        } catch (refreshError) {
          console.warn("[Login] refresh after sign-in failed:", refreshError);
        }
        router.replace("/(tabs)");
        return;
      }

      const result = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      if (result.error) throw result.error;
      const token = result.data.session?.access_token;
      if (token) {
        await persistAuthSession(result.data.session);
        await persistNativeUserInfo(result.data.user);
        try {
          await refresh();
        } catch (refreshError) {
          console.warn("[Login] refresh after sign-up failed:", refreshError);
        }
        router.replace("/(tabs)");
        return;
      }
      setInfo(t("login.errors.signupCheckEmail"));
    } catch (e) {
      const message = e instanceof Error ? e.message : t("login.errors.loginFailed");
      setError(message);
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
    } finally {
      setSubmitting(false);
    }
  };

  const pad = screenPaddingHorizontal();

  return (
    <AppScreen>
      <ScreenScroll contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
        <View style={{ flex: 1, maxWidth: isWeb ? 520 : undefined, alignSelf: isWeb ? "center" : "stretch", width: isWeb ? "100%" : undefined }}>
          <PageHeader
            title={t("login.title")}
            subtitle={t("login.subtitle")}
            showBack
          />

          <View style={{ paddingHorizontal: pad, paddingVertical: 16, gap: 16 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ alignItems: "center", gap: 12 }}>
                <View style={{ width: 64, height: 64, backgroundColor: colors.primary, borderRadius: 32, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="log-in" size={32} color="white" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, textAlign: "center" }}>{t("login.cardTitle")}</Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
                  {t("login.cardBody")}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
              {recoveryMode ? (
                <>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 18 }}>{t("login.resetTitle")}</Text>
                  <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{t("login.resetHint")}</Text>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>{t("login.newPassword")}</Text>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder={t("login.passwordPlaceholder")}
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                      style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: colors.foreground, borderWidth: 1, borderColor: colors.border }}
                    />
                  </View>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>{t("login.confirmPassword")}</Text>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder={t("login.confirmPasswordPlaceholder")}
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                      style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: colors.foreground, borderWidth: 1, borderColor: colors.border }}
                    />
                  </View>
                  {error && <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>}
                  {info && <Text style={{ color: colors.muted, fontSize: 14 }}>{info}</Text>}
                  <TouchableOpacity
                    onPress={handleUpdatePassword}
                    disabled={!canUpdatePassword || updatingPassword}
                    style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center", opacity: !canUpdatePassword || updatingPassword ? 0.8 : 1 }}
                  >
                    {updatingPassword ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>{t("login.updatePassword")}</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={t("login.switchToLogin")}
                  onPress={() => setMode("login")}
                  style={
                    mode === "login"
                      ? { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center" }
                      : { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }
                  }
                >
                  <Text style={mode === "login" ? { color: "white", fontWeight: "600" } : { color: colors.foreground, fontWeight: "600" }}>
                    {t("login.loginTab")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={t("login.switchToSignup")}
                  onPress={() => setMode("signup")}
                  style={
                    mode === "signup"
                      ? { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center" }
                      : { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }
                  }
                >
                  <Text style={mode === "signup" ? { color: "white", fontWeight: "600" } : { color: colors.foreground, fontWeight: "600" }}>
                    {t("login.signupTab")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>{t("login.email")}</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: colors.foreground, borderWidth: 1, borderColor: colors.border }}
                />
              </View>

              <View>
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>{t("login.password")}</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("login.passwordPlaceholder")}
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: colors.foreground, borderWidth: 1, borderColor: colors.border }}
                />
              </View>

              {error && <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>}
              {info && <Text style={{ color: colors.muted, fontSize: 14 }}>{info}</Text>}

              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel={mode === "login" ? t("login.submitLogin") : t("login.submitSignup")}
                onPress={submit}
                disabled={!canSubmit || submitting || resettingPassword}
                style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center", opacity: (!canSubmit || submitting || resettingPassword) ? 0.8 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                    {mode === "login" ? t("login.submitLogin") : t("login.submitSignup")}
                  </Text>
                )}
              </TouchableOpacity>

              {mode === "login" && (
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={t("login.forgotPassword")}
                  onPress={handleForgotPassword}
                  disabled={submitting || resettingPassword}
                  style={{
                    borderRadius: 8,
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    opacity: submitting || resettingPassword ? 0.8 : 1,
                  }}
                >
                  {resettingPassword ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 15 }}>{t("login.forgotPassword")}</Text>
                  )}
                </TouchableOpacity>
              )}
                </>
              )}
            </View>
          </View>
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
