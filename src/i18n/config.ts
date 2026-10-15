export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const dir = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

/** A string available in both languages (used by mock data). */
export type Localized = Record<Locale, string>;

/** Replace {name} placeholders. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
