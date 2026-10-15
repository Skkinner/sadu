import "server-only";

// PersonalizedSummaryService: an end-of-journey recap written by the LLM from the visitor's real session.
// The input is built on the server from the account's stored journey (not from anything the browser claims),
// and contains only what the recap needs: first name, interests, time, stops, depths, quiz results, misses.
// Output is validated so it can only highlight stations that were actually completed and only suggest
// stations that were actually missed.
import * as z from "zod/v4";
import { DEPTHS, getPavilion, isStationId, type Depth, type PavilionId } from "@/data/pavilions";
import { SOURCES } from "@/data/sources";
import { INTERESTS, type Interest } from "@/data/stations";
import type { Locale } from "@/i18n/config";
import type { JourneySummary } from "@/lib/ai-types";
import { rankMissed } from "@/lib/engine";
import { LANG_NAME, languageProblem } from "./common";
import { AiUnavailable, generateStructured } from "./llm";

type StoredStop = { id: string; depth: string; plannedDepth?: string; status: string; change?: { type: string } };
type StoredAnswer = { depth?: string; question?: string; options?: string[]; picked?: number; correctIndex?: number };

export type SummaryInput = {
  firstName: string;
  lang: Locale;
  interests: Interest[];
  budgetMinutes: number;
  elapsedMinutes: number;
  completed: { id: PavilionId; depth: Depth; plannedDepth: Depth; shortened: boolean }[];
  skipped: PavilionId[];
  quiz: { stationId: PavilionId; question: string; chosen: string; correctAnswer: string; correct: boolean }[];
  missed: { id: PavilionId; kind: string }[];
};

const isDepth = (d: unknown): d is Depth => DEPTHS.includes(d as Depth);

/** Builds the minimal summary input from stored (untrusted) account data. */
export function buildSummaryInput(firstName: string, lang: Locale, data: unknown): SummaryInput | null {
  const d = (data ?? {}) as { plan?: { interests?: unknown[]; experiences?: unknown[] }; journey?: { stops?: StoredStop[]; budget?: number; clock?: { elapsed?: number }; answers?: Record<string, StoredAnswer> } };
  const stops = (d.journey?.stops ?? []).filter((s) => isStationId(s?.id) && isDepth(s.depth));
  if (!stops.length) return null;
  const interests = (d.plan?.interests ?? []).filter((i): i is Interest => INTERESTS.includes(i as Interest));
  const completed = stops
    .filter((s) => s.status === "done")
    .map((s) => ({ id: s.id as PavilionId, depth: s.depth as Depth, plannedDepth: (isDepth(s.plannedDepth) ? s.plannedDepth : s.depth) as Depth, shortened: s.change?.type === "downgraded" }));
  const skipped = stops.filter((s) => s.status !== "done" && s.status !== "arrived").map((s) => s.id as PavilionId);
  const quiz = Object.entries(d.journey?.answers ?? {})
    .filter(([id, a]) => isStationId(id) && Array.isArray(a?.options) && typeof a.picked === "number" && typeof a.correctIndex === "number")
    .map(([id, a]) => ({
      stationId: id as PavilionId,
      question: String(a.question ?? "").slice(0, 300),
      chosen: String(a.options![a.picked!] ?? "").slice(0, 200),
      correctAnswer: String(a.options![a.correctIndex!] ?? "").slice(0, 200),
      correct: a.picked === a.correctIndex,
    }));
  const missed = rankMissed({ interests, experiences: [] }, stops.map((s) => ({ id: s.id as PavilionId, status: s.status as "done", depth: s.depth as Depth })))
    .slice(0, 4)
    .map((m) => ({ id: m.id, kind: m.kind }));
  return {
    firstName: firstName.slice(0, 60),
    lang,
    interests,
    budgetMinutes: Math.round(Number(d.journey?.budget) || 0),
    elapsedMinutes: Math.round(Number(d.journey?.clock?.elapsed) || 0),
    completed,
    skipped,
    quiz,
    missed,
  };
}

const SummarySchema = z.object({
  recap: z.string(),
  themes: z.array(z.string()),
  highlights: z.array(z.object({ stationId: z.string(), text: z.string() })),
  understood: z.array(z.string()),
  exploreNext: z.array(z.object({ stationId: z.string(), text: z.string() })),
  closing: z.string(),
});

const depthName = { glimpse: "Glimpse (1–2 min)", visit: "Standard (3–5 min)", deep: "Deep Dive (6–10 min)" };

