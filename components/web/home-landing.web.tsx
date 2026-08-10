import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { createElement, useState } from "react";
import { Platform, Text, TouchableOpacity, View, Image, Linking, type ViewStyle } from "react-native";

import { HyphenLogo } from "@/components/hyphen-logo";
import { AdsterraSlot } from "@/components/web/adsterra-slot.web";
import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "@/components/web/constants";
import { WebHeading } from "@/components/web-heading";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { translateCategory } from "@/lib/i18n/helpers";
import { categories } from "@/lib/mock-data";
import type { HomeMessages } from "@/lib/i18n/types";
import type { ThemeColorPalette } from "@/lib/_core/theme";

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.hyphenjob.com").replace(/\/$/, "");
const HERO_BG_URI = `${API_BASE}/web-assets/hero-front-page.png`;
const APP_STORE_URL = "https://apps.apple.com/hk/app/hyphen%E8%87%AA%E7%94%B1%E8%81%B7/id6774014657";
const APP_STORE_QR = require("../../assets/images/app-store-qr.png");
const MBTI_URL = "https://mbti.hyphenjob.com/";

function heroOverlayGradient(primary: string, primaryDark: string, primaryDeep: string) {
  const toRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace("#", "");
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return `linear-gradient(135deg, ${toRgba(primary, 0.84)} 0%, ${toRgba(primaryDark, 0.8)} 48%, ${toRgba(primaryDeep, 0.76)} 100%)`;
}

const CATEGORY_EMOJI: Record<string, string> = {
  攝影及影片製作: "📷",
  音樂製作: "🎵",
  網頁及程式開發: "💻",
  數碼營銷: "📣",
  翻譯服務: "📝",
  平面設計: "🎨",
  繪畫及插圖: "🖌️",
  室內設計: "🏠",
};

function fullBleed(style?: ViewStyle): ViewStyle {
  if (Platform.OS !== "web") return { width: "100%", ...(style ?? {}) };
  return {
    width: "100vw",
    marginLeft: "calc(50% - 50vw)" as unknown as number,
    marginRight: "calc(50% - 50vw)" as unknown as number,
    ...(style ?? {}),
  };
}

function sectionInner(paddingVertical = 0): ViewStyle {
  return {
    width: "100%",
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: WEB_HORIZONTAL_PADDING,
    paddingVertical,
  };
}

