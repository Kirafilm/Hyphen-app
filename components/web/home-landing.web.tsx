import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Text, TouchableOpacity, View, type ViewStyle } from "react-native";

import { HyphenLogo } from "@/components/hyphen-logo";
import { WEB_HORIZONTAL_PADDING, WEB_MAX_WIDTH } from "@/components/web/constants";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { categories } from "@/lib/mock-data";
import type { ThemeColorPalette } from "@/lib/_core/theme";

// Fixed path copied into dist/images/ by scripts/deploy-web.sh (reliable on static hosting).
const HERO_BG_URI = "/images/hero-front-page.png";

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

const CATEGORY_META: Record<string, { emoji: string; desc: string }> = {
  攝影及影片製作: { emoji: "📷", desc: "活動、產品、婚禮、短片" },
  音樂製作: { emoji: "🎵", desc: "作曲、編曲、混音、配樂" },
  網頁及程式開發: { emoji: "💻", desc: "網站、App、UI/UX" },
  數碼營銷: { emoji: "📣", desc: "SEO、廣告、社交媒體" },
  翻譯服務: { emoji: "📝", desc: "中英、日韓、多語言" },
  平面設計: { emoji: "🎨", desc: "Logo、海報、品牌、包裝" },
  繪畫及插圖: { emoji: "🖌️", desc: "插畫、漫畫、角色設計" },
  室內設計: { emoji: "🏠", desc: "家居、商鋪、空間規劃" },
};

const FAQ_ITEMS = [
  {
    q: "在 Hyphen 註冊真的只需要電郵地址嗎？",
    a: "是的。Hyphen 只需要一個有效的電子郵件地址即可完成註冊，全程不需提供身分證、地址、電話或其他個人資料。",
  },
  {
    q: "不收集私隱資料，那交易怎麼進行？",
    a: "Freelancer 和僱主通過平台建立聯繫後，可自行協商付款方式和合作細節。Hyphen 不介入金錢交易，因此不需要收集銀行資料。",
  },
  {
    q: "Hyphen 和 Freehunter 有什麼分別？",
    a: "最大分別在於註冊門檻和私隱政策。Freehunter 需要完整個人資料和身份驗證；Hyphen 只需電郵即可。",
  },
  {
    q: "沒有身份驗證是否意味著不可靠？",
    a: "身份驗證只是一種信任機制，並非唯一的可靠性指標。優質的 Freelancer 靠作品和口碑累積評價。",
  },
  {
    q: "Hyphen 收費嗎？有沒有抽成？",
    a: "核心功能完全免費。Freelancer 可以免費瀏覽工作和申請職位，僱主可以免費發佈工作。我們不從交易中抽取佣金。",
  },
  {
    q: "我是新手，可以在 Hyphen 上接案嗎？",
    a: "當然可以！沒有門檻，沒有作品集審核。只要你有技能和熱誠，就可以開始。",
  },
] as const;

const COMPARISON_ROWS = [
  { label: "註冊方式", hyphen: "電郵即可", others: ["電郵+手機+資料", "電郵+資料填寫", "電郵+資料填寫"], highlight: true },
  { label: "身份驗證", hyphen: "不需要", others: ["需要上傳身分證", "部分需要", "需要"], highlight: true },
  { label: "審核時間", hyphen: "即時生效", others: ["1-3 個工作日", "1-7 個工作日", "1-3 個工作日"], highlight: false },
  { label: "私隱收集", hyphen: "極低（僅電郵）", others: ["高", "中至高", "中至高"], highlight: false },
  { label: "新手友好", hyphen: "★★★★★", others: ["★★★", "★★★", "★★★★"], highlight: false },
  { label: "基本費用", hyphen: "免費", others: ["免費 / 會員制", "免費報價 / 佣金", "免費發佈 / 佣金"], highlight: false },
] as const;

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
      <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground, textAlign: "center", letterSpacing: -0.3 }}>
        {title}
      </Text>
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