export async function generateSummary(input: SummaryInput) {
  const visited = new Set(input.completed.map((c) => c.id));
  const missedIds = new Set([...input.missed.map((m) => m.id), ...input.skipped, ...input.completed.filter((c) => c.depth !== "deep").map((c) => c.id)]);
  const station = (id: PavilionId) => `${id} = ${getPavilion(id)!.title.en} (${SOURCES[id].topic})`;
  const session = [
    `Visitor first name: ${input.firstName}`,
    `Selected interests: ${input.interests.join(", ") || "none"}`,
    `Time available: ${input.budgetMinutes} minutes; simulated time used: ${input.elapsedMinutes} minutes`,
    `Completed stations:`,
    ...(input.completed.length
      ? input.completed.map((c) => `- ${station(c.id)}; completed at ${depthName[c.depth]}${c.shortened ? ` (shortened from ${depthName[c.plannedDepth]} to stay on time)` : ""}`)
      : ["- none"]),
    `Planned but not visited: ${input.skipped.map((id) => station(id)).join("; ") || "none"}`,
    `Quiz answers:`,
    ...(input.quiz.length ? input.quiz.map((q) => `- [${q.stationId}] ${q.question} → chose "${q.chosen}" (${q.correct ? "correct" : `incorrect; the answer was "${q.correctAnswer}"`})`) : ["- none"]),
    `Ranked suggestions for next time: ${input.missed.map((m) => `${m.id} (${m.kind})`).join(", ") || "none"}`,
  ].join("\n");
  const factsFor = [...visited].map((id) => `${id}: ${SOURCES[id].facts.map((f) => f.replace(/\s*\[[^\]]+\]$/, "")).join(" ")}`).join("\n");

  return generateStructured({
    kind: "summary",
    system: `You write the personal end-of-visit summary for Sadu, a cultural audio guide at Expo 2030 Riyadh.
Be warm, specific and honest. Describe ONLY what the session data says happened: never invent stations, depths, scores or achievements, and do not praise answers that were wrong.
Cultural facts may come only from the SOURCE NOTES of stations the visitor completed.`,
    prompt: `Write the summary in ${LANG_NAME[input.lang]}. Address the visitor by first name.

Return:
- recap: 2–4 sentences recapping this specific journey
- themes: 2–4 cultural themes the visitor actually explored
- highlights: one per completed station (stationId + one sentence on what they learned there); empty if nothing was completed
- understood: 1–3 points where the quiz answers show understanding; if no answer was correct, say kindly what is worth revisiting instead
- exploreNext: 1–3 suggestions (stationId + one sentence), chosen only from the stations not visited or visited at a shorter depth
- closing: one meaningful closing sentence

SESSION DATA:
${session}

SOURCE NOTES (completed stations only):
${factsFor || "none"}`,
    schema: SummarySchema,
    effort: "medium",
    validate: (s) => {
      if (input.completed.length && !s.highlights.length) return "add a highlight for each completed station";
      const badHighlight = s.highlights.find((h) => !visited.has(h.stationId as PavilionId));
      if (badHighlight) return `"${badHighlight.stationId}" was not completed, so it cannot be a highlight`;
      const badNext = s.exploreNext.find((h) => !isStationId(h.stationId) || !missedIds.has(h.stationId));
      if (badNext) return `"${badNext.stationId}" is not one of the missed or shortened stations`;
      if (!s.recap.trim() || !s.closing.trim()) return "recap and closing are required";
      return languageProblem([s.recap, ...s.themes, ...s.highlights.map((h) => h.text), s.closing].join(" "), input.lang);
    },
  }) as Promise<{ value: JourneySummary; model: string }>;
}

/** Deterministic, clearly labelled summary when the LLM is unavailable. */
export function fallbackSummary(input: SummaryInput): JourneySummary {
  const ar = input.lang === "ar";
  const name = (id: PavilionId) => getPavilion(id)!.shortTitle[input.lang];
  const correct = input.quiz.filter((q) => q.correct).length;
  return {
    recap: ar
      ? `يا ${input.firstName}، أكملت ${input.completed.length} من المحطات خلال ${input.elapsedMinutes} دقيقة، وأجبت عن ${correct} من ${input.quiz.length} أسئلة إجابة صحيحة.`
      : `${input.firstName}, you completed ${input.completed.length} stations in ${input.elapsedMinutes} minutes and answered ${correct} of ${input.quiz.length} questions correctly.`,
    themes: [...new Set(input.completed.map((c) => SOURCES[c.id].topic))].slice(0, 4),
    highlights: input.completed.map((c) => ({ stationId: c.id, text: getPavilion(c.id)!.essence[input.lang] })),
    understood: input.quiz.filter((q) => q.correct).map((q) => q.question).slice(0, 3),
    exploreNext: input.missed.slice(0, 3).map((m) => ({ stationId: m.id, text: name(m.id) })),
    closing: ar ? "شكراً لأنك نسجت رحلتك مع سدو." : "Thank you for weaving your journey with Sadu.",
  };
}

export { AiUnavailable };
