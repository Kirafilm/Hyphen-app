import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { LOCALES, type Locale } from "./types";

const LOCALE_KEY = "hyphen.locale";
const LEGACY_LOCALE_KEY = "zh-Hant";

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

function normalizeLocaleTag(tag: string): Locale | null {
  const normalized = tag.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) return null;

  if (normalized.startsWith("en")) return "en";
  if (normalized === "zh-cn" || normalized === "zh-hans" || normalized === "zh-sg") return "zh-Hans";
  if (normalized === "zh-tw" || normalized === "zh-hant-tw") return "zh-TW";
  if (
    normalized === "zh-hk" ||
    normalized === "zh-mo" ||
    normalized === "zh-hant-hk" ||
    normalized === "zh-hant-mo"
  ) {
    return "zh-HK";
  }
  if (normalized === "zh-hant") return inferTraditionalChineseRegion();
  if (normalized.startsWith("zh")) return inferTraditionalChineseRegion();

  return null;
}

function inferTraditionalChineseRegion(): Locale {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === "Asia/Taipei") return "zh-TW";
    if (timeZone === "Asia/Hong_Kong" || timeZone === "Asia/Macau") return "zh-HK";
  } catch {
    // ignore
  }
  return "zh-HK";
}

function collectSystemLocaleTags(): string[] {
  const tags: string[] = [];

  if (typeof navigator !== "undefined") {
    if (Array.isArray(navigator.languages)) tags.push(...navigator.languages);
    if (navigator.language) tags.push(navigator.language);
  }

  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intlLocale) tags.push(intlLocale);
  } catch {
    // ignore
  }

  try {
    // Optional native helper when expo-localization is installed.
    const { getLocales } = require("expo-localization") as {
      getLocales: () => Array<{ languageTag?: string; languageCode?: string; regionCode?: string }>;
    };
    for (const locale of getLocales()) {
      if (locale.languageTag) tags.push(locale.languageTag);
      if (locale.languageCode && locale.regionCode) {
        tags.push(`${locale.languageCode}-${locale.regionCode}`);
      } else if (locale.languageCode) {
        tags.push(locale.languageCode);
      }
    }
  } catch {
    // expo-localization not available
  }

  return tags;
}

export function detectDeviceLocale(): Locale {
  for (const tag of collectSystemLocaleTags()) {
    const locale = normalizeLocaleTag(tag);
    if (locale) return locale;
  }
  return inferTraditionalChineseRegion();
}

/** Native app default: Traditional Chinese unless device clearly prefers zh-TW or zh-Hans. */
export function defaultNativeLocale(): Locale {
  const detected = detectDeviceLocale();
  if (detected === "zh-TW" || detected === "zh-Hans") return detected;
  return "zh-HK";
}

/** @deprecated Use detectDeviceLocale */
export function detectBrowserLocale(): Locale {
  return detectDeviceLocale();
}

function migrateStoredLocale(value: string | null): Locale | null {
  if (value === LEGACY_LOCALE_KEY) return "zh-HK";
  return isLocale(value) ? value : null;
}

export async function loadStoredLocale(): Promise<Locale | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return null;
      const value = localStorage.getItem(LOCALE_KEY);
      const locale = migrateStoredLocale(value);
      if (value === LEGACY_LOCALE_KEY && locale) {
        localStorage.setItem(LOCALE_KEY, locale);
      }
      return locale;
    }
    const value = await AsyncStorage.getItem(LOCALE_KEY);
    const locale = migrateStoredLocale(value);
    if (value === LEGACY_LOCALE_KEY && locale) {
      await AsyncStorage.setItem(LOCALE_KEY, locale);
    }
    return locale;
  } catch {
    return null;
  }
}

export async function saveStoredLocale(locale: Locale): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(LOCALE_KEY, locale);
      return;
    }
    await AsyncStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // ignore persistence errors
  }
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}
