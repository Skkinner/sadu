// StationScoringService: weighted, explainable station scores. Deterministic: same inputs → same output.
import { PERSONALIZATION, type Weights } from "../../config/personalization.ts";
import { INTERESTS, STATIONS, type StationMeta } from "../../data/stations.ts";
import type { ExperienceType, Interest, PavilionId, Reason, ScoreComponents, StationScore, VisitorPrefs } from "./types.ts";

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Cosine similarity between the visitor's (binary) interest vector and the station's tag weights. */
export function interestMatch(station: StationMeta, interests: Interest[]) {
  if (!interests.length) return 0;
  const tagNorm = Math.sqrt(INTERESTS.reduce((s, i) => s + (station.tags[i] ?? 0) ** 2, 0));
  if (!tagNorm) return 0;
  const dot = interests.reduce((s, i) => s + (station.tags[i] ?? 0), 0);
  return dot / (Math.sqrt(interests.length) * tagNorm);
}

/** Editorial relevance: half heritage recognition, half connection to Saudi culture. */
export function culturalRelevance(station: StationMeta) {
  return 0.5 * station.relevance.heritage + 0.5 * station.relevance.saudi;
}

/** Share of the visitor's preferred experience types this station offers (neutral 0.5 when none chosen). */
export function preferenceMatch(station: StationMeta, experiences: ExperienceType[]) {
  if (!experiences.length) return 0.5;
  return experiences.filter((e) => station.experiences.includes(e)).length / experiences.length;
}

export function mainThemes(station: StationMeta): Interest[] {
  return INTERESTS.filter((i) => (station.tags[i] ?? 0) >= PERSONALIZATION.mainThemeThreshold);
}

/** Share of the station's main themes not already covered by the stations chosen so far. */
export function diversityBonus(station: StationMeta, chosen: PavilionId[]) {
  const themes = mainThemes(station);
  if (!themes.length) return 0;
  const covered = new Set(chosen.flatMap((id) => mainThemes(STATIONS[id])));
  return themes.filter((t) => !covered.has(t)).length / themes.length;
}

/** Demo accessibility metadata: mean of step-free, seating, shade, quiet space. */
export function accessibilityScore(station: StationMeta) {
  const a = station.access;
  return [a.stepFree, a.seating, a.shade, a.quiet].filter(Boolean).length / 4;
}

export function scoreStation(
  id: PavilionId,
  prefs: Pick<VisitorPrefs, "interests" | "experiences">,
  chosen: PavilionId[] = [],
  weights: Weights = PERSONALIZATION.weights,
): StationScore {
  const s = STATIONS[id];
  const components: ScoreComponents = {
    interest: interestMatch(s, prefs.interests),
    cultural: culturalRelevance(s),
    preference: preferenceMatch(s, prefs.experiences),
    diversity: diversityBonus(s, chosen.filter((c) => c !== id)),
    accessibility: accessibilityScore(s),
  };
  const weighted = Object.fromEntries(
    (Object.keys(components) as (keyof ScoreComponents)[]).map((k) => [k, round(components[k] * weights[k])]),
  ) as ScoreComponents;
  const total = round(Object.values(weighted).reduce((a, b) => a + b, 0));
  return {
    id,
    total,
    components: Object.fromEntries(Object.entries(components).map(([k, v]) => [k, round(v)])) as ScoreComponents,
    weighted,
    reasons: explain(s, prefs, components, chosen),
  };
}

function explain(s: StationMeta, prefs: Pick<VisitorPrefs, "interests" | "experiences">, c: ScoreComponents, chosen: PavilionId[]): Reason[] {
  const reasons: Reason[] = [];
  const matched = prefs.interests.filter((i) => (s.tags[i] ?? 0) >= 0.5).sort((a, b) => (s.tags[b] ?? 0) - (s.tags[a] ?? 0));
  if (matched.length) reasons.push({ code: "interests", interests: matched });
  if (s.relevance.saudi === 1) reasons.push({ code: "saudi" });
  if (s.relevance.heritage === 1) reasons.push({ code: "heritage" });
  const types = prefs.experiences.filter((e) => s.experiences.includes(e));
  if (types.length) reasons.push({ code: "experiences", experiences: types });
  if (chosen.length && c.diversity >= 0.5) {
    const covered = new Set(chosen.filter((x) => x !== s.id).flatMap((id) => mainThemes(STATIONS[id])));
    const fresh = mainThemes(s).filter((t) => !covered.has(t));
    if (fresh.length) reasons.push({ code: "newThemes", interests: fresh });
  }
  if (s.access.stepFree && s.access.seating) reasons.push({ code: "accessible" });
  return reasons;
}

/** Scores every station independently (no diversity context), best first. */
export function rankStations(prefs: Pick<VisitorPrefs, "interests" | "experiences">, weights?: Weights) {
  return (Object.keys(STATIONS) as PavilionId[])
    .map((id) => scoreStation(id, prefs, [], weights))
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));
}
