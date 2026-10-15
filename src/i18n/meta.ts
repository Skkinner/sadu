import type { Metadata } from "next";
import { isLocale } from "./config";
import { getMessages, type Messages } from "./messages";

/** Build a localized <title> for a route from the message dictionary. */
export function localizedTitle(pick: (m: Messages) => string) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    if (!isLocale(locale)) return {};
    return { title: pick(getMessages(locale)) };
  };
}
