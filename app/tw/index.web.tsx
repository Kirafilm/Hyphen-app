import { useEffect } from "react";
import { Redirect } from "expo-router";

import { AppScreen } from "@/components/app-screen";
import { HomeLandingWeb } from "@/components/web/home-landing.web";
import { useLocale } from "@/lib/i18n/locale-provider";
import { homeTw } from "@/lib/i18n/messages/home-tw";

export default function TaiwanHomeWebScreen() {
  const { setLocale } = useLocale();

  useEffect(() => {
    setLocale("zh-TW");
  }, [setLocale]);

  return (
    <AppScreen webScroll webContentWide safeArea={false} edges={[]}>
      <HomeLandingWeb home={homeTw} heroLayout="tw" />
    </AppScreen>
  );
}
