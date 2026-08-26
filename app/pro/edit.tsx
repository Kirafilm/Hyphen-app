import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { parseTagList } from "@/lib/contact-sanitize";
import { useLocale } from "@/lib/i18n/locale-provider";
import { storagePublicUrl } from "@/lib/storage-url";
import { trpc } from "@/lib/trpc";
import { screenPaddingHorizontal } from "@/lib/web-layout";

function notify(title: string, body: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(body ? `${title}\n\n${body}` : title);
    return;
  }
  const { Alert } = require("react-native") as typeof import("react-native");
  Alert.alert(title, body);
}

function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("無法讀取圖片"));
        return;
      }
      const comma = result.indexOf(",");
      resolve({
        base64: comma >= 0 ? result.slice(comma + 1) : result,
        mimeType: file.type || "image/jpeg",
      });
    };
    reader.onerror = () => reject(new Error("無法讀取圖片"));
    reader.readAsDataURL(file);
  });
}

export default function ServiceProfileEditScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const pad = screenPaddingHorizontal();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const isAdmin = meQuery.data?.role === "admin";
  const subscriptionQuery = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated });
  const canManageServicePage = Boolean(subscriptionQuery.data?.active || isAdmin);
  const profileQuery = trpc.serviceProfiles.mine.useQuery(undefined, {
    enabled: isAuthenticated && canManageServicePage,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [lastSavedSlug, setLastSavedSlug] = useState<string | null>(null);

  const upsertMutation = trpc.serviceProfiles.upsert.useMutation({
    onSuccess: async (data) => {
      await utils.serviceProfiles.mine.invalidate();
      setFormError(null);
      setLastSavedSlug(data?.slug ?? null);
      notify(t("serviceProfileEdit.savedTitle"), t("serviceProfileEdit.savedBody"));
    },
    onError: (err) => {
      setFormError(err.message);
      notify(t("serviceProfileEdit.saveErrorTitle"), err.message);
    },
  });
  const uploadMutation = trpc.serviceProfiles.uploadPortfolioImage.useMutation({
    onSuccess: async () => {
      await utils.serviceProfiles.mine.invalidate();
    },
    onError: (err) => {
      setFormError(err.message);
      notify(t("serviceProfileEdit.uploadErrorTitle"), err.message);
    },
  });
  const uploadAvatarMutation = trpc.serviceProfiles.uploadAvatar.useMutation({
    onSuccess: async () => {
      await utils.serviceProfiles.mine.invalidate();
    },
    onError: (err) => {
      setFormError(err.message);
      notify(t("serviceProfileEdit.uploadErrorTitle"), err.message);
    },
  });
  const removeAvatarMutation = trpc.serviceProfiles.removeAvatar.useMutation({
    onSuccess: async () => {
      await utils.serviceProfiles.mine.invalidate();
    },
  });
  const removeMutation = trpc.serviceProfiles.removePortfolioImage.useMutation({
    onSuccess: async () => {
      await utils.serviceProfiles.mine.invalidate();
    },
  });

  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [intro, setIntro] = useState("");
  const [serviceInfo, setServiceInfo] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [categoriesText, setCategoriesText] = useState("");
  const [locationsText, setLocationsText] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profileQuery.data || hydrated) return;
    const p = profileQuery.data;
    setSlug(p.slug);
    setHeadline(p.headline);
    setIntro(p.intro);
    setServiceInfo(p.serviceInfo);
    setSkillsText(p.skills.join("、"));
    setCategoriesText(p.categories.join("、"));
    setLocationsText(p.locations.join("、"));
    setIsPublished(p.isPublished);
    setLastSavedSlug(p.isPublished ? p.slug : null);
    setHydrated(true);
  }, [profileQuery.data, hydrated]);

  const previewPath = useMemo(() => (slug.trim() ? `/pro/${slug.trim().toLowerCase()}` : ""), [slug]);

  if (!isAuthenticated) {
    return (
      <AppScreen>
        <PageHeader title={t("serviceProfileEdit.title")} />
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.muted, marginBottom: 16 }}>{t("serviceProfileEdit.loginRequired")}</Text>
          <TouchableOpacity onPress={() => router.push("/login")} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{t("profile.guestCta")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  if (Platform.OS !== "web") {
    return (
      <AppScreen>
        <PageHeader title={t("serviceProfileEdit.title")} />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>
            {t("serviceProfileEdit.webOnlyEditTitle")}
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 22 }}>{t("serviceProfileEdit.webOnlyEditBody")}</Text>
          <TouchableOpacity
            onPress={() => router.push("/pro" as never)}
            style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 14, marginTop: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{t("nav.pros")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  if (subscriptionQuery.isLoading || meQuery.isLoading) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!canManageServicePage) {
    return (
      <AppScreen>
        <PageHeader title={t("serviceProfileEdit.title")} />
        <View style={{ padding: 24, gap: 16 }}>
          <Text style={{ color: colors.muted, lineHeight: 24 }}>{t("serviceProfileEdit.subscriptionRequired")}</Text>
          <TouchableOpacity onPress={() => router.push("/paywall")} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{t("profile.menuSubscription")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  const buildPayload = () => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{3,64}$/.test(normalizedSlug)) {
      throw new Error(t("serviceProfileEdit.slugInvalid"));
    }
    if (!intro.trim()) throw new Error(t("serviceProfileEdit.introRequired"));
    if (!serviceInfo.trim()) throw new Error(t("serviceProfileEdit.serviceRequired"));
    if (!headline.trim()) throw new Error(t("serviceProfileEdit.headlineRequired"));
    return {
      slug: normalizedSlug,
      headline: headline.trim(),
      intro: intro.trim(),
      serviceInfo: serviceInfo.trim(),
      skills: parseTagList(skillsText),
      categories: parseTagList(categoriesText),
      locations: parseTagList(locationsText),
      isPublished,
    };
  };

  const handleSave = async () => {
    setFormError(null);
    try {
      const payload = buildPayload();
      await upsertMutation.mutateAsync(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("serviceProfileEdit.saveErrorBody");
      setFormError(message);
      if (!(err && typeof err === "object" && "data" in err)) {
        notify(t("serviceProfileEdit.saveErrorTitle"), message);
      }
    }
  };

  const handlePreview = async () => {
    setFormError(null);
    try {
      const payload = buildPayload();
      if (!payload.isPublished) {
        payload.isPublished = true;
        setIsPublished(true);
      }
      const saved = await upsertMutation.mutateAsync(payload);
      router.push(`/pro/${saved?.slug ?? payload.slug}` as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("serviceProfileEdit.saveErrorBody");
      setFormError(message);
      if (!(err && typeof err === "object" && "data" in err)) {
        notify(t("serviceProfileEdit.saveErrorTitle"), message);
      }
    }
  };

  const handlePickAvatar = async () => {
    if (Platform.OS !== "web") {
      notify(t("serviceProfileEdit.webOnlyUploadTitle"), t("serviceProfileEdit.webOnlyUploadBody"));
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (!profileQuery.data) {
          await upsertMutation.mutateAsync(buildPayload());
        }
        const { base64, mimeType } = await readFileAsBase64(file);
        await uploadAvatarMutation.mutateAsync({ dataBase64: base64, mimeType });
      } catch (err) {
        const message = err instanceof Error ? err.message : t("serviceProfileEdit.uploadErrorBody");
        setFormError(message);
        notify(t("serviceProfileEdit.uploadErrorTitle"), message);
      }
    };
    input.click();
  };

  const handlePickImages = async () => {
    if (Platform.OS !== "web") {
      notify(t("serviceProfileEdit.webOnlyUploadTitle"), t("serviceProfileEdit.webOnlyUploadBody"));
      return;
    }
    const maxBytes = 2 * 1024 * 1024;
    const remaining = 10 - (profileQuery.data?.portfolioImages.length ?? 0);
    if (remaining <= 0) {
      notify(t("serviceProfileEdit.uploadErrorTitle"), t("serviceProfileEdit.portfolioLimitReached"));
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : [];
      let uploaded = 0;
      for (const file of files) {
        if (uploaded >= remaining) {
          notify(t("serviceProfileEdit.uploadErrorTitle"), t("serviceProfileEdit.portfolioLimitReached"));
          break;
        }
        if (file.size > maxBytes) {
          notify(t("serviceProfileEdit.uploadTooLargeTitle"), t("serviceProfileEdit.uploadTooLargeBody"));
          continue;
        }
        try {
          const { base64, mimeType } = await readFileAsBase64(file);
          await uploadMutation.mutateAsync({ dataBase64: base64, mimeType: mimeType || file.type || "image/jpeg" });
          uploaded += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : t("serviceProfileEdit.uploadErrorBody");
          setFormError(message);
          notify(t("serviceProfileEdit.uploadErrorTitle"), message);
          break;
        }
      }
    };
    input.click();
  };

  const fieldStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 12 : 10,
    color: colors.foreground,
    fontSize: 15,
  } as const;

  return (
    <AppScreen>
      <ScreenScroll contentContainerStyle={{ paddingBottom: 48 }}>
        <PageHeader title={t("serviceProfileEdit.title")} subtitle={t("serviceProfileEdit.subtitle")} />

        <View style={{ paddingHorizontal: pad, gap: 16, maxWidth: 720, width: "100%", alignSelf: "center" }}>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{t("serviceProfileEdit.contactRule")}</Text>

          {formError ? (
            <View
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.10)",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.25)",
                padding: 12,
              }}
            >
              <Text style={{ color: colors.error, fontSize: 13, lineHeight: 20 }}>{formError}</Text>
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.slugLabel")}</Text>
            <TextInput value={slug} onChangeText={setSlug} autoCapitalize="none" placeholder="your-name" placeholderTextColor={colors.muted} style={fieldStyle} />
            <Text style={{ color: colors.muted, fontSize: 12 }}>{t("serviceProfileEdit.slugHint")}</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.headlineLabel")}</Text>
            <TextInput value={headline} onChangeText={setHeadline} placeholder={t("serviceProfileEdit.headlinePlaceholder")} placeholderTextColor={colors.muted} style={fieldStyle} />
          </View>

          <View style={{ gap: 12 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.avatarLabel")}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{t("serviceProfileEdit.avatarHint")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              {profileQuery.data?.avatarStorageKey ? (
                <Image
                  source={{ uri: storagePublicUrl(profileQuery.data.avatarStorageKey) }}
                  style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: colors.border }}
                />
              ) : (
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>
                    {(headline.trim() || "H").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 8 }}>
                <TouchableOpacity
                  onPress={handlePickAvatar}
                  disabled={uploadAvatarMutation.isPending || upsertMutation.isPending}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {uploadAvatarMutation.isPending ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={18} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("serviceProfileEdit.avatarUploadCta")}</Text>
                    </>
                  )}
                </TouchableOpacity>
                {profileQuery.data?.avatarStorageKey ? (
                  <TouchableOpacity
                    onPress={() => removeAvatarMutation.mutate()}
                    disabled={removeAvatarMutation.isPending}
                    style={{ alignItems: "center", paddingVertical: 4 }}
                  >
                    <Text style={{ color: colors.muted, fontSize: 13 }}>{t("serviceProfileEdit.avatarRemoveCta")}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.introLabel")}</Text>
            <TextInput
              value={intro}
              onChangeText={setIntro}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder={t("serviceProfileEdit.introPlaceholder")}
              placeholderTextColor={colors.muted}
              style={[fieldStyle, { minHeight: 120 }]}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.serviceLabel")}</Text>
            <TextInput
              value={serviceInfo}
              onChangeText={setServiceInfo}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder={t("serviceProfileEdit.servicePlaceholder")}
              placeholderTextColor={colors.muted}
              style={[fieldStyle, { minHeight: 120 }]}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.categoriesLabel")}</Text>
            <TextInput value={categoriesText} onChangeText={setCategoriesText} placeholder={t("serviceProfileEdit.tagsPlaceholder")} placeholderTextColor={colors.muted} style={fieldStyle} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.locationsLabel")}</Text>
            <TextInput value={locationsText} onChangeText={setLocationsText} placeholder={t("serviceProfileEdit.locationsPlaceholder")} placeholderTextColor={colors.muted} style={fieldStyle} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.skillsLabel")}</Text>
            <TextInput value={skillsText} onChangeText={setSkillsText} placeholder={t("serviceProfileEdit.tagsPlaceholder")} placeholderTextColor={colors.muted} style={fieldStyle} />
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.portfolioLabel")}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {(profileQuery.data?.portfolioImages.length ?? 0)}/10
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{t("serviceProfileEdit.portfolioHint")}</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {(profileQuery.data?.portfolioImages ?? []).map((img) => (
                <View key={img.id} style={{ position: "relative" }}>
                  <Image
                    source={{ uri: storagePublicUrl(img.storageKey) }}
                    style={{ width: 100, height: 75, borderRadius: 10, backgroundColor: colors.border }}
                  />
                  <TouchableOpacity
                    onPress={() => removeMutation.mutate({ imageId: img.id })}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.55)",
                      borderRadius: 999,
                      padding: 4,
                    }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handlePickImages}
              disabled={uploadMutation.isPending || (profileQuery.data?.portfolioImages.length ?? 0) >= 10}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: (profileQuery.data?.portfolioImages.length ?? 0) >= 10 ? 0.5 : 1,
              }}
            >
              {uploadMutation.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("serviceProfileEdit.uploadCta")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>{t("serviceProfileEdit.publishLabel")}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{t("serviceProfileEdit.publishHint")}</Text>
            </View>
            <Switch value={isPublished} onValueChange={setIsPublished} trackColor={{ true: colors.primary }} />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={upsertMutation.isPending}
            style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: "center" }}
          >
            {upsertMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{t("serviceProfileEdit.saveCta")}</Text>
            )}
          </TouchableOpacity>

          {previewPath ? (
            <TouchableOpacity onPress={handlePreview} disabled={upsertMutation.isPending} style={{ alignItems: "center", padding: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                {lastSavedSlug === slug.trim().toLowerCase() && isPublished
                  ? t("serviceProfileEdit.previewCta")
                  : t("serviceProfileEdit.saveAndPreviewCta")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
