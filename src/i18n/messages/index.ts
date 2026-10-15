import type { Locale } from "@/i18n/config";
import { ar } from "./ar";
import { en, type Messages } from "./en";

export const dictionaries: Record<Locale, Messages> = { en, ar };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export type { Messages };
