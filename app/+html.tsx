import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

const GOOGLE_AW_ID = "AW-18199669116";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="zh-Hant">
      <head>
        {/* Google tag (gtag.js) — required on every page */}
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
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
