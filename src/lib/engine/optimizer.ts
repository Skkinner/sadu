// JourneyOptimizerService: greedy station selection with depth upgrades under a time budget.
//
// 1. Score every station (scoring.ts). Drop stations that are not step-free when the visitor needs it, and
//    stations below PERSONALIZATION.minScore.
// 2. Every candidate starts at the minimum experience (Glimpse).
// 3. Repeat: consider every feasible action — add a new station at Glimpse, or upgrade a chosen one
//    (Glimpse → Standard → Deep Dive, never deeper than the visitor's preferred depth) — and take the one with
//    the highest marginal value per extra minute. "Extra minutes" come from re-planning the whole route
//    (walking + simulated queues + experience), so travel cost is always included. Upgrades must also clear
//    PERSONALIZATION.minUpgradeValuePerMinute.
// 4. An action is feasible only if the re-planned journey still fits the budget, so the plan never exceeds it.
// 5. Finally the route is re-optimized and re-timed; restoreFeasibility() is a last guard that downgrades or
//    removes the lowest-value choices if the final timing (e.g. a queue slot change) ever overshoots.
import { PERSONALIZATION } from "../../config/personalization.ts";
import { queueMinutes } from "../../config/queue-estimates.ts";
import { DEPTH_MINUTES, DEPTHS } from "../../data/pavilions.ts";
import { GATE_POSITIONS, STATIONS } from "../../data/stations.ts";
import { distance, optimizeRoute, walkMinutes } from "./route.ts";
import { rankStations, scoreStation } from "./scoring.ts";
import type { Depth, Exclusion, JourneyPlan, PavilionId, PlannedStop, Point, StationScore, Timeline, TimedStop, VisitorPrefs } from "./types.ts";

export type Leg = { id: PavilionId; depth: Depth };

const pos = (l: { id: PavilionId }) => STATIONS[l.id].position;
const depthIndex = (d: Depth) => DEPTHS.indexOf(d);

/** Walks an ordered list of stops: walking time, simulated queue at the expected arrival time, experience. */
export function timeline(start: Point, startMinute: number, legs: Leg[]): Timeline {
  let here = start;
  let clock = startMinute;
  const stops: TimedStop[] = [];
  for (const leg of legs) {
    const metres = distance(here, pos(leg));
    const walkMin = walkMinutes(metres);
    const arriveAt = clock + walkMin;
    const queueMin = queueMinutes(leg.id, arriveAt);
    const experienceMin = DEPTH_MINUTES[leg.depth];
    const leaveAt = arriveAt + queueMin + experienceMin;
    stops.push({ id: leg.id, depth: leg.depth, walkMin, queueMin, experienceMin, arriveAt, leaveAt, distanceM: Math.round(metres) });
    here = pos(leg);
    clock = leaveAt;
  }
  const sum = (k: "walkMin" | "queueMin" | "experienceMin") => stops.reduce((s, x) => s + x[k], 0);
  const walking = sum("walkMin");
  const queue = sum("queueMin");
  const experience = sum("experienceMin");
  return {
    stops,
    totals: { experience, walking, queue, total: experience + walking + queue, distanceM: stops.reduce((s, x) => s + x.distanceM, 0) },
    end: here,
  };
}

/** Optimizes the visiting order (NN + 2-opt), then times it. */
export function planRoute(start: Point, startMinute: number, legs: Leg[]) {
  const { order, stats } = optimizeRoute(start, legs, pos);
  return { timeline: timeline(start, startMinute, order), stats };
}

/** Value of a stop: score^valueExponent × depth value (see PERSONALIZATION). */
export const stopValue = (score: StationScore, depth: Depth) => score.total ** PERSONALIZATION.valueExponent * PERSONALIZATION.depthValue[depth];
const value = stopValue;

