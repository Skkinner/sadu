"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dir, fmt, type Locale, type Localized } from "@/i18n/config";
import { dictionaries, type Messages } from "@/i18n/messages";

type I18n = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Messages;
  /** pick the current language from a {en, ar} pair */
  l: (value: Localized) => string;
  fmt: typeof fmt;
  /** prefix an app path with the current locale */
  href: (path: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({
      locale,
      dir: dir(locale),
      t: dictionaries[locale],
      l: (v) => v[locale],
      fmt,
      href: (path) => `/${locale}${path === "/" ? "" : path}`,
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

