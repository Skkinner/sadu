import "server-only";

// AIContentService: station stories at three depths, in Arabic and English, grounded in the cited source note.
import * as z from "zod/v4";
import { DEPTHS, getPavilion, type Depth, type PavilionId } from "@/data/pavilions";
import { sourceText } from "@/data/sources";
import type { Locale } from "@/i18n/config";
import type { ContentResponse, StationContent } from "@/lib/ai-types";
import { getCached, putCached } from "@/server/db";
import { GROUNDING_RULES, LANG_NAME, languageProblem, once, referenceIds, referencesFor, sourceHash, wordCount } from "./common";
import { AiUnavailable, generateStructured } from "./llm";

const PROMPT_VERSION = "content-v1";

/** Target narration length. ~140 spoken words/min in English, ~110 in Arabic. */
export const DEPTH_TARGET: Record<Depth, { minutes: string; sections: [number, number]; words: Record<Locale, [number, number]> }> = {
  glimpse: { minutes: "1–2", sections: [1, 1], words: { en: [140, 280], ar: [110, 220] } },
  visit: { minutes: "3–5", sections: [2, 3], words: { en: [420, 700], ar: [330, 550] } },
  deep: { minutes: "6–10", sections: [4, 5], words: { en: [840, 1400], ar: [660, 1100] } },
};

const ContentSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({ heading: z.string(), text: z.string(), refs: z.array(z.string()) })),
  takeaways: z.array(z.string()),
  essence: z.string(),
});

const SYSTEM = `You are the storyteller of Sadu, a bilingual audio guide that turns a visit to Expo 2030 Riyadh into one connected cultural story.
You write narration that will be read aloud by a text-to-speech voice: short, vivid sentences; no lists, headings inside the text, markdown, emoji or parentheses; numbers written the way they should be spoken.
${GROUNDING_RULES}`;

export function contentKey(id: PavilionId, depth: Depth, lang: Locale) {
  return `${id}|${depth}|${lang}|${sourceHash(id)}|${PROMPT_VERSION}`;
}

function validator(id: PavilionId, depth: Depth, lang: Locale) {
  const allowed = new Set(referenceIds(id));
  const t = DEPTH_TARGET[depth];
  return (c: StationContent): string | null => {
    if (c.sections.length < t.sections[0] || c.sections.length > t.sections[1]) return `use ${t.sections[0]}–${t.sections[1]} sections, not ${c.sections.length}`;
    for (const s of c.sections) {
      if (!s.text.trim() || !s.heading.trim()) return "every section needs a heading and text";
      if (!s.refs.length) return `section "${s.heading}" must cite at least one reference id`;
      const bad = s.refs.find((r) => !allowed.has(r));
      if (bad) return `"${bad}" is not one of the reference ids (${[...allowed].join(", ")})`;
    }
    const words = c.sections.reduce((n, s) => n + wordCount(s.text), 0);
    const [lo, hi] = t.words[lang];
    if (words < lo * 0.75 || words > hi * 1.3) return `the narration should be about ${lo}–${hi} words, it is ${words}`;
    if (c.takeaways.length !== 3) return "give exactly three takeaways";
    return languageProblem([c.title, ...c.sections.map((s) => s.text), ...c.takeaways, c.essence].join(" "), lang);
  };
}

/** Pre-written copy from the station catalogue, used (and labelled) when generation is unavailable. */
export function fallbackContent(id: PavilionId, depth: Depth, lang: Locale): StationContent {
  const p = getPavilion(id)!;
  const chapters = depth === "glimpse" ? p.chapters.slice(0, 1) : depth === "visit" ? p.chapters.slice(0, 2) : p.chapters;
  const refs = referenceIds(id);
  return {
    title: p.title[lang],
    sections: chapters.map((c) => ({ heading: c.title[lang], text: c.captions[lang].join(" "), refs })),
    takeaways: p.takeaways.map((x) => x[lang]),
    essence: p.essence[lang],
  };
}

export async function getStationContent(id: PavilionId, depth: Depth, lang: Locale, opts: { allowGenerate?: boolean } = {}): Promise<ContentResponse> {
  const key = contentKey(id, depth, lang);
  const base = { stationId: id, depth, lang };
  const cached = getCached<StationContent>("content", key);
  if (cached) {
    const cited = cached.value.sections.flatMap((s) => s.refs);
    return { ...base, origin: "cache", model: cached.model, generatedAt: cached.createdAt, references: referencesFor(id, cited), data: cached.value };
  }
  try {
    if (opts.allowGenerate === false) throw new AiUnavailable("not_configured");
    const { value, model } = await once(`content:${key}`, () => generate(id, depth, lang));
    putCached("content", key, lang, value, model);
    const cited = value.sections.flatMap((s) => s.refs);
    return { ...base, origin: "ai", model, generatedAt: new Date().toISOString(), references: referencesFor(id, cited), data: value };
  } catch (e) {
    const notice = e instanceof AiUnavailable ? e.reason : "api_error";
    return { ...base, origin: "fallback", notice, references: referencesFor(id), data: fallbackContent(id, depth, lang) };
  }
}

function generate(id: PavilionId, depth: Depth, lang: Locale) {
  const p = getPavilion(id)!;
  const t = DEPTH_TARGET[depth];
  const prompt = `Write the ${depth === "glimpse" ? "Glimpse" : depth === "visit" ? "Standard" : "Deep Dive"} narration for the station "${p.title.en}".

Depth: ${depth} — about ${t.minutes} minutes when read aloud, ${t.words[lang][0]}–${t.words[lang][1]} words in total, in ${t.sections[0] === t.sections[1] ? t.sections[0] : `${t.sections[0]}–${t.sections[1]}`} section(s).
${depth === "glimpse" ? "A short, engaging introduction to the single most important idea." : depth === "visit" ? "A balanced explanation covering the main ideas." : "Detailed cultural storytelling that uses every fact in the notes."}
Language: write everything (title, headings, narration, takeaways, essence) in ${LANG_NAME[lang]}.

Return:
- title: a short, evocative title for the station
- sections: each with a heading, the narration text, and refs (reference ids that support it)
- takeaways: exactly three one-sentence takeaways, each supported by the notes
- essence: one sentence capturing the station's meaning

SOURCE NOTES:
${sourceText(id)}`;
  return generateStructured({ kind: "content", system: SYSTEM, prompt, schema: ContentSchema, effort: "medium", validate: validator(id, depth, lang) });
}

export const ALL_DEPTHS = DEPTHS;
