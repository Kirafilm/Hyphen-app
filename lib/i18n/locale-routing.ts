import type { JobLocation } from "../job-locations";
import type { Locale } from "./types";

export function defaultJobLocationForLocale(locale: Locale): JobLocation {
  return locale === "zh-TW" ? "台灣" : "香港";
}

export function webMarketingHomePath(locale: Locale): "/tw" | "/" {
  return locale === "zh-TW" ? "/tw" : "/";
}

export function isTaiwanMarketingHome(pathname: string): boolean {
  const path = (pathname || "/").replace(/\/$/, "") || "/";
  return path === "/tw";
}

export function isDefaultMarketingHome(pathname: string): boolean {
  const path = (pathname || "/").replace(/\/$/, "") || "/";
  return path === "/" || path === "/index";
}
