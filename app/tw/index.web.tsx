import { useEffect } from "react";

import { AppScreen } from "@/components/app-screen";
import { SeoHead } from "@/components/seo-head";
import { HomeLandingWeb } from "@/components/web/home-landing.web";
import { useLocale } from "@/lib/i18n/locale-provider";
import { homeTw } from "@/lib/i18n/messages/home-tw";

const TW_TITLE = "Hyphen 自由職 — 台灣接案發案平台｜零抽成・電郵即可開始";
const TW_DESCRIPTION =
  "Hyphen 專為台灣接案者與發案方設計：電子郵件即可開始、案主免費刊登、接案訂閱解鎖聯絡、平台零抽成。";

export default function TaiwanHomeWebScreen() {
  const { setLocale } = useLocale();

  useEffect(() => {
    setLocale("zh-TW");
  }, [setLocale]);

  return (
    <AppScreen webScroll webContentWide safeArea={false} edges={[]}>
      <SeoHead
        title={TW_TITLE}
        description={TW_DESCRIPTION}
        path="/tw"
        locale="zh-TW"
        twPath="/tw"
      />
      <HomeLandingWeb home={homeTw} heroLayout="tw" />
    </AppScreen>
  );
}