export function planJourney(prefs: VisitorPrefs, startMinute: number = PERSONALIZATION.demoStartMinute): JourneyPlan {
  const start = GATE_POSITIONS[prefs.gate];
  const budget = Math.max(0, Math.round(prefs.minutes));
  const maxDepth = depthIndex(prefs.maxDepth);
  const ranking = rankStations(prefs);
  const excluded: Exclusion[] = [];
  const candidates: PavilionId[] = [];
  const reachable = (id: PavilionId) => !(prefs.stepFreeOnly && !STATIONS[id].access.stepFree);
  const best = ranking.find((s) => reachable(s.id))?.total ?? 0;
  const threshold = Math.max(PERSONALIZATION.minScore, PERSONALIZATION.relativeMinScore * best);
  for (const s of ranking) {
    if (!reachable(s.id)) excluded.push({ id: s.id, why: "notStepFree" });
    else if (s.total < threshold) excluded.push({ id: s.id, why: "lowMatch" });
    else candidates.push(s.id);
  }

  // chosen stations in selection order, with the score they had when chosen (diversity depends on that order)
  const chosen: { id: PavilionId; depth: Depth; score: StationScore }[] = [];
  const cost = (legs: Leg[]) => planRoute(start, startMinute, legs).timeline.totals.total;
  let current = 0;

  for (;;) {
    let best: { ratio: number; apply: () => void; newCost: number } | null = null;
    const consider = (ratio: number, newCost: number, apply: () => void) => {
      if (newCost <= budget && (!best || ratio > best.ratio + 1e-12)) best = { ratio, apply, newCost };
    };
    const legs = chosen.map(({ id, depth }) => ({ id, depth }));

    for (const id of candidates) {
      if (chosen.some((c) => c.id === id)) continue;
      const score = scoreStation(id, prefs, chosen.map((c) => c.id));
      const newCost = cost([...legs, { id, depth: "glimpse" }]);
      consider(value(score, "glimpse") / Math.max(newCost - current, 0.5), newCost, () => chosen.push({ id, depth: "glimpse", score }));
    }
    for (const c of chosen) {
      const i = depthIndex(c.depth);
      if (i >= maxDepth) continue;
      const next = DEPTHS[i + 1];
      const newCost = cost(legs.map((l) => (l.id === c.id ? { ...l, depth: next } : l)));
      const ratio = (value(c.score, next) - value(c.score, c.depth)) / Math.max(newCost - current, 0.5);
      if (ratio >= PERSONALIZATION.minUpgradeValuePerMinute) consider(ratio, newCost, () => (c.depth = next));
    }

    const pick = best as { apply: () => void; newCost: number } | null;
    if (!pick) break;
    pick.apply();
    current = pick.newCost;
  }

  for (const id of candidates) if (!chosen.some((c) => c.id === id)) excluded.push({ id, why: "noTime" });

  const restored = restoreFeasibility(
    start,
    startMinute,
    budget,
    chosen.map((c) => ({ id: c.id, depth: c.depth, score: c.score })),
  );
  const { timeline: tl, stats } = planRoute(start, startMinute, restored.map(({ id, depth }) => ({ id, depth })));
  const byId = new Map(chosen.map((c) => [c.id, c]));
  const stops: PlannedStop[] = tl.stops.map((s) => ({ ...s, score: byId.get(s.id)!.score, plannedDepth: s.depth }));
  for (const c of chosen) if (!restored.some((r) => r.id === c.id)) excluded.push({ id: c.id, why: "noTime" });

  return { budget, stops, totals: tl.totals, slack: budget - tl.totals.total, route: stats, excluded, ranking };
}

/**
 * Last guard: while the timed route exceeds the budget, downgrade the stop with the lowest value lost per
 * minute saved; when everything is at Glimpse, remove the lowest-value stop.
 */
export function restoreFeasibility<T extends Leg & { score: StationScore }>(start: Point, startMinute: number, budget: number, items: T[]): T[] {
  let list = items.map((i) => ({ ...i }));
  const total = () => planRoute(start, startMinute, list).timeline.totals.total;
  while (list.length && total() > budget) {
    const downgradable = list.filter((l) => l.depth !== "glimpse");
    if (downgradable.length) {
      const victim = downgradable.sort((a, b) => value(a.score, a.depth) - value(b.score, b.depth) || a.id.localeCompare(b.id))[0];
      victim.depth = DEPTHS[depthIndex(victim.depth) - 1];
    } else {
      const victim = [...list].sort((a, b) => a.score.total - b.score.total || a.id.localeCompare(b.id))[0];
      list = list.filter((l) => l !== victim);
    }
  }
  return list;
}
