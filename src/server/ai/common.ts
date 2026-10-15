import "server-only";

import { createHash } from "node:crypto";
import type { PavilionId } from "@/data/pavilions";
import { SOURCES, sourceText } from "@/data/sources";
import type { Locale } from "@/i18n/config";

export const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 24);

/** Changes whenever a station's source note changes, so cached generations are refreshed. */
export const sourceHash = (id: PavilionId) => sha(sourceText(id));

export const LANG_NAME: Record<Locale, string> = { en: "English", ar: "Arabic (Modern Standard Arabic, warm and easy to listen to)" };

export const referenceIds = (id: PavilionId) => SOURCES[id].references.map((r) => r.id);

export function referencesFor(id: PavilionId, cited?: string[]) {
  const refs = SOURCES[id].references;
  const used = cited?.length ? refs.filter((r) => cited.includes(r.id)) : refs;
  return used.length ? used : refs;
}

const ARABIC = /[؀-ۿ]/g;
const LETTER = /\p{L}/gu;
/** Rough language check on generated text: Arabic output must be mostly Arabic script, English must not be. */
export function languageProblem(text: string, lang: Locale) {
  const letters = text.match(LETTER)?.length ?? 0;
  if (!letters) return "empty text";
  const arabic = (text.match(ARABIC)?.length ?? 0) / letters;
  if (lang === "ar" && arabic < 0.6) return "the text must be written in Arabic";
  if (lang === "en" && arabic > 0.05) return "the text must be written in English";
  return null;
}

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** One in-flight generation per key: concurrent requests for the same item share one model call. */
const inflight = new Map<string, Promise<unknown>>();
export function once<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = run().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export const GROUNDING_RULES = `Grounding rules (strict):
- Use ONLY the facts in the SOURCE NOTES. Do not add any other factual claim: no extra dates, numbers, names, places, materials, quotes or history.
- You may add narrative framing that is clearly not a factual claim (e.g. inviting the listener to notice, imagine or reflect).
- Keep comparisons the notes mark as editorial framed as comparisons, not as historical facts.
- If something is not in the notes, leave it out rather than guessing.
- The station is illustrative demo content for a concept experience at Expo 2030 Riyadh; never call it an official or confirmed pavilion.
- Cite the reference ids (the [ids] in the notes) that support each part.`;
