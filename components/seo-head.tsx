import Head from "expo-router/head";

import {
  SEO,
  absoluteUrl,
  organizationJsonLd,
  resolveHreflang,
  websiteJsonLd,
  type PageSeoInput,
} from "@/lib/seo";

type SeoHeadProps = PageSeoInput & {
  /** Include site-wide Organization + WebSite JSON-LD (home pages). */
  includeSiteGraph?: boolean;
};

function toJsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Per-route SEO tags for web static export / CSR.
 * Native apps ignore Head content.
 */
export function SeoHead({
  title,
  description,
  path,
  locale = "zh-HK",
  twPath,
  ogType = "website",
  ogImage = SEO.defaultOgImage,
  noIndex = false,
  jsonLd,
  includeSiteGraph = false,
}: SeoHeadProps) {
  const canonical = absoluteUrl(path === "" ? "/" : path);
  const fullTitle = title.includes("Hyphen") ? title : `${title} | ${SEO.siteName}`;
  const alts = resolveHreflang(path, twPath);
  const ogLocale = locale === "zh-TW" ? "zh_TW" : locale === "en" ? "en_US" : "zh_HK";

  const graphs: Record<string, unknown>[] = [];
  if (includeSiteGraph) {
    graphs.push(organizationJsonLd(), websiteJsonLd());
  }
  if (jsonLd) {
    if (Array.isArray(jsonLd)) graphs.push(...jsonLd);
    else graphs.push(jsonLd);
  }

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : <meta name="robots" content="index,follow" />}

      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="zh-HK" href={alts.hk} />
      <link rel="alternate" hrefLang="zh-TW" href={alts.tw} />
      <link rel="alternate" hrefLang="x-default" href={alts.xDefault} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SEO.siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={locale === "zh-TW" ? "zh_HK" : "zh_TW"} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {graphs.map((graph, index) => (
        // Text children serialize in expo static export; dangerouslySetInnerHTML does not.
        <script key={`ld-${index}`} type="application/ld+json">
          {toJsonLdScript(graph)}
        </script>
      ))}
    </Head>
  );
}
