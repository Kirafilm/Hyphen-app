import { ActivityIndicator, Alert, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import { formatJobSchedule } from "@/lib/job-schedule";
import { isWeb, screenPaddingHorizontal } from "@/lib/web-layout";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = meQuery.data?.role === "admin";
  const utils = trpc.useUtils();
  const invalidateJobs = async () => {
    await Promise.all([utils.jobs.list.invalidate(), utils.jobs.listForModeration.invalidate()]);
  };
  const removeMutation = trpc.jobs.remove.useMutation({
    onSuccess: async () => {
      await invalidateJobs();
      await utils.jobs.byId.invalidate({ id: id ?? "" });
      router.back();
    },
  });
  const deleteMutation = trpc.jobs.delete.useMutation({
    onSuccess: async () => {
      await invalidateJobs();
      router.back();
    },
  });

  const jobQuery = trpc.jobs.byId.useQuery(
    { id: id ?? "" },
    {
      enabled: Boolean(id),
    },
  );
  const job = jobQuery.data;

  const budgetText = useMemo(() => {
    if (!job) return "";
    const min = job.budget.min;
    const max = job.budget.max;
    const invalid = !Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0 || max < min;
    if (invalid) return `${job.budget.currency} $${t("jobDetail.budgetPending")}`;
    return `${job.budget.currency} $${min.toLocaleString()}-${max.toLocaleString()}`;
  }, [job, t]);

  const scheduleDisplay = useMemo(() => {
    if (!job) return "";
    if (job.timeline && job.timeline !== "未指定") return job.timeline;
    return formatJobSchedule(job);
  }, [job]);

  const pad = screenPaddingHorizontal();

  if (jobQuery.isLoading) {
    return (
      <AppScreen>
        <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!job) {
    return (
      <AppScreen>
        <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={{ color: colors.foreground, fontWeight: "600", marginTop: 16 }}>{t("jobDetail.notFound")}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 24, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>{t("jobDetail.back")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenScroll contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <PageHeader
            title={job.title}
            subtitle={
              isAdmin && job.removedAt ? `${job.category} · ${t("jobDetail.removedBadge")}` : job.category
            }
            showBack
          />

          <View style={{ paddingHorizontal: pad, paddingBottom: 24, gap: 24 }}>
            <View style={{ flexDirection: isWeb ? "row" : "column", gap: 16, alignItems: "stretch" }}>
            {/* Budget & Location */}
            <View style={{ flex: isWeb ? 1 : undefined, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{t("jobDetail.budgetLabel")}</Text>
                  <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18, marginTop: 4 }}>{budgetText}</Text>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{t("jobDetail.scheduleLabel")}</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 15, marginTop: 4 }}>{scheduleDisplay}</Text>
                </View>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.location}</Text>
              </View>
            </View>

            <View style={{ flex: isWeb ? 1 : undefined, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>{t("jobDetail.contactTitle")}</Text>
              {job.contactLocked ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="lock-closed" size={16} color={colors.muted} />
                    <Text style={{ color: colors.muted, fontSize: 14 }}>{t("jobDetail.contactLocked")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => (isAuthenticated ? router.push({ pathname: "/paywall", params: { jobId: job.id } }) : router.push("/login"))}
                      style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ color: "white", fontWeight: "600" }}>{t("jobDetail.subscribeNow")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/jobs")}
                      style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text style={{ color: colors.foreground, fontWeight: "600" }}>{t("jobDetail.backToList")}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ gap: 8 }}>
                  {job.contact.person ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="person" size={16} color={colors.primary} />
                      <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.contact.person}</Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.contact.phone ?? "—"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="mail" size={16} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontWeight: "500" }}>{job.contact.email ?? "—"}</Text>
                  </View>
                </View>
              )}
            </View>
            </View>

            {/* Description */}
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>{t("jobDetail.descriptionTitle")}</Text>
              <Text style={{ color: colors.foreground, lineHeight: 22 }}>{job.description}</Text>
            </View>

            {/* Skills */}
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>{t("jobDetail.skillsTitle")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {job.skills.map((skill, index) => (
                  <View
                    key={index}
                    style={{ backgroundColor: `${colors.primary}1A`, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: `${colors.primary}33` }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "500", fontSize: 14 }}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA Buttons */}
            <View style={{ gap: 12, paddingBottom: 24 }}>
              <TouchableOpacity
                onPress={() => (job.contactLocked ? router.push({ pathname: "/paywall", params: { jobId: job.id } }) : null)}
                style={{ backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.primary }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>
                  {job.contactLocked ? t("jobDetail.unlockContact") : t("jobDetail.contactUnlocked")}
                </Text>
              </TouchableOpacity>
              {isAdmin ? (
                <>
                  {!job.removedAt ? (
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(t("jobDetail.removeTitle"), t("jobDetail.removeBody"), [
                          { text: t("common.cancel"), style: "cancel" },
                          {
                            text: t("jobDetail.removeAction"),
                            style: "destructive",
                            onPress: () => removeMutation.mutate({ id: job.id }),
                          },
                        ])
                      }
                      disabled={removeMutation.isPending || deleteMutation.isPending}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: "rgba(245, 158, 11, 0.12)",
                        borderRadius: 8,
                        paddingVertical: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "rgba(245, 158, 11, 0.25)",
                      }}
                    >
                      <Text style={{ color: "#d97706", fontWeight: "600", fontSize: 16 }}>
                        {removeMutation.isPending ? t("jobDetail.removing") : t("jobDetail.removeTitle")}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(t("jobDetail.deleteTitle"), t("jobDetail.deleteBody"), [
                        { text: t("common.cancel"), style: "cancel" },
                        {
                          text: t("jobDetail.deleteAction"),
                          style: "destructive",
                          onPress: () => deleteMutation.mutate({ id: job.id }),
                        },
                      ])
                    }
                    disabled={removeMutation.isPending || deleteMutation.isPending}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.10)",
                      borderRadius: 8,
                      paddingVertical: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(239, 68, 68, 0.20)",
                    }}
                  >
                    <Text style={{ color: colors.error, fontWeight: "600", fontSize: 16 }}>
                      {deleteMutation.isPending ? t("jobDetail.deleting") : t("jobDetail.deleteTitle")}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
