import "server-only";

// NarrativeBridgeService: one or two sentences that carry the story from the previous stop to the next one,
// so the route reads as one journey. Built from both stations' source notes; cached per (from, to, language),
// so a changed route simply retrieves or generates the pairs it now needs.
import * as z from "zod/v4";
import { getPavilion, type PavilionId } from "@/data/pavilions";
import { SOURCES } from "@/data/sources";
import type { Locale } from "@/i18n/config";
import type { BridgeResponse } from "@/lib/ai-types";
import { getCached, putCached } from "@/server/db";
import { LANG_NAME, languageProblem, once, sourceHash, wordCount } from "./common";
import { AiUnavailable, generateStructured } from "./llm";

const PROMPT_VERSION = "bridge-v1";
const BridgeSchema = z.object({ text: z.string() });

const notes = (id: PavilionId) => `${SOURCES[id].topic}\n${SOURCES[id].facts.map((f) => `- ${f.replace(/\s*\[[^\]]+\]$/, "")}`).join("\n")}`;

export function fallbackBridge(from: PavilionId, to: PavilionId, lang: Locale) {
  const a = getPavilion(from)!;
  const b = getPavilion(to)!;
  return lang === "ar"
    ? `بعد ${a.shortTitle.ar}، نكمل الحكاية في ${b.place.ar}: ${b.shortTitle.ar}.`
    : `From ${a.shortTitle.en}, the story continues at the ${b.place.en}: ${b.shortTitle.en}.`;
}

export async function getBridge(from: PavilionId, to: PavilionId, lang: Locale, opts: { allowGenerate?: boolean } = {}): Promise<BridgeResponse> {
  const key = `${from}>${to}|${lang}|${sourceHash(from)}|${sourceHash(to)}|${PROMPT_VERSION}`;
  const base = { fromId: from, toId: to, lang, references: [] };
  const cached = getCached<{ text: string }>("bridge", key);
  if (cached) return { ...base, origin: "cache", model: cached.model, generatedAt: cached.createdAt, data: cached.value };
  try {
    if (opts.allowGenerate === false) throw new AiUnavailable("not_configured");
    const { value, model } = await once(`bridge:${key}`, () => generate(from, to, lang));
    putCached("bridge", key, lang, value, model);
    return { ...base, origin: "ai", model, generatedAt: new Date().toISOString(), data: value };
  } catch (e) {
    return { ...base, origin: "fallback", notice: e instanceof AiUnavailable ? e.reason : "api_error", data: { text: fallbackBridge(from, to, lang) } };
  }
}

function generate(from: PavilionId, to: PavilionId, lang: Locale) {
  const max = lang === "ar" ? 40 : 45;
  return generateStructured({
    kind: "bridge",
    system: `You write the spoken transition between two stops of Sadu, a cultural audio guide at Expo 2030 Riyadh. It is read aloud while the visitor walks.
Find a genuine thematic thread between the two stops (a shared value, material, idea or question) and use it to hand the story over.
Use only what the notes say: no new facts, no numbers or dates, no claims about distances or directions.`,
    prompt: `Write a transition of one or two sentences (at most ${max} words) in ${LANG_NAME[lang]}.
First, briefly recall what the visitor has just discovered at the PREVIOUS stop; then invite them toward the NEXT stop.

PREVIOUS stop: ${getPavilion(from)!.title.en}
${notes(from)}

NEXT stop: ${getPavilion(to)!.title.en}
${notes(to)}`,
    schema: BridgeSchema,
    effort: "low",
    maxTokens: 4000,
    validate: ({ text }) => {
      if (wordCount(text) > max) return `keep it under ${max} words`;
      if (/[0-9٠-٩]/.test(text)) return "do not use numbers";
      return languageProblem(text, lang);
    },
  });
}
