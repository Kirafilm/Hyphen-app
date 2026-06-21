import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { messagesByLocale } from "./messages";
import { applyDocumentLocale, defaultNativeLocale, detectDeviceLocale, loadStoredLocale, saveStoredLocale } from "./storage";
import type { Locale, Messages } from "./types";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  t: (key: string) => string;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function lookup(messages: Messages, path: string): string {
  const parts = path.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in current)) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-HK");
  const [ready, setReady] = useState(Platform.OS !== "web");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await loadStoredLocale();
      if (cancelled) return;
      const next = stored ?? (Platform.OS === "web" ? detectDeviceLocale() : defaultNativeLocale());
      setLocaleState(next);
      applyDocumentLocale(next);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyDocumentLocale(next);
    void saveStoredLocale(next);
  }, []);

  const messages = messagesByLocale[locale];

  const t = useCallback((key: string) => lookup(messages, key), [messages]);

  const value = useMemo(
    () => ({ locale, setLocale, messages, t, ready }),
    [locale, setLocale, messages, t, ready],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
