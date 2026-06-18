import { Redirect } from "expo-router";

/** Native apps use the standard tab home; Taiwan landing is web-only at /tw */
export default function TaiwanHomeRedirect() {
  return <Redirect href="/(tabs)" />;
}
