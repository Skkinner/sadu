import type { Locale } from "@/i18n/config";

/** 635 → "10:35 AM" / "10:35 ص" (Western digits, as in the design). */
export function clock(minutesSinceMidnight: number, locale: Locale) {
  const h24 = Math.floor(minutesSinceMidnight / 60) % 24;
  const m = minutesSinceMidnight % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = locale === "ar" ? (h24 < 12 ? "ص" : "م") : h24 < 12 ? "AM" : "PM";
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function clockFromDate(date: Date, locale: Locale) {
  return clock(date.getHours() * 60 + date.getMinutes(), locale);
}

/** 72 → "1:12" */
export function mmss(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 120 → "2:00" (hours:minutes for the custom-time stepper) */
export function hhmm(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Human duration for summaries: 120 → "2 hours" / "ساعتين" */
export function durationLabel(minutes: number, locale: Locale, nominative = false) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === "ar") {
    const hours = h === 0 ? "" : h === 1 ? "ساعة" : h === 2 ? (nominative ? "ساعتان" : "ساعتين") : `${h} ساعات`;
    if (!m) return hours;
    return hours ? `${hours} و${m} دقيقة` : `${m} دقيقة`;
  }
  const hours = h === 0 ? "" : h === 1 ? "1 hour" : `${h} hours`;
  if (!m) return hours;
  return hours ? `${hours} ${m} min` : `${m} min`;
}

export function longDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
