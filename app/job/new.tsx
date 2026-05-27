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
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
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
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          {/* Header */}
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
            <Text className="text-2xl font-bold text-background mt-2">發佈新工作</Text>
            <Text className="text-sm text-background opacity-90">
              填寫工作詳情，吸引合適的 Freelancer
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 py-6 gap-5">
            {/* Title */}
            <View>
              <Text className="text-foreground font-semibold mb-2">
                工作標題 <Text className="text-error">*</Text>
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => updateField("title", text)}
                placeholder="例如：網站設計、活動攝影..."
                placeholderTextColor={colors.muted}
                className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              />
              {errors.title && (
                <Text className="text-error text-xs mt-1">{errors.title}</Text>
              )}
            </View>

            {/* Category */}
            <View>
              <Text className="text-foreground font-semibold mb-2">
                行業類別 <Text className="text-error">*</Text>
              </Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="選擇行業類別"
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                className="bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between"
              >
                <Text className={formData.category ? "text-foreground" : "text-muted"}>
                  {formData.category || "選擇行業類別"}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View className="bg-surface rounded-lg mt-2 border border-border max-h-48">
                  <ScrollView nestedScrollEnabled>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={`選擇 ${cat}`}
                        onPress={() => {
                          updateField("category", cat);
                          setShowCategoryPicker(false);
                        }}
                        className="px-4 py-3 border-b border-border last:border-b-0"
                      >
                        <Text className={formData.category === cat ? "text-primary font-semibold" : "text-foreground"}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.category && (
                <Text className="text-error text-xs mt-1">{errors.category}</Text>
              )}
            </View>

            <View className="gap-3">
              <Text className="text-foreground font-semibold">
                工作日期及時間 <Text className="text-error">*</Text>
              </Text>

              <View className="gap-3">
                <View className="gap-2">
                  <Text className="text-muted text-xs">日期</Text>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      {Platform.OS === "web" ? (
                        <>
                          <TouchableOpacity
                            accessible
                            accessibilityRole="button"
                            accessibilityLabel="選擇日期"
                            disabled={formData.workDateTbd}
                            onPress={() => (formData.workDateTbd ? null : setShowDatePicker((v) => !v))}
                            className={
                              formData.workDateTbd
                                ? "bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between opacity-60"
                                : "bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between"
                            }
                          >
                            <Text className={formData.workDate ? "text-foreground" : "text-muted"}>
                              {formData.workDateTbd ? "日期未定" : formData.workDate || "選擇日期"}
                            </Text>
                            <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                          </TouchableOpacity>
                          {!formData.workDateTbd && showDatePicker && (
                            <View className="bg-surface rounded-lg border border-border p-3 mt-2">
                              <View className="flex-row items-center justify-between mb-3">
                                <TouchableOpacity
                                  accessible
                                  accessibilityRole="button"
                                  accessibilityLabel="上一個月"
                                  onPress={() =>
                                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                                  }
                                  className="w-10 h-10 items-center justify-center"
                                >
                                  <Ionicons name="chevron-back" size={18} color={colors.muted} />
                                </TouchableOpacity>
                                <Text className="text-foreground font-semibold">{calendarLabel}</Text>
                                <TouchableOpacity
                                  accessible
                                  accessibilityRole="button"
                                  accessibilityLabel="下一個月"
                                  onPress={() =>
                                    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                                  }
                                  className="w-10 h-10 items-center justify-center"
                                >
                                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                                </TouchableOpacity>
                              </View>
                              <View className="flex-row flex-wrap">
                                {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                                  <View key={d} className="w-[14.2857%] py-2 items-center">
                                    <Text className="text-muted text-xs">{d}</Text>
                                  </View>
                                ))}
                                {calendarCells.map((cell) => {
                                  const ymd = cell.date ? toYmd(cell.date) : "";
                                  const selected = ymd && ymd === formData.workDate;
                                  return (
                                    <View key={cell.key} className="w-[14.2857%] py-1 items-center">
                                      {cell.date ? (
                                        <TouchableOpacity
                                          accessible
                                          accessibilityRole="button"
                                          accessibilityLabel={`選擇 ${ymd}`}
                                          onPress={() => {
                                            updateField("workDate", ymd);
                                            setShowDatePicker(false);
                                          }}
                                          className={
                                            selected
                                              ? "w-9 h-9 rounded-full bg-primary items-center justify-center"
                                              : "w-9 h-9 rounded-full items-center justify-center"
                                          }
                                        >
                                          <Text className={selected ? "text-white font-semibold" : "text-foreground"}>
                                            {cell.label}
                                          </Text>
                                        </TouchableOpacity>
                                      ) : (
                                        <View className="w-9 h-9" />
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
                          className={
                            formData.workDateTbd
                              ? "bg-surface rounded-lg px-4 py-3 text-foreground border border-border opacity-60"
                              : "bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                          }
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
                      className={
                        formData.workDateTbd
                          ? "bg-primary rounded-lg px-3 py-3 items-center justify-center"
                          : "bg-surface rounded-lg px-3 py-3 items-center justify-center border border-border"
                      }
                    >
                      <Text className={formData.workDateTbd ? "text-white font-semibold text-sm" : "text-foreground font-semibold text-sm"}>
                        日期未定
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {!formData.workDateTbd && errors.workDate && <Text className="text-error text-xs">{errors.workDate}</Text>}
                </View>

                <View className="gap-2">
                  <Text className="text-muted text-xs">時間（24小時制）</Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
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
                        className={
                          formData.workTimeTbd
                            ? "bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between opacity-60"
                            : "bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between"
                        }
                      >
                        <Text className={formData.workStartTime ? "text-foreground" : "text-muted"}>
                          {formData.workTimeTbd ? "時間未定" : formData.workStartTime || "開始時間"}
                        </Text>
                        <Ionicons name={showStartTimePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                      </TouchableOpacity>
                      {!formData.workTimeTbd && showStartTimePicker && (
                        <View className="bg-surface rounded-lg mt-2 border border-border max-h-48">
                          <ScrollView nestedScrollEnabled>
                            {timeOptions.map((t) => (
                              <TouchableOpacity
                                key={t}
                                accessible
                                accessibilityRole="button"
                                accessibilityLabel={`開始時間 ${t}`}
                                onPress={() => {
                                  updateField("workStartTime", t);
                                  setShowStartTimePicker(false);
                                }}
                                className="px-4 py-3 border-b border-border last:border-b-0"
                              >
                                <Text className={formData.workStartTime === t ? "text-primary font-semibold" : "text-foreground"}>
                                  {t}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      {!formData.workTimeTbd && errors.workStartTime && (
                        <Text className="text-error text-xs mt-1">{errors.workStartTime}</Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row gap-2">
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
                          className={
                            formData.workTimeTbd
                              ? "flex-1 bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between opacity-60"
                              : "flex-1 bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between"
                          }
                        >
                          <Text className={formData.workEndTime ? "text-foreground" : "text-muted"}>
                            {formData.workTimeTbd ? "時間未定" : formData.workEndTime || "結束時間"}
                          </Text>
                          <Ionicons name={showEndTimePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                        </TouchableOpacity>
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
                          className={
                            formData.workTimeTbd
                              ? "bg-primary rounded-lg px-3 py-3 items-center justify-center"
                              : "bg-surface rounded-lg px-3 py-3 items-center justify-center border border-border"
                          }
                        >
                          <Text className={formData.workTimeTbd ? "text-white font-semibold text-sm" : "text-foreground font-semibold text-sm"}>
                            時間未定
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {!formData.workTimeTbd && showEndTimePicker && (
                        <View className="bg-surface rounded-lg mt-2 border border-border max-h-48">
                          <ScrollView nestedScrollEnabled>
                            {timeOptions.map((t) => (
                              <TouchableOpacity
                                key={t}
                                accessible
                                accessibilityRole="button"
                                accessibilityLabel={`結束時間 ${t}`}
                                onPress={() => {
                                  updateField("workEndTime", t);
                                  setShowEndTimePicker(false);
                                }}
                                className="px-4 py-3 border-b border-border last:border-b-0"
                              >
                                <Text className={formData.workEndTime === t ? "text-primary font-semibold" : "text-foreground"}>
                                  {t}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      {!formData.workTimeTbd && errors.workEndTime && (
                        <Text className="text-error text-xs mt-1">{errors.workEndTime}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <View>
              <Text className="text-foreground font-semibold mb-2">
                工作描述 <Text className="text-error">*</Text>
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => updateField("description", text)}
                placeholder="詳細描述工作需求、期望成果、時間安排等..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border min-h-[120px]"
              />
              {errors.description && (
                <Text className="text-error text-xs mt-1">{errors.description}</Text>
              )}
            </View>

            {/* Budget */}
            <View>
              <Text className="text-foreground font-semibold mb-2">
                預算範圍 <Text className="text-error">*</Text>
              </Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="選擇預算範圍"
                onPress={() => setShowBudgetPicker(!showBudgetPicker)}
                className="bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between"
              >
                <Text className={formData.budgetRange ? "text-foreground" : "text-muted"}>
                  {formData.budgetRange || "選擇預算範圍"}
                </Text>
                <Ionicons
                  name={showBudgetPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {showBudgetPicker && (
                <View className="bg-surface rounded-lg mt-2 border border-border">
                  {budgetRanges.map((range) => (
                    <TouchableOpacity
                      key={range}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`選擇 ${range}`}
                      onPress={() => {
                        updateField("budgetRange", range);
                        setShowBudgetPicker(false);
                      }}
                      className="px-4 py-3 border-b border-border last:border-b-0"
                    >
                      <Text className={formData.budgetRange === range ? "text-primary font-semibold" : "text-foreground"}>
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.budgetRange && (
                <Text className="text-error text-xs mt-1">{errors.budgetRange}</Text>
              )}
              <View className="flex-row items-center mt-3">
                <Switch
                  value={formData.isNegotiable}
                  onValueChange={(value) => updateField("isNegotiable", value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
                <Text className="text-foreground text-sm ml-2">預算可商議</Text>
              </View>
            </View>

            {/* Location */}
            <View>
              <Text className="text-foreground font-semibold mb-2">工作地點</Text>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="選擇工作地點"
                onPress={() => setShowLocationPicker((v) => !v)}
                className="bg-surface rounded-lg px-4 py-3 border border-border flex-row items-center justify-between"
              >
                <Text className={formData.location ? "text-foreground" : "text-muted"}>
                  {formData.location || "選擇工作地點"}
                </Text>
                <Ionicons name={showLocationPicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
              </TouchableOpacity>
              {showLocationPicker && (
                <View className="bg-surface rounded-lg mt-2 border border-border">
                  {locations.map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`選擇 ${loc}`}
                      onPress={() => {
                        updateField("location", loc);
                        setShowLocationPicker(false);
                      }}
                      className="px-4 py-3 border-b border-border last:border-b-0"
                    >
                      <Text className={formData.location === loc ? "text-primary font-semibold" : "text-foreground"}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Skills */}
            <View>
              <Text className="text-foreground font-semibold mb-2">所需技能</Text>
              <TextInput
                value={formData.skills}
                onChangeText={(text) => updateField("skills", text)}
                placeholder="例如：UI設計、React、攝影（用逗號分隔）"
                placeholderTextColor={colors.muted}
                className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              />
              <Text className="text-muted text-xs mt-1">選填，有助於配對更精準的 Freelancer</Text>
            </View>

            {/* Contact */}
            <View className="gap-4">
              <View>
                <Text className="text-foreground font-semibold mb-2">聯絡人</Text>
                <TextInput
                  value={formData.contactPerson}
                  onChangeText={(text) => updateField("contactPerson", text)}
                  placeholder="例如：陳小姐"
                  placeholderTextColor={colors.muted}
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                />
              </View>
              <View>
                <Text className="text-foreground font-semibold mb-2">
                  聯絡電郵 <Text className="text-error">*</Text>
                </Text>
                <TextInput
                  value={formData.contactEmail}
                  onChangeText={(text) => updateField("contactEmail", text)}
                  placeholder="例如：name@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                />
                {errors.contactEmail && (
                  <Text className="text-error text-xs mt-1">{errors.contactEmail}</Text>
                )}
              </View>
              <View>
                <Text className="text-foreground font-semibold mb-2">
                  聯絡電話
                </Text>
                <TextInput
                  value={formData.contactPhone}
                  onChangeText={(text) => updateField("contactPhone", text)}
                  placeholder="例如：+852 9123 4567"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                />
              </View>
            </View>

            {submitError && <Text className="text-error text-sm">{submitError}</Text>}

            {/* Submit Button */}
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="發佈工作"
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-primary rounded-lg py-4 items-center justify-center mt-4 active:opacity-80"
            >
              <Text className="text-white font-semibold text-base">
                {createMutation.isPending ? "發佈中..." : "發佈工作"}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="取消"
              onPress={() => router.back()}
              className="bg-surface rounded-lg py-4 items-center justify-center border border-border active:opacity-80"
            >
              <Text className="text-foreground font-semibold text-base">取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
