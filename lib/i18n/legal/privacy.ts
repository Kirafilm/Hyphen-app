import type { Locale, LegalSection } from "../types";
import { privacySectionsZhHK } from "./privacy-zh-HK";
import { privacySectionsZhTW } from "./privacy-zh-TW";
import { privacySectionsZhHans } from "./privacy-zh-Hans";
import { privacySectionsEn } from "./privacy-en";

const privacyByLocale = {
  "zh-HK": privacySectionsZhHK,
  "zh-TW": privacySectionsZhTW,
  "zh-Hans": privacySectionsZhHans,
  en: privacySectionsEn,
} satisfies Record<Locale, LegalSection[]>;

export function getPrivacySections(locale: Locale): LegalSection[] {
  return privacyByLocale[locale];
}
