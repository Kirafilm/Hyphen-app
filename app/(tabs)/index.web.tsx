import { AppScreen } from "@/components/app-screen";
import { HomeLandingWeb } from "@/components/web/home-landing.web";

export default function HomeWebScreen() {
  return (
    <AppScreen webScroll webContentWide safeArea={false} edges={[]}>
      <HomeLandingWeb />
    </AppScreen>
  );
}
