import type { Locale } from "../types";
import { messages as zhHK } from "./zh-HK";
import { messages as zhTW } from "./zh-TW";
import { messages as zhHans } from "./zh-Hans";
import { messages as en } from "./en";

export const messagesByLocale: Record<Locale, typeof zhHK> = {
  "zh-HK": zhHK,
  "zh-TW": zhTW,
  "zh-Hans": zhHans,
  en,
};
