import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trpc } from "@/lib/trpc";
import { screenPaddingHorizontal } from "@/lib/web-layout";

export default function MessageThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const colors = useColors();
  const router = useRouter();
  const { t } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const pad = screenPaddingHorizontal();
  const [body, setBody] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const threadQuery = trpc.serviceMessages.threadDetail.useQuery(
    { threadId: threadId ?? "" },
    { enabled: isAuthenticated && Boolean(threadId), refetchInterval: 8000 },
  );
  const sendMutation = trpc.serviceMessages.send.useMutation({
    onSuccess: async () => {
      setBody("");
      await threadQuery.refetch();
    },
  });
  const deleteMutation = trpc.serviceMessages.deleteThread.useMutation({
    onSuccess: () => {
      router.replace("/messages" as never);
    },
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const confirmDelete = async () => {
    if (!threadId) return;
    const ok =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.confirm(t("messages.deleteConfirm"))
        : await new Promise<boolean>((resolve) => {
            const { Alert } = require("react-native") as typeof import("react-native");
            Alert.alert("", t("messages.deleteConfirm"), [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "OK", style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ threadId });
    } catch (err) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(err instanceof Error ? err.message : t("messages.deleteErrorTitle"));
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <AppScreen>
        <PageHeader title={t("messages.threadTitle")} />
        <View style={{ padding: 24 }}>
          <TouchableOpacity onPress={() => router.push("/login")} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{t("profile.guestCta")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  const thread = threadQuery.data;
  const title =
    thread && user
      ? thread.profileUserId === user.id
        ? thread.visitorDisplayName
        : thread.profileDisplayName
      : t("messages.threadTitle");

  const handleSend = () => {
    if (!threadId || !body.trim()) return;
    sendMutation.mutate({ threadId, body: body.trim() });
  };

  return (
    <AppScreen webScroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <PageHeader title={title} subtitle={t("messages.respectNotice")} />

        <View style={{ flex: 1, paddingHorizontal: pad, maxWidth: 720, width: "100%", alignSelf: "center" }}>
          {threadQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : !thread ? (
            <Text style={{ color: colors.muted, marginTop: 24 }}>{t("messages.threadNotFound")}</Text>
          ) : (
            <View style={{ flex: 1, gap: 12, paddingBottom: 16 }}>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleteMutation.isPending}
                style={{ alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600" }}>{t("messages.deleteCta")}</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 10 }}>
                {thread.messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={{
                      alignSelf: msg.isMine ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      backgroundColor: msg.isMine ? colors.primary : colors.surface,
                      borderWidth: msg.isMine ? 0 : 1,
                      borderColor: colors.border,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: msg.isMine ? "#fff" : colors.foreground, fontSize: 15, lineHeight: 22 }}>
                      {msg.body}
                    </Text>
                  </View>
                ))}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 8,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 12,
                }}
              >
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  multiline
                  placeholder={t("messages.inputPlaceholder")}
                  placeholderTextColor={colors.muted}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    maxHeight: 120,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.foreground,
                    fontSize: 15,
                  }}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={sendMutation.isPending || !body.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: !body.trim() ? 0.5 : 1,
                  }}
                >
                  {sendMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