export function HomeLandingWeb() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const primaryDark = "#5B45E8";
  const primaryDeep = "#4528D4";
  const heroHighlight = "#C4B5FD";
  const bgAlt = Platform.OS === "web" ? "#F8FAFC" : colors.surface;

  const goLogin = () => router.push(isAuthenticated ? "/(tabs)/profile" : "/login");
  const goJobs = () => router.push("/(tabs)/jobs");
  const goPost = () => router.push("/(tabs)/post");
  const goPrivacy = () => router.push("/privacy");
  const goTerms = () => router.push("/terms");
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
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>香港首個零摩擦 Freelance 平台</Text>
          </View>

          <Text style={{ fontSize: 48, fontWeight: "800", color: "#FFFFFF", textAlign: "center", lineHeight: 56, letterSpacing: -0.5 }}>
            {"電郵即用。\n"}
            <Text style={{ color: heroHighlight }}>零認證。零私隱收集。</Text>
          </Text>

          <Text style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 560, lineHeight: 28 }}>
            30 秒完成註冊，今天就能接到第一份 Freelance 工作。不需要身分證，不需要住家地址，你的私隱屬於你自己。
          </Text>

          <Text style={{ fontSize: 14, fontWeight: "700", letterSpacing: 0.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
            Freelance 工作 · 攝影 · 設計 · 程式開發 · 翻譯 · 音樂 · 更多
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 8 }}>
            <PrimaryButton label="立即瀏覽工作" onPress={goJobs} colors={colors} variant="white" large />
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
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>免費發佈工作</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24, opacity: 0.7 }}>
            <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 13 }}>只需一個電郵地址，即可開始</Text>
          </View>
        </View>
        </View>
      </View>

      {/* USP bar */}
      <View style={[fullBleed(), { backgroundColor: bgAlt, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 20 }]}>
        <View style={[sectionInner(), { flexDirection: "row", flexWrap: "wrap", gap: 16 }]}>
          {[
            { icon: "mail-outline" as const, tint: `${colors.primary}18`, color: colors.primary, title: "電郵即用", sub: "30 秒完成註冊" },
            { icon: "lock-closed-outline" as const, tint: `${colors.success}18`, color: colors.success, title: "零私隱收集", sub: "不收集任何個人資料" },
            { icon: "flash-outline" as const, tint: `${colors.warning}18`, color: colors.warning, title: "即時生效", sub: "無需等待審核" },
            { icon: "star-outline" as const, tint: "#F3E8FF", color: colors.primary, title: "完全免費", sub: "基礎功能零費用" },
          ].map((item) => (
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
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: item.tint, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={item.icon} size={20} color={item.color} />
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
            label="核心優勢"
            title="為什麼選擇 Hyphen？"
            subtitle="和其他 Freelance 平台不一樣，我們把你的時間和私隱放在第一位。"
            colors={colors}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
            {[
              {
                icon: "mail-outline" as const,
                bg: `${colors.primary}14`,
                title: "電郵註冊，30 秒開始",
                body: "不上傳身分證。不填寫住家地址。不綁定電話。一個電郵地址就是全部你需要的。",
                bullets: ["輸入電郵 → 設密碼 → 完成", "不需要人工審核等待", "註冊完立刻能瀏覽工作"],
                link: "了解更多",
                onPress: goLogin,
              },
              {
                icon: "shield-checkmark-outline" as const,
                bg: `${colors.success}14`,
                title: "不收集任何私隱資料",
                body: "身分證？不需要。住家地址？不需要。銀行帳號？不需要。你的私隱屬於你自己。",
                bullets: ["符合香港《個人資料（私隱）條例》", "永不出售或共享用戶資料", "資料外洩風險為零"],
                link: "查看私隱條款",
                onPress: goPrivacy,
              },
              {
                icon: "rocket-outline" as const,
                bg: `${colors.warning}14`,
                title: "零門檻，任何人都能開始",
                body: "沒有作品集審核。沒有經驗要求。學生、新手、轉職者——只要你有技能和熱誠。",
                bullets: ["適合學生、轉職者、全職媽媽", "新來港人士的快速起步方式", "兼職副業的最佳選擇"],
                link: "立即開始",
                onPress: goJobs,
              },
            ].map((card) => (
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
                <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: card.bg, alignItems: "center", justifyContent: "center" }}>
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
                <TouchableOpacity onPress={card.onPress} activeOpacity={0.7}>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13, marginTop: 4 }}>
                    {card.link} →
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={[fullBleed(), { backgroundColor: bgAlt, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader
            label="工作分類"
            title="熱門 Freelance 工作類型"
            subtitle="瀏覽你感興趣的工作分類，找到適合你的項目。"
            colors={colors}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {featuredCategories.map((cat) => {
              const meta = CATEGORY_META[cat] ?? { emoji: "✨", desc: "瀏覽相關工作" };
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
                  <Text style={{ fontSize: 28 }}>{meta.emoji}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{cat}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{meta.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <PrimaryButton label={`查看全部 ${categories.length} 個分類 →`} onPress={goJobs} colors={colors} variant="ghost" />
          </View>
        </View>
      </View>

      {/* How it works */}
      <View style={[fullBleed(), { backgroundColor: colors.background, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader
            label="使用方法"
            title="三步開始你的 Freelance 之旅"
            subtitle="從註冊到接到第一份工作，比你想像中更簡單。"
            colors={colors}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 32 }}>
            {[
              { n: "1", title: "電郵註冊", body: "輸入你的電郵地址，設定一組密碼。不需要上傳任何證件，全程不到 30 秒。" },
              { n: "2", title: "建立你的檔案", body: "簡單描述你能做什麼——攝影？設計？翻譯？寫 Code？幾句話就夠。" },
              { n: "3", title: "開始接案 / 發案", body: "Freelancer：瀏覽工作列表，找到合適的應徵。僱主：發佈需求，等 Freelancer 聯繫你。" },
            ].map((step) => (
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
            <PrimaryButton label="立即免費註冊" onPress={goLogin} colors={colors} large />
          </View>
        </View>
      </View>

      {/* Comparison */}
      <View style={[fullBleed(), { backgroundColor: bgAlt, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader
            label="平台比較"
            title="和其他平台有什麼分別？"
            subtitle="用數據說話。以下是 Hyphen 與香港主要 Freelance 平台的客觀比較。"
            colors={colors}
          />
          <View style={{ maxWidth: 800, alignSelf: "center", width: "100%", borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: "hidden", backgroundColor: colors.background }}>
            <View style={{ backgroundColor: colors.primary, paddingVertical: 24, paddingHorizontal: 32, alignItems: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>Hyphen vs 香港主要 Freelance 平台</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 }}>基於各平台公開資訊，截至 2026 年 6 月</Text>
            </View>
            <View style={{ flexDirection: "row", backgroundColor: bgAlt, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              {["比較項目", "Hyphen", "Freehunter", "PRO360", "HelloToby"].map((h, i) => (
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
            {COMPARISON_ROWS.map((row) => (
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

      {/* FAQ */}
      <View style={[fullBleed(), { backgroundColor: colors.background, paddingVertical: 80 }]}>
        <View style={sectionInner()}>
          <SectionHeader label="常見問題" title="你可能想知道的" colors={colors} />
          <View style={{ maxWidth: 720, alignSelf: "center", width: "100%", gap: 8 }}>
            {FAQ_ITEMS.map((item, index) => {
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
          <Text style={{ fontSize: 36, fontWeight: "800", color: "#FFFFFF", textAlign: "center" }}>準備好了嗎？</Text>
          <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 480, lineHeight: 24 }}>
            {"30 秒後你就是 Hyphen 的一份子。\n你的電郵地址，就是全部需要的東西。"}
          </Text>
          <PrimaryButton label="用電郵免費註冊" onPress={goLogin} colors={colors} variant="white" large />
          <TouchableOpacity onPress={goJobs} activeOpacity={0.7}>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 8, textDecorationLine: "underline" }}>
              或是先看看有什麼工作：瀏覽 Freelance 工作列表
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
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>Hyphen 自由職</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#94A3B8", lineHeight: 22 }}>
                香港首個零摩擦 Freelance 平台。電郵即用，不收集私隱，讓你的專注力留在工作上，而不是填表上。
              </Text>
            </View>
            {[
              { title: "平台", links: [["瀏覽工作", goJobs], ["發佈工作", goPost], ["工作分類", goJobs], ["為什麼選 Hyphen", goJobs]] as const },
              { title: "熱門分類", links: featuredCategories.slice(0, 5).map((c) => [c, () => router.push({ pathname: "/(tabs)/jobs", params: { category: c } })] as const) },
              { title: "關於", links: [["聯絡我們", goContact], ["私隱條款", goPrivacy], ["使用條款", goTerms]] as const },
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
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: "#1E293B", paddingTop: 20, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ fontSize: 12, color: "#94A3B8" }}>© {new Date().getFullYear()} Hyphen 自由職. All rights reserved.</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity onPress={goPrivacy}><Text style={{ fontSize: 12, color: "#94A3B8" }}>私隱條款</Text></TouchableOpacity>
              <TouchableOpacity onPress={goTerms}><Text style={{ fontSize: 12, color: "#94A3B8" }}>使用條款</Text></TouchableOpacity>
              <TouchableOpacity onPress={goContact}><Text style={{ fontSize: 12, color: "#94A3B8" }}>聯絡我們</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
