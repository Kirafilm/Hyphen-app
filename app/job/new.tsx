import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";

export default function PostJobScreen() {
  const router = useRouter();
  const colors = useColors();
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
    workDateTbd: false,
    workTimeTbd: false,
    workDate: "",
    workStartTime: "",
    workEndTime: "",
    description: "",
    budgetRange: "",
    location: "香港",
    skills: "",
    isNegotiable: false,
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const budgetRanges = ["HKD $500 - $2,000", "HKD $2,000 - $5,000", "HKD $5,000 - $10,000", "HKD $10,000 - $50,000", "HKD $50,000+"];
  const locations = ["香港", "澳門", "台灣", "英國"];
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const minutes = i * 30;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  });

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (formData.workDateTbd) {
      setErrors((prev) => ({ ...prev, workDate: "" }));
    }
  }, [formData.workDateTbd]);

  useEffect(() => {
    if (formData.workTimeTbd) {
      setErrors((prev) => ({ ...prev, workStartTime: "", workEndTime: "" }));
    }
  }, [formData.workTimeTbd]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "請輸入工作標題";
    if (!formData.category) newErrors.category = "請選擇行業類別";
    if (!formData.workDateTbd) {
      if (!formData.workDate) newErrors.workDate = "請選擇日期";
    }
    if (!formData.workTimeTbd) {
      if (!formData.workStartTime) newErrors.workStartTime = "請選擇開始時間";
      if (!formData.workEndTime) newErrors.workEndTime = "請選擇結束時間";
      if (formData.workStartTime && formData.workEndTime && formData.workEndTime <= formData.workStartTime) {
        newErrors.workEndTime = "結束時間必須晚於開始時間";
      }
    }
    if (!formData.description.trim()) newErrors.description = "請輸入工作描述";
    if (!formData.budgetRange) newErrors.budgetRange = "請選擇預算範圍";
    if (!formData.contactEmail.trim()) newErrors.contactEmail = "請輸入聯絡電郵";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseBudget = (value: string) => {
    const currency = value.startsWith("HKD") ? "HKD" : "HKD";
    const normalized = value.replace(/,/g, "");
    const nums = (normalized.match(/\d+/g) ?? [])
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n));
    if (value.includes("+")) {
      const min = nums[0] ?? 0;
      return { currency, min, max: min };
    }
    let min = nums[0] ?? 0;
    let max = nums[1] ?? min;
    if (min > max) {
      [min, max] = [max, min];
    }
    return { currency, min, max };
  };

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
      workDateTbd: formData.workDateTbd,
      workTimeTbd: formData.workTimeTbd,
      ...(formData.workDateTbd ? {} : { workDate: formData.workDate }),
      ...(formData.workTimeTbd
        ? {}
        : {
            workStartTime: formData.workStartTime,
            workEndTime: formData.workEndTime,
          }),
      budgetMin: budget.min,
      budgetMax: budget.max,
      currency: budget.currency,
      location: formData.location || "香港",
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
                if (key === "workDate" && !formData.workDateTbd) mapped.workDate = "請選擇日期";
                if (key === "workStartTime" && !formData.workTimeTbd) mapped.workStartTime = "請選擇開始時間";
                if (key === "workEndTime" && !formData.workTimeTbd) mapped.workEndTime = "請選擇結束時間";
                if (key === "contactEmail") mapped.contactEmail = "請輸入有效電郵（例如 name@example.com）";
              }
              if (Object.keys(mapped).length > 0) {
                setErrors((prev) => ({ ...prev, ...mapped }));
                setSubmitError("請完成必填項目");
                return;
              }
            }
          } catch {}
        }

        if (message.includes("contactEmail")) {
          setErrors((prev) => ({ ...prev, contactEmail: "請輸入有效電郵（例如 name@example.com）" }));
          setSubmitError("請完成必填項目");
          return;
        }
      }

      const err = e instanceof Error ? e : new Error("發佈失敗");
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

  const getCalendarCells = (monthStart: Date) => {
    const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const end = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const startDay = start.getDay();
    const daysInMonth = end.getDate();
    const cells: { key: string; date: Date | null; label: string }[] = [];
    for (let i = 0; i < startDay; i++) {
      cells.push({ key: `e-${i}`, date: null, label: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
      const label = String(d);
      cells.push({ key: `d-${d}`, date, label });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ key: `t-${cells.length}`, date: null, label: "" });
    }
    return cells;
  };

  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const calendarLabel = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`;
  const calendarCells = getCalendarCells(calendarMonth);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <PageHeader
            title="發佈新工作"
            subtitle="填寫工作詳情，吸引合適的 Freelancer"
            showBack
          />

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 20 }}>
            {/* Title */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                工作標題 <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => updateField("title", text)}
                placeholder="例如：網站設計、活動攝影..."
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
                行業類別 <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="選擇行業類別"
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
                  {formData.category || "選擇行業類別"}
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
                  <ScrollView nestedScrollEnabled>
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
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.category && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.category}</Text>}
            </View>

            <View style={{ gap: 12 }}>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                工作日期及時間 <Text style={{ color: colors.error }}>*</Text>
              </Text>

              <View style={{ gap: 12 }}>
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>日期</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      {Platform.OS === "web" ? (
                        <>
                          <TouchableOpacity
                            accessible
                            accessibilityRole="button"
                            accessibilityLabel="選擇日期"
                            disabled={formData.workDateTbd}
                            onPress={() => (formData.workDateTbd ? null : setShowDatePicker((v) => !v))}
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
                              opacity: formData.workDateTbd ? 0.6 : 1,
                            }}
                          >
                            <Text style={{ color: formData.workDate ? colors.foreground : colors.muted }}>
                              {formData.workDateTbd ? "日期未定" : formData.workDate || "選擇日期"}
                            </Text>
                            <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                          </TouchableOpacity>
                          {!formData.workDateTbd && showDatePicker && (
                            <View
                              style={{
                                backgroundColor: colors.surface,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: colors.border,
                                padding: 12,
                                marginTop: 8,
                              }}
                            >
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <TouchableOpacity
                                  accessible
                                  accessibilityRole="button"
                                  accessibilityLabel="上一個月"
                                  onPress={() =>
                                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                                  }
                                  style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
                                >
                                  <Ionicons name="chevron-back" size={18} color={colors.muted} />
                                </TouchableOpacity>
                                <Text style={{ color: colors.foreground, fontWeight: "600" }}>{calendarLabel}</Text>
                                <TouchableOpacity
                                  accessible
                                  accessibilityRole="button"
                                  accessibilityLabel="下一個月"
                                  onPress={() =>
                                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                                  }
                                  style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
                                >
                                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                                </TouchableOpacity>
                              </View>
                              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                                  <View key={d} style={{ width: "14.2857%", paddingVertical: 8, alignItems: "center" }}>
                                    <Text style={{ color: colors.muted, fontSize: 12 }}>{d}</Text>
                                  </View>
                                ))}
                                {calendarCells.map((cell) => {
                                  const ymd = cell.date ? toYmd(cell.date) : "";
                                  const selected = ymd && ymd === formData.workDate;
                                  return (
                                    <View key={cell.key} style={{ width: "14.2857%", paddingVertical: 4, alignItems: "center" }}>
                                      {cell.date ? (
                                        <TouchableOpacity
                                          accessible
                                          accessibilityRole="button"
                                          accessibilityLabel={`選擇 ${ymd}`}
                                          onPress={() => {
                                            updateField("workDate", ymd);
                                            setShowDatePicker(false);
                                          }}
                                          style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 18,
                                            backgroundColor: selected ? colors.primary : "transparent",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: selected ? "white" : colors.foreground,
                                              fontWeight: selected ? "600" : "400",
                                            }}
                                          >
                                            {cell.label}
                                          </Text>
                                        </TouchableOpacity>
                                      ) : (
                                        <View style={{ width: 36, height: 36 }} />
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                        </>
                      ) : (
                        <TextInput
                          value={formData.workDateTbd ? "日期未定" : formData.workDate}
                          editable={!formData.workDateTbd}
                          onChangeText={(text) => updateField("workDate", text)}
                          placeholder="例如：2026-05-30"
                          placeholderTextColor={colors.muted}
                          style={{
                            backgroundColor: colors.surface,
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            color: colors.foreground,
                            borderWidth: 1,
                            borderColor: colors.border,
                            opacity: formData.workDateTbd ? 0.6 : 1,
                          }}
                        />
                      )}
                    </View>
                    <TouchableOpacity
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="日期未定"
                      onPress={() => {
                        const next = !formData.workDateTbd;
                        updateField("workDateTbd", next);
                        if (next) {
                          updateField("workDate", "");
                          setShowDatePicker(false);
                          setErrors((prev) => ({ ...prev, workDate: "" }));
                        }
                      }}
                      style={{
                        backgroundColor: formData.workDateTbd ? colors.primary : colors.surface,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: formData.workDateTbd ? 0 : 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: formData.workDateTbd ? "white" : colors.foreground,
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        日期未定
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {!formData.workDateTbd && errors.workDate && (
                    <Text style={{ color: colors.error, fontSize: 12 }}>{errors.workDate}</Text>
                  )}
                </View>

                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>時間（24小時制）</Text>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="選擇開始時間"
                        disabled={formData.workTimeTbd}
                        onPress={() => {
                          if (formData.workTimeTbd) return;
                          setShowStartTimePicker((v) => !v);
                          setShowEndTimePicker(false);
                        }}
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
                          opacity: formData.workTimeTbd ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ color: formData.workStartTime ? colors.foreground : colors.muted }}>
                          {formData.workTimeTbd ? "時間未定" : formData.workStartTime || "開始時間"}
                        </Text>
                        <Ionicons name={showStartTimePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                      </TouchableOpacity>
                      {!formData.workTimeTbd && showStartTimePicker && (
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
                          <ScrollView nestedScrollEnabled>
                            {timeOptions.map((t, index) => (
                              <TouchableOpacity
                                key={t}
                                accessible
                                accessibilityRole="button"
                                accessibilityLabel={`開始時間 ${t}`}
                                onPress={() => {
                                  updateField("workStartTime", t);
                                  setShowStartTimePicker(false);
                                }}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 12,
                                  borderBottomWidth: index === timeOptions.length - 1 ? 0 : 1,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <Text
                                  style={{
                                    color: formData.workStartTime === t ? colors.primary : colors.foreground,
                                    fontWeight: formData.workStartTime === t ? "600" : "400",
                                  }}
                                >
                                  {t}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      {!formData.workTimeTbd && errors.workStartTime && (
                        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.workStartTime}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <TouchableOpacity
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="選擇結束時間"
                        disabled={formData.workTimeTbd}
                        onPress={() => {
                          if (formData.workTimeTbd) return;
                          setShowEndTimePicker((v) => !v);
                          setShowStartTimePicker(false);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          opacity: formData.workTimeTbd ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ color: formData.workEndTime ? colors.foreground : colors.muted }}>
                          {formData.workTimeTbd ? "時間未定" : formData.workEndTime || "結束時間"}
                        </Text>
                        <Ionicons name={showEndTimePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                      </TouchableOpacity>
                      {!formData.workTimeTbd && showEndTimePicker && (
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
                          <ScrollView nestedScrollEnabled>
                            {timeOptions.map((t, index) => (
                              <TouchableOpacity
                                key={t}
                                accessible
                                accessibilityRole="button"
                                accessibilityLabel={`結束時間 ${t}`}
                                onPress={() => {
                                  updateField("workEndTime", t);
                                  setShowEndTimePicker(false);
                                }}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 12,
                                  borderBottomWidth: index === timeOptions.length - 1 ? 0 : 1,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <Text
                                  style={{
                                    color: formData.workEndTime === t ? colors.primary : colors.foreground,
                                    fontWeight: formData.workEndTime === t ? "600" : "400",
                                  }}
                                >
                                  {t}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      {!formData.workTimeTbd && errors.workEndTime && (
                        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.workEndTime}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <TouchableOpacity
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="時間未定"
                        onPress={() => {
                          const next = !formData.workTimeTbd;
                          updateField("workTimeTbd", next);
                          if (next) {
                            updateField("workStartTime", "");
                            updateField("workEndTime", "");
                            setShowStartTimePicker(false);
                            setShowEndTimePicker(false);
                            setErrors((prev) => ({ ...prev, workStartTime: "", workEndTime: "" }));
                          }
                        }}
                        style={{
                          backgroundColor: formData.workTimeTbd ? colors.primary : colors.surface,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: formData.workTimeTbd ? 0 : 1,
                          borderColor: colors.border,
                          minHeight: 48,
                        }}
                      >
                        <Text
                          style={{
                            color: formData.workTimeTbd ? "white" : colors.foreground,
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          時間未定
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                工作描述 <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => updateField("description", text)}
                placeholder="詳細描述工作需求、期望成果、時間安排等..."
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

            {/* Budget */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                預算範圍 <Text style={{ color: colors.error }}>*</Text>
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
                  {formData.budgetRange || "選擇預算範圍"}
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
                <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 8 }}>預算可商議</Text>
              </View>
            </View>

            {/* Location */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>工作地點</Text>
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
                  {formData.location || "選擇工作地點"}
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
                  {locations.map((loc, index) => (
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
                        borderBottomWidth: index === locations.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: formData.location === loc ? colors.primary : colors.foreground,
                          fontWeight: formData.location === loc ? "600" : "400",
                        }}
                      >
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Skills */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>所需技能</Text>
              <TextInput
                value={formData.skills}
                onChangeText={(text) => updateField("skills", text)}
                placeholder="例如：UI設計、React、攝影（用逗號分隔）"
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
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>選填，有助於配對更精準的 Freelancer</Text>
            </View>

            {/* Contact */}
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>聯絡人</Text>
                <TextInput
                  value={formData.contactPerson}
                  onChangeText={(text) => updateField("contactPerson", text)}
                  placeholder="例如：陳小姐"
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
                  聯絡電郵 <Text style={{ color: colors.error }}>*</Text>
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
                  聯絡電話
                </Text>
                <TextInput
                  value={formData.contactPhone}
                  onChangeText={(text) => updateField("contactPhone", text)}
                  placeholder="例如：+852 9123 4567"
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
              accessibilityLabel="發佈工作"
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
                {createMutation.isPending ? "發佈中..." : "發佈工作"}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="取消"
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
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 16 }}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
