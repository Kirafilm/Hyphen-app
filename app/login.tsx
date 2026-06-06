import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import * as Auth from "@/lib/_core/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthRedirectUrl } from "@/lib/auth-redirect";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
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
        setInfo("請設定新密碼。");
        setError(null);
      }
    });

    if (isWeb && typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecoveryMode(true);
      setInfo("請設定新密碼。");
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
      setError("請先輸入電郵地址");
      setInfo(null);
      return;
    }

    setResettingPassword(true);
    setError(null);
    setInfo(null);
    try {
      if (!isSupabaseConfigured) {
        setError("此版本未設定 Supabase，無法重設密碼。請更新 App 或聯絡開發者。");
        return;
      }
      const redirectTo = getAuthRedirectUrl("/login");
      const result = await getSupabase().auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
      if (result.error) throw result.error;
      setInfo("重設密碼連結已寄到你的電郵，請查收並依照指示設定新密碼。");
    } catch (e) {
      const message = e instanceof Error ? e.message : "無法寄出重設密碼郵件";
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
      if (!token) throw new Error("密碼已更新，但未能建立登入狀態，請用新密碼重新登入。");

      await Auth.setSessionToken(token);
      await persistNativeUserInfo(data.session?.user ?? null);
      try {
        await refresh();
      } catch (refreshError) {
        console.warn("[Login] refresh after password reset failed:", refreshError);
      }
      setRecoveryMode(false);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法更新密碼");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const submit = async () => {
    if (!canSubmit || submitting) return;
    if (!isSupabaseConfigured) {
      setError("此版本未設定 Supabase，無法登入。請更新 App 或聯絡開發者。");
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
        if (!token) throw new Error("登入失敗：未取得 token");
        await Auth.setSessionToken(token);
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
        await Auth.setSessionToken(token);
        await persistNativeUserInfo(result.data.user);
        try {
          await refresh();
        } catch (refreshError) {
          console.warn("[Login] refresh after sign-up failed:", refreshError);
        }
        router.replace("/(tabs)");
        return;
      }
      setInfo("已送出註冊，請到電郵確認後再回來登入。");
    } catch (e) {
      const message = e instanceof Error ? e.message : "登入失敗";
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
        <View style={{ flex: 1, maxWidth: isWeb ? 520 : undefined, alignSelf: isWeb ? "center" : "stretch", width: isWeb ? "100%" : undefined }}>
          <PageHeader
            title="登入 / 註冊"
            subtitle="先使用電郵登入；之後可再加入 Google / Apple。"
            showBack
          />

          <View style={{ paddingHorizontal: pad, paddingVertical: 16, gap: 16 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ alignItems: "center", gap: 12 }}>
                <View style={{ width: 64, height: 64, backgroundColor: colors.primary, borderRadius: 32, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="log-in" size={32} color="white" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, textAlign: "center" }}>開始使用</Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
                  登入後可免費發佈工作；如需查看發佈者電話與電郵，需訂閱月費或年費。
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
              {recoveryMode ? (
                <>
                  <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 18 }}>重設密碼</Text>
                  <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>請輸入新密碼並確認。</Text>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>新密碼</Text>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="最少 6 個字元"
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                      style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: colors.foreground, borderWidth: 1, borderColor: colors.border }}
                    />
                  </View>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>確認新密碼</Text>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="再次輸入新密碼"
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
                    {updatingPassword ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>更新密碼</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="切換到登入"
                  onPress={() => setMode("login")}
                  style={
                    mode === "login"
                      ? { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center" }
                      : { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }
                  }
                >
                  <Text style={mode === "login" ? { color: "white", fontWeight: "600" } : { color: colors.foreground, fontWeight: "600" }}>
                    登入
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="切換到註冊"
                  onPress={() => setMode("signup")}
                  style={
                    mode === "signup"
                      ? { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center" }
                      : { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }
                  }
                >
                  <Text style={mode === "signup" ? { color: "white", fontWeight: "600" } : { color: colors.foreground, fontWeight: "600" }}>
                    註冊
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>電郵</Text>
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
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>密碼</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="最少 6 個字元"
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
                accessibilityLabel={mode === "login" ? "登入" : "建立帳號"}
                onPress={submit}
                disabled={!canSubmit || submitting || resettingPassword}
                style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center", opacity: (!canSubmit || submitting || resettingPassword) ? 0.8 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                    {mode === "login" ? "登入" : "建立帳號"}
                  </Text>
                )}
              </TouchableOpacity>

              {mode === "login" && (
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="忘記密碼"
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
                    <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 15 }}>忘記密碼</Text>
                  )}
                </TouchableOpacity>
              )}
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
