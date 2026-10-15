// JourneyCompressionService: adaptive replanning when the visitor falls behind (simulated clock).
//
// 1. remaining budget = budget − elapsed simulated minutes
// 2. completed stops are never touched; a stop already in progress (arrived) is kept as it is
// 3. if the remaining plan (current stop + upcoming stops, re-routed and re-timed) does not fit:
//    a. downgrade upcoming Deep Dives to Standard, lowest-value first, re-checking after each change
//    b. then downgrade Standard to Glimpse the same way
//    c. then remove the lowest-value upcoming stops until the plan fits
// 4. the remaining stops are re-ordered with Nearest Neighbour + 2-opt from the visitor's position
// 5. if not even the current stop fits, the journey ends gracefully (no impossible plan is shown)
import { PERSONALIZATION } from "../../config/personalization.ts";
import { DEPTH_MINUTES, DEPTHS } from "../../data/pavilions.ts";
import { STATIONS } from "../../data/stations.ts";
import { planRoute, stopValue } from "./optimizer.ts";
import type { Depth, PavilionId, Point, RouteStats, StationScore } from "./types.ts";

export type StopStatus = "upcoming" | "arrived" | "done" | "removed";

export type JourneyStop = {
  id: PavilionId;
  depth: Depth;
  plannedDepth: Depth;
  status: StopStatus;
  score: StationScore;
  walkMin: number;
  queueMin: number;
  experienceMin: number;
  arriveAt: number;
  /** latest automatic change, with its reason */
  change?: { type: "downgraded"; from: Depth; to: Depth } | { type: "removed"; from: Depth };
};

export type Change = { id: PavilionId; type: "downgraded"; from: Depth; to: Depth } | { id: PavilionId; type: "removed"; from: Depth };

export type CompressionInput = {
  stops: JourneyStop[];
  budget: number;
  /** simulated minutes since the journey started */
  elapsed: number;
  /** where the visitor is now (gate, or the last station reached) */
  position: Point;
  startMinute?: number;
};

export type CompressionResult = {
  stops: JourneyStop[];
  changes: Change[];
  remainingBudget: number;
  /** minutes still needed to finish the (possibly compressed) plan */
  remainingPlan: number;
  /** true when even the stop in progress no longer fits: the journey should end */
  ended: boolean;
  route: RouteStats | null;
};

const value = (s: { score: StationScore; depth: Depth }) => stopValue(s.score, s.depth);

/** Minutes still needed: the rest of the stop in progress, then the upcoming stops re-routed from there. */
export function remainingMinutes(input: CompressionInput, upcoming: { id: PavilionId; depth: Depth }[]) {
  const startMinute = (input.startMinute ?? PERSONALIZATION.demoStartMinute) + input.elapsed;
  const current = input.stops.find((s) => s.status === "arrived");
  const currentLeft = current ? current.queueMin + DEPTH_MINUTES[current.depth] : 0;
  const from = current ? STATIONS[current.id].position : input.position;
  const { timeline, stats } = planRoute(from, startMinute + currentLeft, upcoming);
  return { total: currentLeft + timeline.totals.total, timeline, stats, currentLeft };
}

export function compressJourney(input: CompressionInput): CompressionResult {
  const remainingBudget = input.budget - input.elapsed;
  const stops = input.stops.map((s) => ({ ...s }));
  const upcoming = () => stops.filter((s) => s.status === "upcoming");
  const legs = () => upcoming().map(({ id, depth }) => ({ id, depth }));
  const changes: Change[] = [];

  let plan = remainingMinutes(input, legs());
  for (const [from, to] of [["deep", "visit"], ["visit", "glimpse"]] as [Depth, Depth][]) {
    while (plan.total > remainingBudget) {
      const victim = upcoming()
        .filter((s) => s.depth === from)
        .sort((a, b) => value(a) - value(b) || a.id.localeCompare(b.id))[0];
      if (!victim) break;
      victim.depth = to;
      victim.change = { type: "downgraded", from: victim.change?.type === "downgraded" ? victim.change.from : from, to };
      const prev = changes.find((c) => c.id === victim.id);
      if (prev && prev.type === "downgraded") prev.to = to;
      else changes.push({ id: victim.id, type: "downgraded", from, to });
      plan = remainingMinutes(input, legs());
    }
  }
  while (plan.total > remainingBudget && upcoming().length) {
    const victim = upcoming().sort((a, b) => value(a) - value(b) || a.id.localeCompare(b.id))[0];
    const original = victim.change?.type === "downgraded" ? victim.change.from : victim.depth;
    victim.status = "removed";
    victim.change = { type: "removed", from: original };
    const i = changes.findIndex((c) => c.id === victim.id);
    if (i >= 0) changes.splice(i, 1);
    changes.push({ id: victim.id, type: "removed", from: original });
    plan = remainingMinutes(input, legs());
  }

  const ended = plan.total > remainingBudget;
  // re-order: finished stops, stop in progress, then upcoming in optimized order, removed ones last
  const ordered = [
    ...stops.filter((s) => s.status === "done"),
    ...stops.filter((s) => s.status === "arrived"),
    ...plan.timeline.stops.map((t) => {
      const s = stops.find((x) => x.id === t.id)!;
      return { ...s, walkMin: t.walkMin, queueMin: t.queueMin, experienceMin: t.experienceMin, arriveAt: t.arriveAt };
    }),
    ...stops.filter((s) => s.status === "removed"),
  ];
  return {
    stops: ordered,
    changes,
    remainingBudget,
    remainingPlan: plan.total,
    ended,
    route: upcoming().length ? plan.stats : null,
  };
}

export { DEPTHS };
