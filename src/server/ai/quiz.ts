import "server-only";

// QuizGenerationService: one multiple-choice question per station × depth × language, generated from the
// verified source note and the narration the visitor heard at that depth. Every question passes:
//  1. schema + structural checks (four distinct options, a valid correct index, cited references), and
//  2. an answerability check: a second, independent model call must pick the same answer using only the notes,
//     which filters out ambiguous questions and questions with more than one defensible answer.
// Grading is deterministic (src/lib/engine/assessment.ts); the model never scores an answer.
import * as z from "zod/v4";
import { DEPTHS, getPavilion, type Depth, type PavilionId } from "@/data/pavilions";
import { sourceText } from "@/data/sources";
import type { Locale } from "@/i18n/config";
import type { GeneratedQuiz, QuizResponse } from "@/lib/ai-types";
import { getCached, putCached } from "@/server/db";
import { GROUNDING_RULES, LANG_NAME, languageProblem, once, referenceIds, referencesFor, sha, sourceHash } from "./common";
import { getStationContent } from "./content";
import { AiUnavailable, generateStructured } from "./llm";

const PROMPT_VERSION = "quiz-v1";

const QuizSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number().int(),
  explanation: z.string(),
  refs: z.array(z.string()),
});
const CheckSchema = z.object({ answerIndex: z.number().int(), onlyOneCorrect: z.boolean() });

const SYSTEM = `You write fair, unambiguous multiple-choice questions for visitors of Sadu, a cultural audio guide.
Each question has exactly one correct answer that is clearly supported by the source notes, and three plausible distractors that are clearly wrong according to the notes (not partly true, not "all of the above", not trick questions).
${GROUNDING_RULES}`;

const normalize = (s: string) => s.toLowerCase().replace(/[\s\p{P}]+/gu, " ").trim();

function structureProblem(q: GeneratedQuiz, id: PavilionId, lang: Locale) {
  if (q.options.length !== 4) return "give exactly four options";
  if (new Set(q.options.map(normalize)).size !== 4) return "the four options must all be different";
  if (q.options.some((o) => !o.trim())) return "options cannot be empty";
  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) return "correctIndex must be 0, 1, 2 or 3";
  if (!q.explanation.trim()) return "add a short explanation";
  const allowed = new Set(referenceIds(id));
  if (!q.refs.length || q.refs.some((r) => !allowed.has(r))) return `cite reference ids from: ${[...allowed].join(", ")}`;
  return languageProblem([q.question, ...q.options, q.explanation].join(" "), lang);
}

/** Deterministic shuffle (seeded by the item), so the correct answer is not always in the same position. */
function shuffle(q: GeneratedQuiz, seed: string): GeneratedQuiz {
  let h = parseInt(sha(seed).slice(0, 8), 16);
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) };
}

export function fallbackQuiz(id: PavilionId, depth: Depth, lang: Locale): GeneratedQuiz {
  const q = getPavilion(id)!.quiz[DEPTHS.indexOf(depth)];
  return { question: q.q[lang], options: q.options.map((o) => o[lang]), correctIndex: q.correct, explanation: q.fact[lang], refs: [] };
}

export async function getQuiz(id: PavilionId, depth: Depth, lang: Locale, opts: { allowGenerate?: boolean } = {}): Promise<QuizResponse> {
  const key = `${id}|${depth}|${lang}|${sourceHash(id)}|${PROMPT_VERSION}`;
  const base = { stationId: id, depth, lang, questionId: sha(key) };
  const cached = await getCached<GeneratedQuiz>("quiz", key);
  if (cached) return { ...base, origin: "cache", model: cached.model, generatedAt: cached.createdAt, references: referencesFor(id, cached.value.refs), data: cached.value };
  try {
    if (opts.allowGenerate === false) throw new AiUnavailable("not_configured");
    const { value, model } = await once(`quiz:${key}`, () => generate(id, depth, lang, key));
    await putCached("quiz", key, lang, value, model);
    return { ...base, origin: "ai", model, generatedAt: new Date().toISOString(), references: referencesFor(id, value.refs), data: value };
  } catch (e) {
    const notice = e instanceof AiUnavailable ? e.reason : "api_error";
    return { ...base, questionId: sha(`fallback|${id}|${depth}|${lang}`), origin: "fallback", notice, references: referencesFor(id), data: fallbackQuiz(id, depth, lang) };
  }
}

async function generate(id: PavilionId, depth: Depth, lang: Locale, key: string) {
  const content = await getStationContent(id, depth, lang);
  const heard = content.data.sections.map((s) => s.text).join("\n");
  const difficulty = depth === "glimpse" ? "about the single main idea" : depth === "visit" ? "about one of the main ideas" : "about a more specific detail";
  const prompt = `Write ONE multiple-choice question for a visitor who has just finished the ${depth} experience at "${getPavilion(id)!.title.en}". Ask ${difficulty} of what they heard.

The answer must be stated in the SOURCE NOTES, and also covered by the NARRATION THE VISITOR HEARD.
Language: write the question, all four options and the explanation in ${LANG_NAME[lang]}.
Return: question, options (exactly four), correctIndex (0-based index of the one correct option), explanation (one or two sentences on why it is correct), refs (reference ids).

SOURCE NOTES:
${sourceText(id)}

NARRATION THE VISITOR HEARD:
${heard}`;

  let lastProblem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const { value, model } = await generateStructured({
      kind: "quiz",
      system: SYSTEM,
      prompt: attempt ? `${prompt}\n\nA previous question was rejected: ${lastProblem}. Write a different, clearer question.` : prompt,
      schema: QuizSchema,
      effort: "medium",
      validate: (q) => structureProblem(q, id, lang),
    });
    const quiz = shuffle(value, key);
    const check = await generateStructured({
      kind: "quiz-check",
      system: "You check quiz questions. Answer strictly from the source notes.",
      prompt: `Using ONLY these source notes, which option answers the question? Also say whether exactly one option is correct according to the notes.

SOURCE NOTES:
${sourceText(id)}

QUESTION: ${quiz.question}
${quiz.options.map((o, i) => `${i}. ${o}`).join("\n")}

Return answerIndex (0-based) and onlyOneCorrect.`,
      schema: CheckSchema,
      effort: "low",
      maxTokens: 4000,
    });
    if (check.value.onlyOneCorrect && check.value.answerIndex === quiz.correctIndex) return { value: quiz, model };
    lastProblem = check.value.onlyOneCorrect ? "an independent check picked a different answer from the notes" : "more than one option could be correct";
  }
  throw new AiUnavailable("invalid_output", lastProblem);
}