function SectionHeader({
  label,
  title,
  subtitle,
  colors,
}: {
  label: string;
  title: string;
  subtitle?: string;
  colors: ThemeColorPalette;
}) {
  return (
    <View style={{ alignItems: "center", marginBottom: 48, gap: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: colors.primary }}>
        {label}
      </Text>
      <WebHeading
        level={2}
        style={{ fontSize: 32, fontWeight: "800", color: colors.foreground, textAlign: "center", letterSpacing: -0.3 }}
      >
        {title}
      </WebHeading>
      {subtitle ? (
        <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center", maxWidth: 560, lineHeight: 24 }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  colors,
  variant = "primary",
  large = false,
}: {
  label: string;
  onPress: () => void;
  colors: ThemeColorPalette;
  variant?: "primary" | "ghost" | "white";
  large?: boolean;
}) {
  const isPrimary = variant === "primary";
  const isWhite = variant === "white";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingVertical: large ? 14 : 10,
        paddingHorizontal: large ? 32 : 20,
        borderRadius: large ? 10 : 8,
        backgroundColor: isPrimary ? colors.primary : isWhite ? "#FFFFFF" : colors.background,
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isWhite ? colors.border : colors.border,
      }}
    >
      <Text
        style={{
          color: isPrimary ? "#FFFFFF" : isWhite ? colors.primary : colors.foreground,
          fontWeight: "700",
          fontSize: large ? 16 : 14,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function HomeLandingWeb({
  home: homeOverride,
  heroLayout = "default",
}: {
  home?: HomeMessages;
  heroLayout?: "default" | "tw";
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const { messages, t } = useLocale();
  const home = homeOverride ?? messages.home;
  const [openFaq, setOpenFaq] = useState(0);
  // Avoid duplicate <h1> when this landing stays mounted under other routes during static export / tabs.
  const isPrimaryHome =
    pathname === "/" || pathname === "/tw" || pathname === "/(tabs)" || pathname === "/(tabs)/index";

  const primaryDark = "#5B45E8";
  const primaryDeep = "#4528D4";
  const heroHighlight = "#C4B5FD";
  const bgAlt = Platform.OS === "web" ? "#F8FAFC" : colors.surface;

  const goLogin = () => router.push(isAuthenticated ? "/(tabs)/profile" : "/login");
  const goJobs = () => router.push("/(tabs)/jobs");
  const goPost = () => router.push("/(tabs)/post");
  const goPrivacy = () => router.push("/privacy");
  const goTerms = () => router.push("/terms");
  const goAbout = () => router.push("/about");
  const goGuides = () => router.push("/guides");
  const goContact = () => router.push("/contact");

  const featuredCategories = categories.slice(0, 8);

  return (
    <View style={{ width: "100%" }}>
      {/* Hero */}
      <View style={[fullBleed(), { position: "relative", overflow: "hidden", minHeight: 520 }]}>
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundImage: `url(${HERO_BG_URI})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } as ViewStyle}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundImage: heroOverlayGradient(colors.primary, primaryDark, primaryDeep),
          } as ViewStyle}
        />

        <View
          style={{
            paddingTop: 80,
            paddingBottom: 100,
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
        <View style={[sectionInner(), { alignItems: "center", gap: 20 }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>{home.badge}</Text>
          </View>

          {Platform.OS === "web" ? (
            createElement(
              isPrimaryHome ? "h1" : "p",
              {
                style: {
                  margin: 0,
                  fontSize: heroLayout === "tw" ? 42 : 48,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  textAlign: "center",
                  // Must use px: raw numbers are CSS multipliers on DOM elements
                  lineHeight: heroLayout === "tw" ? "52px" : "56px",
                  letterSpacing: "-0.5px",
                },
              },
              home.heroTitle,
              createElement("br"),
              createElement("span", { style: { color: heroHighlight } }, home.heroHighlight),
            )
          ) : (
            <Text
              style={{
                fontSize: heroLayout === "tw" ? 42 : 48,
                fontWeight: "800",
                color: "#FFFFFF",
                textAlign: "center",
                lineHeight: heroLayout === "tw" ? 52 : 56,
                letterSpacing: -0.5,
              }}
            >
              {home.heroTitle}
              {"\n"}
              <Text style={{ color: heroHighlight }}>{home.heroHighlight}</Text>
            </Text>
          )}

          <Text style={{ fontSize: heroLayout === "tw" ? 17 : 18, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: heroLayout === "tw" ? 640 : 560, lineHeight: 28 }}>
            {home.heroBody}
          </Text>

          {home.heroTags ? (
            <Text style={{ fontSize: 14, fontWeight: "700", letterSpacing: 0.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
              {home.heroTags}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 8, width: "100%", maxWidth: heroLayout === "tw" ? 560 : undefined }}>
            {heroLayout === "tw" ? (
              <>
                <TouchableOpacity
                  onPress={goPost}
                  activeOpacity={0.85}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 10,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.9)",
                    minWidth: 240,
                    flexGrow: 1,
                    maxWidth: 360,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15, textAlign: "center", lineHeight: 22 }}>
                    {home.postJob}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goJobs}
                  activeOpacity={0.85}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 10,
                    backgroundColor: "transparent",
                    borderWidth: 1.5,
                    borderColor: "rgba(255,255,255,0.75)",
                    minWidth: 240,
                    flexGrow: 1,
                    maxWidth: 360,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15, textAlign: "center", lineHeight: 22 }}>
                    {home.browseJobs}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <PrimaryButton label={home.browseJobs} onPress={goJobs} colors={colors} variant="white" large />
                <TouchableOpacity
                  onPress={goPost}
                  activeOpacity={0.85}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 32,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>{home.postJob}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24, opacity: 0.7 }}>
            <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 13 }}>{home.heroEmailHint}</Text>
          </View>
        </View>
        </View>
      </View>

      {/* USP bar */}
      <View style={[fullBleed(), { backgroundColor: bgAlt, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 20 }]}>
        <View style={[sectionInner(), { flexDirection: "row", flexWrap: "wrap", gap: 16 }]}>
          {home.usp.map((item) => (
            <View
              key={item.title}
              style={{
                flex: 1,
                minWidth: 220,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: colors.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor:
                    item.icon === "mail-outline"
                      ? `${colors.primary}18`
                      : item.icon === "lock-closed-outline"
                        ? `${colors.success}18`
                        : item.icon === "flash-outline"
                          ? `${colors.warning}18`
                          : "#F3E8FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={
                    item.icon === "lock-closed-outline"
                      ? colors.success
                      : item.icon === "flash-outline"
                        ? colors.warning
                        : colors.primary
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Advantages */}
      <View style={[fullBleed(), { backgroundColor: colors.background, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader
            label={home.advantagesLabel}
            title={home.advantagesTitle}
            subtitle={home.advantagesSubtitle}
            colors={colors}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
            {home.cards.map((card, index) => {
              const onPress = index === 0 ? goLogin : index === 1 ? goPrivacy : goJobs;
              return (
              <View
                key={card.title}
                style={{
                  flex: 1,
                  minWidth: 280,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 32,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor:
                      card.icon === "shield-checkmark-outline"
                        ? `${colors.success}14`
                        : card.icon === "rocket-outline"
                          ? `${colors.warning}14`
                          : card.icon === "wallet-outline"
                            ? `${colors.warning}14`
                            : card.icon === "people-outline"
                              ? `${colors.success}14`
                              : `${colors.primary}14`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={card.icon} size={28} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{card.title}</Text>
                <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>{card.body}</Text>
                {card.bullets.map((b) => (
                  <View key={b} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success }} />
                    <Text style={{ fontSize: 13, color: colors.muted, flex: 1 }}>{b}</Text>
                  </View>
                ))}
                {card.link ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13, marginTop: 4 }}>
                    {card.link} →
                  </Text>
                </TouchableOpacity>
                ) : null}
              </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={[fullBleed(), { backgroundColor: bgAlt, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader
            label={home.categoriesLabel}
            title={home.categoriesTitle}
            subtitle={home.categoriesSubtitle}
            colors={colors}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {featuredCategories.map((cat) => {
              const meta = messages.categories[cat];
              const emoji = CATEGORY_EMOJI[cat] ?? "✨";
              const name = meta ? meta.name : translateCategory(messages, cat);
              const desc = meta?.desc ?? home.categoriesFallback;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => router.push({ pathname: "/(tabs)/jobs", params: { category: cat } })}
                  activeOpacity={0.85}
                  style={{
                    width: "23%",
                    minWidth: 200,
                    flexGrow: 1,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 24,
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <PrimaryButton label={home.categoriesAll.replace("{count}", String(categories.length))} onPress={goJobs} colors={colors} variant="ghost" />
          </View>
        </View>
      </View>

      {/* How it works */}
      <View style={[fullBleed(), { backgroundColor: colors.background, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader label={home.howLabel} title={home.howTitle} subtitle={home.howSubtitle} colors={colors} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 32 }}>
            {home.steps.map((step) => (
              <View key={step.n} style={{ flex: 1, minWidth: 240, alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "800" }}>{step.n}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{step.title}</Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22, maxWidth: 280 }}>{step.body}</Text>
              </View>
            ))}
          </View>
          <View style={{ alignItems: "center", marginTop: 48 }}>
            <PrimaryButton label={home.signupCta} onPress={goLogin} colors={colors} large />
          </View>
        </View>
      </View>

      {/* Comparison */}
      <View style={[fullBleed(), { backgroundColor: bgAlt, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader
            label={home.compareLabel}
            title={home.compareTitle}
            subtitle={home.compareSubtitle}
            colors={colors}
          />
          <View style={{ maxWidth: 800, alignSelf: "center", width: "100%", borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden", backgroundColor: colors.background }}>
            <View style={{ backgroundColor: colors.primary, paddingVertical: 24, paddingHorizontal: 32, alignItems: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>{home.compareTableTitle}</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 }}>{home.compareTableDate}</Text>
            </View>
            <View style={{ flexDirection: "row", backgroundColor: bgAlt, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              {home.compareHeaders.map((h, i) => (
                <Text
                  key={h}
                  style={{
                    flex: i === 0 ? 1.4 : 1,
                    padding: 12,
                    fontSize: 13,
                    fontWeight: "700",
                    color: i === 1 ? colors.primary : colors.muted,
                    backgroundColor: i === 1 ? `${colors.primary}12` : undefined,
                  }}
                >
                  {h}
                </Text>
              ))}
            </View>
            {home.comparisonRows.map((row) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: row.highlight ? `${colors.success}08` : colors.background,
                }}
              >
                <Text style={{ flex: 1.4, padding: 12, fontSize: 14, fontWeight: "700", color: colors.foreground }}>{row.label}</Text>
                <Text style={{ flex: 1, padding: 12, fontSize: 14, fontWeight: "700", color: colors.primary, backgroundColor: `${colors.primary}10` }}>{row.hyphen}</Text>
                {row.others.map((cell, i) => (
                  <Text key={i} style={{ flex: 1, padding: 12, fontSize: 13, color: colors.muted }}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Adsterra Native Banner — web only, between platform comparison and FAQ */}
      <View style={[fullBleed(), { backgroundColor: colors.background, paddingVertical: 24 }]}>
        <View style={sectionInner()}>
          <AdsterraSlot />
        </View>
      </View>

      {/* FAQ */}
      <View style={[fullBleed(), { backgroundColor: colors.background, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader label={home.faqLabel} title={home.faqTitle} colors={colors} />
          <View style={{ maxWidth: 720, alignSelf: "center", width: "100%", gap: 8 }}>
            {home.faq.map((item, index) => {
              const active = openFaq === index;
              return (
                <View
                  key={item.q}
                  style={{
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setOpenFaq(active ? -1 : index)}
                    activeOpacity={0.85}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 12 }}
                  >
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.q}</Text>
                    <Ionicons name={active ? "chevron-up" : "chevron-down"} size={20} color={active ? colors.primary : colors.muted} />
                  </TouchableOpacity>
                  {active ? (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                      <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>{item.a}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* MBTI promo — above final CTA */}
      <View
        style={[
          fullBleed(),
          {
            paddingVertical: 56,
            ...(Platform.OS === "web"
              ? ({
                  backgroundImage: "linear-gradient(120deg, #0F172A 0%, #1E1B4B 55%, #312E81 100%)",
                } as ViewStyle)
              : { backgroundColor: "#0F172A" }),
          },
        ]}
      >
        <View style={[sectionInner(), { alignItems: "center", gap: 16 }]}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#A5B4FC", letterSpacing: 1.2, textTransform: "uppercase", textAlign: "center" }}>
            {home.mbtiLabel}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFFFFF", lineHeight: 36, textAlign: "center" }}>{home.mbtiTitle}</Text>
          <Text style={{ fontSize: 15, color: "#CBD5E1", lineHeight: 24, textAlign: "center", maxWidth: 480 }}>
            {home.mbtiBody}
          </Text>
          <TouchableOpacity
            onPress={() => void Linking.openURL(MBTI_URL)}
            activeOpacity={0.88}
            accessibilityRole="link"
            accessibilityLabel={home.mbtiCta}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              paddingHorizontal: 28,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Text style={{ color: "#312E81", fontWeight: "800", fontSize: 15 }}>{home.mbtiCta}</Text>
            <Ionicons name="arrow-forward" size={18} color="#312E81" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Final CTA */}
      <View
        style={[
          fullBleed(),
          {
            paddingVertical: 80,
            alignItems: "center",
            ...(Platform.OS === "web"
              ? ({ backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${primaryDark} 100%)` } as ViewStyle)
              : { backgroundColor: colors.primary }),
          },
        ]}
      >
        <View style={[sectionInner(), { alignItems: "center", gap: 16 }]}>
          <WebHeading level={2} style={{ fontSize: 36, fontWeight: "800", color: "#FFFFFF", textAlign: "center" }}>
            {home.ctaTitle}
          </WebHeading>
          <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 480, lineHeight: 24 }}>
            {home.ctaBody}
          </Text>
          <PrimaryButton label={home.ctaSignup} onPress={goLogin} colors={colors} variant="white" large />
          <TouchableOpacity onPress={goJobs} activeOpacity={0.7}>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 8, textDecorationLine: "underline" }}>
              {home.ctaBrowse}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={[fullBleed(), { backgroundColor: "#0F172A", paddingTop: 48, paddingBottom: 24 }]}>
        <View style={sectionInner()}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 40, marginBottom: 40 }}>
            <View style={{ flex: 2, minWidth: 240, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <HyphenLogo height={32} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>{t("nav.brand")}</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#94A3B8", lineHeight: 22 }}>{home.footerAbout}</Text>
            </View>
            {[
              {
                title: home.footerPlatform,
                links: [
                  [home.footerLinks.browse, goJobs],
                  [home.footerLinks.post, goPost],
                  [home.footerLinks.categories, goJobs],
                  [home.footerLinks.why, goJobs],
                ] as const,
              },
              {
                title: home.footerCategories,
                links: featuredCategories.slice(0, 5).map((c) => [translateCategory(messages, c), () => router.push({ pathname: "/(tabs)/jobs", params: { category: c } })] as const),
              },
              {
                title: home.footerAboutCol,
                links: [
                  [home.footerLinks.about, goAbout],
                  [home.footerLinks.guides, goGuides],
                  [home.footerLinks.contact, goContact],
                  [home.footerLinks.privacy, goPrivacy],
                  [home.footerLinks.terms, goTerms],
                ] as const,
              },
            ].map((col) => (
              <View key={col.title} style={{ flex: 1, minWidth: 140, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5, textTransform: "uppercase" }}>{col.title}</Text>
                {col.links.map(([label, onPress]) => (
                  <TouchableOpacity key={label} onPress={onPress} activeOpacity={0.7}>
                    <Text style={{ fontSize: 13, color: "#94A3B8", paddingVertical: 2 }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={{ flex: 1, minWidth: 148, alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" }}>
                {home.footerAppStoreTitle}
              </Text>
              <TouchableOpacity
                onPress={() => void Linking.openURL(APP_STORE_URL)}
                activeOpacity={0.85}
                accessibilityRole="link"
                accessibilityLabel={home.footerAppStoreHint}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  padding: 10,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Image source={APP_STORE_QR} style={{ width: 112, height: 112 }} accessibilityLabel="App Store QR code" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#0F172A", textAlign: "center" }}>{home.footerAppStoreHint}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: "#1E293B", paddingTop: 20, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ fontSize: 12, color: "#94A3B8" }}>© {new Date().getFullYear()} {t("common.copyright")}</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity onPress={goPrivacy}><Text style={{ fontSize: 12, color: "#94A3B8" }}>{home.footerLinks.privacy}</Text></TouchableOpacity>
              <TouchableOpacity onPress={goTerms}><Text style={{ fontSize: 12, color: "#94A3B8" }}>{home.footerLinks.terms}</Text></TouchableOpacity>
              <TouchableOpacity onPress={goContact}><Text style={{ fontSize: 12, color: "#94A3B8" }}>{home.footerLinks.contact}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
