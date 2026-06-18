import type { Locale } from "../types";
import { termsTextEn } from "./terms-en";
import { termsTextZhHans } from "./terms-zh-Hans";
import { termsTextZhHK } from "./terms-zh-HK";
import { termsTextZhTW } from "./terms-zh-TW";

const termsByLocale = {
  "zh-HK": termsTextZhHK,
  "zh-TW": termsTextZhTW,
  "zh-Hans": termsTextZhHans,
  en: termsTextEn,
} satisfies Record<Locale, string>;

export function getTermsText(locale: Locale): string {
  return termsByLocale[locale];
}
