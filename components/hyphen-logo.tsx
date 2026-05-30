import { Image } from "expo-image";

const LOGO_ASPECT = 1000 / 1001;

type HyphenLogoProps = {
  /** Render height; width follows logo aspect ratio. */
  height?: number;
};

/** Brand logo: Hyphen 自由職 (transparent PNG). */
export function HyphenLogo({ height = 48 }: HyphenLogoProps) {
  const h = Math.round(height);
  const w = Math.round(h * LOGO_ASPECT);

  return (
    <Image
      source={require("../assets/images/hyphen-logo.png")}
      style={{ width: w, height: h }}
      contentFit="contain"
      accessibilityLabel="Hyphen 自由職"
    />
  );
}
