import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

import { organizationJsonLd, SEO, websiteJsonLd } from "@/lib/seo";

const GOOGLE_AW_ID = "AW-18199669116";

const SITE_JSON_LD = JSON.stringify([organizationJsonLd(), websiteJsonLd()]).replace(/</g, "\\u003c");

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="zh-HK">
      <head>
        {/* Google tag (gtag.js) — conversion tracking only; no AdSense inventory */}
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
        {/* Third-party ad tag (zone 11588694) */}
        <script
          src="https://5gvci.com/act/files/tag.min.js?z=11588694"
          data-cfasync="false"
          async
        />
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content={SEO.defaultDescription} />
        <meta name="theme-color" content="#3B82F6" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:title" content={SEO.defaultTitle} />
        <meta property="og:description" content={SEO.defaultDescription} />
        <meta property="og:image" content={SEO.defaultOgImage} />
        <meta property="og:locale" content="zh_HK" />
        <meta property="og:locale:alternate" content="zh_TW" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.defaultTitle} />
        <meta name="twitter:description" content={SEO.defaultDescription} />
        <meta name="twitter:image" content={SEO.defaultOgImage} />
        <title>{SEO.defaultTitle}</title>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        <ScrollViewStyleReset />
      </head>
      <body>
        <noscript>
          <div style={{ padding: 24, fontFamily: "system-ui,sans-serif", maxWidth: 720, margin: "0 auto" }}>
            <p style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px" }}>Hyphen 自由職</p>
            <p>{SEO.defaultDescription}</p>
            <p>
              <a href="/jobs">瀏覽職位</a>
              {" · "}
              <a href="/post">發佈工作</a>
              {" · "}
              <a href="/guides">使用指南</a>
              {" · "}
              <a href="/about">關於我們</a>
              {" · "}
              <a href="/tw">台灣首頁</a>
            </p>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
