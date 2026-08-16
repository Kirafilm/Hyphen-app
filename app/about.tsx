import { AppScreen } from "@/components/app-screen";
import { PageHeader } from "@/components/page-header";
import { ScreenScroll } from "@/components/screen-scroll";
import { SeoHead } from "@/components/seo-head";
import { WebHeading } from "@/components/web-heading";
import { useColors } from "@/hooks/use-colors";
import { useLocale } from "@/lib/i18n/locale-provider";
import { breadcrumbJsonLd } from "@/lib/seo";
import { Text, View } from "react-native";

const COPY = {
  "zh-HK": {
    title: "關於 Hyphen",
    lead: "Hyphen 是專為香港及台灣自由工作者與僱主而設的 Freelance 媒合平台，目標是減少傳統平台的摩擦、抽成與繁瑣註冊流程。",
    sections: [
      {
        h: "我們解決什麼問題",
        p: "許多 Freelance 平台要求冗長身份審核、強制電話或身分證，並在成交後抽取佣金。Hyphen 以電郵即可開始：僱主可免費刊登工作，Freelancer 可瀏覽職位；需要聯絡對方時再以透明訂閱解鎖，過程不抽成。",
      },
      {
        h: "誰適合使用",
        p: "適合攝影、影片、音樂、網頁開發、數碼營銷、翻譯、設計、活動等自由工作者，以及需要短期或專案式人才的中小企、初創與個人發案方。",
      },
      {
        h: "我們如何運作",
        p: "發案方免費發布工作需求與預算；接案方瀏覽、申請並在訂閱後直接取得聯絡方式。雙方自行溝通與完成合作，Hyphen 不介入交易抽成，讓你把時間留在工作本身。",
      },
      {
        h: "私隱與安全",
        p: "我們只收集提供服務所需的最少資料。網站可能顯示第三方廣告；詳情請參閱私隱政策。如有疑問，歡迎透過聯絡我們頁面或電郵 hyphe.office@gmail.com 查詢。",
      },
    ],
  },
  "zh-TW": {
    title: "關於 Hyphen",
    lead: "Hyphen 是專為台灣與香港接案者、發案方設計的媒合平台，強調零抽成、電郵即可開始，減少傳統平台的門檻與隱藏成本。",
    sections: [
      {
        h: "我們解決什麼問題",
        p: "常見接案平台常要求繁複實名、點數制或成交抽成。Hyphen 讓案主免費刊登，接案者訂閱後解鎖聯絡資訊，雙方直接溝通，平台不抽成。",
      },
      {
        h: "誰適合使用",
        p: "適合攝影、影音、音樂、網頁與程式、數位行銷、翻譯、設計等接案者，以及需要專案人才的中小企業與個人發案方。",
      },
      {
        h: "我們如何運作",
        p: "發案方免費刊登需求與預算；接案方瀏覽並申請，訂閱後取得聯絡方式，自行完成合作。Hyphen 專注媒合效率，不介入交易抽成。",
      },
      {
        h: "隱私與安全",
        p: "我們僅蒐集提供服務所需的最少資料。網站可能顯示第三方廣告；詳情請見隱私權政策。如有疑問，請至聯絡我們或來信 hyphe.office@gmail.com。",
      },
    ],
  },
  en: {
    title: "About Hyphen",
    lead: "Hyphen is a freelance matching platform for Hong Kong and Taiwan. We reduce onboarding friction, skip commission fees, and let clients and freelancers connect with email-first signup.",
    sections: [
      {
        h: "The problem we solve",
        p: "Many freelance platforms require heavy identity checks and take a cut of every deal. Hyphen lets clients post jobs free; freelancers browse freely and unlock contacts with a transparent subscription—no commission.",
      },
      {
        h: "Who it is for",
        p: "Photographers, video creators, developers, marketers, translators, designers, and other freelancers—plus SMEs, startups, and individuals who need project-based talent.",
      },
      {
        h: "How it works",
        p: "Clients post requirements and budget. Freelancers apply and, after subscribing, contact clients directly. Hyphen does not take a cut of the work you deliver.",
      },
      {
        h: "Privacy and ads",
        p: "We collect only what we need to run the service. The website may show third-party ads—see our Privacy Policy. Questions: contact page or hyphe.office@gmail.com.",
      },
    ],
  },
  "zh-Hans": {
    title: "关于 Hyphen",
    lead: "Hyphen 是面向香港及台湾自由职业者与雇主的 Freelance 媒合平台，目标是减少传统平台的摩擦、抽成与繁琐注册流程。",
    sections: [
      {
        h: "我们解决什么问题",
        p: "许多平台要求冗长身份审核并在成交后抽成。Hyphen 用电邮即可开始：雇主可免费发布工作，自由职业者可浏览职位；需要联系时再以透明订阅解锁，过程不抽成。",
      },
      {
        h: "谁适合使用",
        p: "适合摄影、视频、音乐、网页开发、数字营销、翻译、设计等自由职业者，以及需要短期或项目制人才的中小企业与个人发案方。",
      },
      {
        h: "我们如何运作",
        p: "发案方免费发布需求与预算；接案方浏览、申请并在订阅后直接取得联系方式。双方自行沟通完成合作，Hyphen 不抽成。",
      },
      {
        h: "隐私与安全",
        p: "我们只收集提供服务所需的最少资料。网站可能显示第三方广告；详情见隐私政策。疑问请通过联系我们页面或电邮 hyphe.office@gmail.com。",
      },
    ],
  },
} as const;

export default function AboutScreen() {
  const colors = useColors();
  const { locale, t } = useLocale();
  const copy = COPY[locale as keyof typeof COPY] ?? COPY["zh-HK"];

  return (
    <AppScreen>
      <SeoHead
        title={copy.title}
        description={copy.lead}
        path="/about"
        locale={(locale as "zh-HK" | "zh-TW" | "zh-Hans" | "en") || "zh-HK"}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: copy.title, path: "/about" },
        ])}
      />
      <PageHeader title={copy.title} />
      <ScreenScroll>
        <View style={{ paddingHorizontal: 24, paddingBottom: 40, gap: 20, maxWidth: 720, width: "100%", alignSelf: "center" }}>
          <Text style={{ fontSize: 16, lineHeight: 26, color: colors.muted }}>{copy.lead}</Text>
          {copy.sections.map((section) => (
            <View key={section.h} style={{ gap: 8 }}>
              <WebHeading level={2} style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                {section.h}
              </WebHeading>
              <Text style={{ fontSize: 15, lineHeight: 24, color: colors.muted }}>{section.p}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>{t("common.copyright")}</Text>
        </View>
      </ScreenScroll>
    </AppScreen>
  );
}
