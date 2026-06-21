import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { ScreenScroll } from "@/components/screen-scroll";
import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/lib/i18n/locale-provider";
import { defaultJobLocationForLocale } from "@/lib/i18n/locale-routing";
import { translateCategory, translateLocation, translateScheduleWindow } from "@/lib/i18n/helpers";
import { categories } from "@/lib/mock-data";
import {
  getBudgetRangesForLocation,
  isBudgetRangeValidForLocation,
  jobLocations,
  parseBudgetForLocation,
} from "@/lib/job-locations";
import { workDateWindows } from "@/lib/job-schedule";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";

export default function PostJobScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t, messages, locale, ready } = useLocale();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const createMutation = trpc.jobs.create.useMutation({
    onSuccess: async (created) => {
      await utils.jobs.list.invalidate();
      router.replace(`/job/${created.id}`);
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    workDateWindow: "",
    description: "",
    budgetRange: "",
    location: "",
    skills: "",
    isNegotiable: false,
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [defaultLocationSet, setDefaultLocationSet] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showWorkDatePicker, setShowWorkDatePicker] = useState(false);

  const budgetRanges = useMemo(
    () => getBudgetRangesForLocation(formData.location),
    [formData.location],
  );

  useEffect(() => {
    if (!ready || defaultLocationSet) return;
    setFormData((prev) => ({ ...prev, location: defaultJobLocationForLocale(locale) }));
    setDefaultLocationSet(true);
  }, [ready, locale, defaultLocationSet]);

  useEffect(() => {
    if (!formData.budgetRange) return;
    if (!isBudgetRangeValidForLocation(formData.location, formData.budgetRange)) {
      setFormData((prev) => ({ ...prev, budgetRange: "" }));
    }
  }, [formData.location, formData.budgetRange]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = t("jobNew.errors.titleRequired");
    if (!formData.category) newErrors.category = t("jobNew.errors.categoryRequired");
    if (!formData.workDateWindow) newErrors.workDateWindow = t("jobNew.errors.workDateRequired");
    if (!formData.description.trim()) newErrors.description = t("jobNew.errors.descriptionRequired");
    if (!formData.budgetRange) newErrors.budgetRange = t("jobNew.errors.budgetRequired");
    if (!formData.contactEmail.trim()) newErrors.contactEmail = t("jobNew.errors.contactEmailRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseBudget = (value: string) => parseBudgetForLocation(formData.location, value);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitError(null);
    const budget = parseBudget(formData.budgetRange);
    const skills = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const contactPhone = formData.contactPhone.trim();
    const contactPerson = formData.contactPerson.trim();
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      workDateTbd: true,
      workTimeTbd: true,
      timeline: formData.workDateWindow,
      budgetMin: budget.min,
      budgetMax: budget.max,
      currency: budget.currency,
      location: formData.location || defaultJobLocationForLocale(locale),
      skills,
      clientName: user?.name?.trim() || "匿名",
      ...(contactPerson ? { contactPerson } : {}),
      contactEmail: formData.contactEmail.trim(),
      ...(contactPhone ? { contactPhone } : {}),
    };
    console.log("[PostJobScreen] submit payload", payload);
    try {
      await createMutation.mutateAsync(payload);
    } catch (e) {
      if (e instanceof TRPCClientError) {
        const message = String(e.message || "");
        const match = message.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            const issues = JSON.parse(match[0]);
            if (Array.isArray(issues)) {
              const mapped: Record<string, string> = {};
              for (const it of issues) {
                const key = Array.isArray(it?.path) ? String(it.path[0] ?? "") : "";
                if (key === "timeline" || key === "workDateWindow") mapped.workDateWindow = t("jobNew.errors.workDateRequired");
                if (key === "contactEmail") mapped.contactEmail = t("jobNew.errors.contactEmailInvalid");
              }
              if (Object.keys(mapped).length > 0) {
                setErrors((prev) => ({ ...prev, ...mapped }));
                setSubmitError(t("jobNew.errors.requiredFields"));
                return;
              }
            }
          } catch {}
        }

        if (message.includes("contactEmail")) {
          setErrors((prev) => ({ ...prev, contactEmail: t("jobNew.errors.contactEmailInvalid") }));
          setSubmitError(t("jobNew.errors.requiredFields"));
          return;
        }
      }

      const err = e instanceof Error ? e : new Error(t("jobNew.errors.submitFailed"));
      setSubmitError(err.message);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError(null);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <AppScreen>
      <ScreenScroll contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <PageHeader title={t("jobNew.title")} subtitle={t("jobNew.subtitle")} showBack />

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 20 }}>
            {/* Title */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                {t("jobNew.titleLabel")} <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => updateField("title", text)}
                placeholder={t("jobNew.titlePlaceholder")}
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              {errors.title && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.title}</Text>}
            </View>

            {/* Category */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                {t("jobNew.categoryLabel")} <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel={t("jobNew.selectCategoryA11y")}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: formData.category ? colors.foreground : colors.muted }}>
                  {formData.category ? translateCategory(messages, formData.category) : t("jobNew.selectCategory")}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    maxHeight: 192,
                  }}
                >
                  <ScreenScroll nestedScrollEnabled style={{ maxHeight: 192 }}>
                    {categories.map((cat, index) => (
                      <TouchableOpacity
                        key={cat}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={`選擇 ${cat}`}
                        onPress={() => {
                          updateField("category", cat);
                          setShowCategoryPicker(false);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: index === categories.length - 1 ? 0 : 1,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: formData.category === cat ? colors.primary : colors.foreground,
                            fontWeight: formData.category === cat ? "600" : "400",
                          }}
                        >
                          {translateCategory(messages, cat)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScreenScroll>
                </View>
              )}
              {errors.category && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.category}</Text>}
            </View>

            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                {t("jobNew.workDateLabel")} <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel={t("jobNew.selectWorkDateA11y")}
                onPress={() => setShowWorkDatePicker(!showWorkDatePicker)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: formData.workDateWindow ? colors.foreground : colors.muted }}>
                  {formData.workDateWindow
                    ? translateScheduleWindow(messages, formData.workDateWindow)
                    : t("jobNew.selectWorkDate")}
                </Text>
                <Ionicons
                  name={showWorkDatePicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {showWorkDatePicker && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {workDateWindows.map((window, index) => (
                    <TouchableOpacity
                      key={window}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`選擇 ${window}`}
                      onPress={() => {
                        updateField("workDateWindow", window);
                        setShowWorkDatePicker(false);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: index === workDateWindows.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                        <Text
                          style={{
                            color: formData.workDateWindow === window ? colors.primary : colors.foreground,
                            fontWeight: formData.workDateWindow === window ? "600" : "400",
                          }}
                        >
                          {translateScheduleWindow(messages, window)}
                        </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.workDateWindow && (
                <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.workDateWindow}</Text>
              )}
            </View>

            {/* Description */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                {t("jobNew.descriptionLabel")} <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>
                {t("jobNew.descriptionHint")}
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => updateField("description", text)}
                placeholder={t("jobNew.descriptionPlaceholder")}
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 120,
                }}
              />
              {errors.description && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.description}</Text>}
            </View>

            {/* Location */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>{t("jobNew.location")}</Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="選擇工作地點"
                onPress={() => setShowLocationPicker((v) => !v)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: formData.location ? colors.foreground : colors.muted }}>
                  {formData.location ? translateLocation(messages, formData.location) : t("jobNew.selectLocation")}
                </Text>
                <Ionicons name={showLocationPicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
              </TouchableOpacity>
              {showLocationPicker && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {jobLocations.map((loc, index) => (
                    <TouchableOpacity
                      key={loc}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`選擇 ${loc}`}
                      onPress={() => {
                        updateField("location", loc);
                        setShowLocationPicker(false);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: index === jobLocations.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: formData.location === loc ? colors.primary : colors.foreground,
                          fontWeight: formData.location === loc ? "600" : "400",
                        }}
                      >
                        {translateLocation(messages, loc)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Budget */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                {t("jobNew.budget")} <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
                {t("jobNew.budgetHint")}（{translateLocation(messages, formData.location)}）
              </Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="選擇預算範圍"
                onPress={() => setShowBudgetPicker(!showBudgetPicker)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: formData.budgetRange ? colors.foreground : colors.muted }}>
                  {formData.budgetRange || t("jobNew.selectBudget")}
                </Text>
                <Ionicons
                  name={showBudgetPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {showBudgetPicker && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {budgetRanges.map((range, index) => (
                    <TouchableOpacity
                      key={range}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`選擇 ${range}`}
                      onPress={() => {
                        updateField("budgetRange", range);
                        setShowBudgetPicker(false);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: index === budgetRanges.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: formData.budgetRange === range ? colors.primary : colors.foreground,
                          fontWeight: formData.budgetRange === range ? "600" : "400",
                        }}
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.budgetRange && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.budgetRange}</Text>}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                <Switch
                  value={formData.isNegotiable}
                  onValueChange={(value) => updateField("isNegotiable", value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
                <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 8 }}>{t("jobNew.budgetNegotiable")}</Text>
              </View>
            </View>

            {/* Skills */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>{t("jobNew.skillsLabel")}</Text>
              <TextInput
                value={formData.skills}
                onChangeText={(text) => updateField("skills", text)}
                placeholder={t("jobNew.skillsPlaceholder")}
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{t("jobNew.skillsHint")}</Text>
            </View>

            {/* Contact */}
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>{t("jobNew.contactPersonLabel")}</Text>
                <TextInput
                  value={formData.contactPerson}
                  onChangeText={(text) => updateField("contactPerson", text)}
                  placeholder={t("jobNew.contactPersonPlaceholder")}
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
              <View>
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                  {t("jobNew.contactEmailLabel")} <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <TextInput
                  value={formData.contactEmail}
                  onChangeText={(text) => updateField("contactEmail", text)}
                  placeholder="例如：name@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                {errors.contactEmail && (
                  <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.contactEmail}</Text>
                )}
              </View>
              <View>
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                  {t("jobNew.contactPhoneLabel")}
                </Text>
                <TextInput
                  value={formData.contactPhone}
                  onChangeText={(text) => updateField("contactPhone", text)}
                  placeholder={t("jobNew.contactPhonePlaceholder")}
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
            </View>

            {submitError && <Text style={{ color: colors.error, fontSize: 14 }}>{submitError}</Text>}

            {/* Submit Button */}
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel={t("jobNew.submit")}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
                opacity: createMutation.isPending ? 0.8 : 1,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                {createMutation.isPending ? t("jobNew.submitting") : t("jobNew.submit")}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel={t("jobNew.cancel")}
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>{t("jobNew.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
