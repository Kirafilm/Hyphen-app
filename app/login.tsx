import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import * as Auth from "@/lib/_core/auth";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { refresh } = useAuth({ autoFetch: false });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    return true;
  }, [email, password]);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "login") {
        const result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (result.error) throw result.error;
        const token = result.data.session?.access_token;
        if (!token) throw new Error("登入失敗：未取得 token");
        await Auth.setSessionToken(token);
        await refresh();
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
        await refresh();
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

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="bg-primary px-6 py-6 gap-2">
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="返回"
              onPress={() => router.back()}
              className="w-8 h-8"
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-background mt-2">登入 / 註冊</Text>
            <Text className="text-sm text-background opacity-90">
              先使用電郵登入；之後可再加入 Google / Apple。
            </Text>
          </View>

          <View className="px-6 py-8 gap-4">
            <View className="bg-surface rounded-lg p-6 border border-border">
              <View className="items-center gap-3">
                <View className="w-16 h-16 bg-primary rounded-full items-center justify-center">
                  <Ionicons name="log-in" size={32} color="white" />
                </View>
                <Text className="text-lg font-bold text-foreground text-center">開始使用</Text>
                <Text className="text-sm text-muted text-center leading-relaxed">
                  登入後可免費發佈工作；如需查看發佈者電話與電郵，需訂閱月費或年費。
                </Text>
              </View>
            </View>

            <View className="bg-surface rounded-lg p-6 border border-border gap-4">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="切換到登入"
                  onPress={() => setMode("login")}
                  className={
                    mode === "login"
                      ? "flex-1 bg-primary rounded-lg py-3 items-center justify-center"
                      : "flex-1 bg-surface rounded-lg py-3 items-center justify-center border border-border"
                  }
                >
                  <Text className={mode === "login" ? "text-white font-semibold" : "text-foreground font-semibold"}>
                    登入
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="切換到註冊"
                  onPress={() => setMode("signup")}
                  className={
                    mode === "signup"
                      ? "flex-1 bg-primary rounded-lg py-3 items-center justify-center"
                      : "flex-1 bg-surface rounded-lg py-3 items-center justify-center border border-border"
                  }
                >
                  <Text className={mode === "signup" ? "text-white font-semibold" : "text-foreground font-semibold"}>
                    註冊
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                <Text className="text-foreground font-semibold mb-2">電郵</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                />
              </View>

              <View>
                <Text className="text-foreground font-semibold mb-2">密碼</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="最少 6 個字元"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                />
              </View>

              {error && <Text className="text-error text-sm">{error}</Text>}
              {info && <Text className="text-muted text-sm">{info}</Text>}

              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel={mode === "login" ? "登入" : "建立帳號"}
                onPress={submit}
                disabled={!canSubmit || submitting}
                className="bg-primary rounded-lg py-4 items-center justify-center active:opacity-80"
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    {mode === "login" ? "登入" : "建立帳號"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="bg-primary bg-opacity-10 rounded-lg p-4 border border-primary border-opacity-20">
              <View className="flex-row gap-3">
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-sm">提示</Text>
                  <Text className="text-muted text-xs mt-1 leading-relaxed">
                    需要先建立 Supabase 專案，並在環境變數填入 EXPO_PUBLIC_SUPABASE_URL 與 EXPO_PUBLIC_SUPABASE_ANON_KEY。
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
