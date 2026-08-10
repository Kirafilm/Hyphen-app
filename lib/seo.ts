const SITE_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://hyphenjob.com").replace(/\/$/, "");
const DEFAULT_OG_IMAGE = `${(process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.hyphenjob.com").replace(/\/$/, "")}/web-assets/hero-front-page.png`;

export const SEO = {
  siteUrl: SITE_URL,
  siteName: "Hyphen 自由職",
  defaultTitle: "Hyphen 自由職 — 香港台灣 Freelance 媒合平台｜電郵即用・零抽成",
  defaultDescription:
    "Hyphen 自由職 — 香港及台灣 Freelance 媒合平台。電郵即用、發案免費、零抽成，讓你專注工作本身。",
  defaultOgImage: DEFAULT_OG_IMAGE,
  twitterHandle: "",
} as const;

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export type SeoLocale = "zh-HK" | "zh-TW" | "zh-Hans" | "en";

export type PageSeoInput = {
  title: string;
  description: string;
  /** Path only, e.g. `/guides` or `/tw` */
  path: string;
  /** Primary language of this URL */
  locale?: SeoLocale;
  /** Optional alternate path for zh-TW (defaults to same path except `/` ↔ `/tw`) */
  twPath?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function resolveHreflang(path: string, twPath?: string): { hk: string; tw: string; xDefault: string } {
  const normalized = path.replace(/\/$/, "") || "/";
  if (normalized === "/" || normalized === "") {
    return {
      hk: absoluteUrl("/"),
      tw: absoluteUrl(twPath ?? "/tw"),
      xDefault: absoluteUrl("/"),
    };
  }
  if (normalized === "/tw") {
    return {
      hk: absoluteUrl("/"),
      tw: absoluteUrl("/tw"),
      xDefault: absoluteUrl("/"),
    };
  }
  return {
    hk: absoluteUrl(normalized),
    tw: absoluteUrl(twPath ?? normalized),
    xDefault: absoluteUrl(normalized),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hyphen 自由職",
    url: SITE_URL,
    logo: absoluteUrl("/favicon.png"),
    email: "hyphe.office@gmail.com",
    sameAs: [],
    description: SEO.defaultDescription,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hyphen 自由職",
    url: SITE_URL,
    inLanguage: ["zh-HK", "zh-TW", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/jobs?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  locale?: SeoLocale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    author: { "@type": "Organization", name: "Hyphen 自由職" },
    publisher: {
      "@type": "Organization",
      name: "Hyphen 自由職",
      logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.png") },
    },
    inLanguage: input.locale ?? "zh-HK",
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function jobPostingJsonLd(input: {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  currency: string;
  budgetMin: number;
  budgetMax: number;
  datePosted?: string | Date | null;
  clientName?: string | null;
}) {
  const path = `/job/${input.id}`;
  const description =
    input.description.length > 5000 ? `${input.description.slice(0, 4997)}...` : input.description;
  const min = Math.max(0, input.budgetMin);
  const max = Math.max(min, input.budgetMax);
  const currency = (input.currency || "HKD").toUpperCase();

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: input.title,
    description,
    datePosted: input.datePosted
      ? new Date(input.datePosted).toISOString()
      : new Date().toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: input.clientName?.trim() || "Hyphen 自由職",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: input.location,
        addressCountry: input.location.includes("台灣") || input.location.includes("Taiwan") ? "TW" : "HK",
      },
    },
    employmentType: "CONTRACTOR",
    industry: input.category,
    url: absoluteUrl(path),
    directApply: true,
    baseSalary: {
      "@type": "MonetaryAmount",
      currency,
      value: {
        "@type": "QuantitativeValue",
        minValue: min,
        maxValue: max,
        unitText: "ONE_TIME",
      },
    },
  };
}
