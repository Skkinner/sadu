// Deterministic quiz scoring and missed-experience ranking. No LLM decides a score or a ranking.
import { DEPTHS } from "../../data/pavilions.ts";
import { STATIONS } from "../../data/stations.ts";
import { culturalRelevance, mainThemes, scoreStation } from "./scoring.ts";
import type { JourneyStop } from "./compression.ts";
import type { Depth, PavilionId, VisitorPrefs } from "./types.ts";

export type QuizAnswer = { stationId: PavilionId; depth: Depth; picked: number; correctIndex: number };

export const isCorrect = (a: Pick<QuizAnswer, "picked" | "correctIndex">) => a.picked === a.correctIndex;

export function quizScore(answers: QuizAnswer[]) {
  const correct = answers.filter(isCorrect).length;
  return { correct, total: answers.length, points: correct * 10 };
}

/**
 * Which depth's question to ask: the depth the visitor actually completed (a stop downgraded mid-journey is
 * asked about the shorter experience it really was).
 */
export const quizDepthFor = (stop: Pick<JourneyStop, "depth">): Depth => stop.depth;

export type MissedKind = "skipped" | "shortened" | "notPlanned";
export type MissedItem = {
  id: PavilionId;
  kind: MissedKind;
  /** depth the visitor experienced (shortened) */
  experienced?: Depth;
  rank: number;
  newThemes: string[];
};

const KIND_WEIGHT: Record<MissedKind, number> = { skipped: 1, shortened: 0.6, notPlanned: 0.4 };

/**
 * Rank what the visitor missed: 0.5 × personalization score + 0.2 × cultural relevance
 *  + 0.2 × kind (skipped from the plan > visited at a shorter depth > never planned) + 0.1 × uncovered themes.
 * "Skipped" (planned, then removed or never reached) is kept distinct from "shortened" (visited below Deep Dive).
 */
export function rankMissed(prefs: Pick<VisitorPrefs, "interests" | "experiences">, stops: Pick<JourneyStop, "id" | "status" | "depth">[]): MissedItem[] {
  const visited = stops.filter((s) => s.status === "done");
  const covered = new Set(visited.flatMap((s) => mainThemes(STATIONS[s.id])));
  const items: MissedItem[] = [];
  for (const id of Object.keys(STATIONS) as PavilionId[]) {
    const stop = stops.find((s) => s.id === id);
    let kind: MissedKind;
    if (!stop) kind = "notPlanned";
    else if (stop.status !== "done") kind = "skipped";
    else if (DEPTHS.indexOf(stop.depth) < DEPTHS.indexOf("deep")) kind = "shortened";
    else continue;
    const themes = mainThemes(STATIONS[id]);
    const fresh = themes.filter((t) => !covered.has(t));
    const rank =
      0.5 * scoreStation(id, prefs).total +
      0.2 * culturalRelevance(STATIONS[id]) +
      0.2 * KIND_WEIGHT[kind] +
      0.1 * (themes.length ? fresh.length / themes.length : 0);
    items.push({ id, kind, experienced: kind === "shortened" ? stop!.depth : undefined, rank: Math.round(rank * 1000) / 1000, newThemes: fresh });
  }
  return items.sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id));
}
