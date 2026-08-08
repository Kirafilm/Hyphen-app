import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

const GOOGLE_AW_ID = "AW-18199669116";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="zh-HK">
      <head>
        {/* Google tag (gtag.js) — conversion tracking only; no AdSense/AdMob inventory */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_AW_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GOOGLE_AW_ID}');
            `,
          }}
        />
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta
          name="description"
          content="Hyphen 自由職 — 香港及台灣 Freelance 媒合平台。電郵即用、發案免費、零抽成，讓你專注工作本身。"
        />
        <title>Hyphen 自由職</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
