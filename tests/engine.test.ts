// Tests for the deterministic personalization engine (Layer 2). Run: npm test
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PERSONALIZATION } from "../src/config/personalization.ts";
import { STATIONS, type Interest } from "../src/data/stations.ts";
import {
  compressJourney,
  nearestNeighbour,
  optimizeRoute,
  pathLength,
  planJourney,
  quizScore,
  rankMissed,
  scoreStation,
  twoOptPass,
  type JourneyStop,
  type VisitorPrefs,
} from "../src/lib/engine/index.ts";

const visitor = (p: Partial<VisitorPrefs> = {}): VisitorPrefs => ({
  minutes: 120,
  interests: ["history", "art", "food"],
  experiences: [],
  maxDepth: "deep",
  stepFreeOnly: false,
  gate: "north",
  ...p,
});

const ids = (prefs: VisitorPrefs) => planJourney(prefs).stops.map((s) => s.id);

/** Turns a plan into journey state, then simulates arriving at and finishing the first `done` stops. */
function journeyAfter(prefs: VisitorPrefs, done: number) {
  const plan = planJourney(prefs);
  let elapsed = 0;
  const stops: JourneyStop[] = plan.stops.map((s, i) => {
    if (i < done) elapsed += s.walkMin + s.queueMin + s.experienceMin;
    return { id: s.id, depth: s.depth, plannedDepth: s.depth, status: i < done ? "done" : "upcoming", score: s.score, walkMin: s.walkMin, queueMin: s.queueMin, experienceMin: s.experienceMin, arriveAt: s.arriveAt };
  });
  const position = done ? STATIONS[plan.stops[done - 1].id].position : { x: 300, y: 0 };
  return { plan, stops, elapsed, position };
}

describe("scoring", () => {
  it("weights sum to 1 and every component is normalised to 0–1", () => {
    const sum = Object.values(PERSONALIZATION.weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
    for (const id of Object.keys(STATIONS) as (keyof typeof STATIONS)[]) {
      const s = scoreStation(id, visitor({ experiences: ["visual", "tasting"] }), ["saudi"]);
      for (const v of Object.values(s.components)) assert.ok(v >= 0 && v <= 1, `${id} component ${v}`);
      const weighted = Object.values(s.weighted).reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(weighted - s.total) < 0.002, "breakdown adds up to the total");
      assert.ok(s.total >= 0 && s.total <= 1);
    }
  });

  it("is deterministic", () => {
    assert.deepEqual(planJourney(visitor()), planJourney(visitor()));
  });

  it("explains a recommendation with the visitor's own interests", () => {
    const s = scoreStation("diriyah", visitor({ interests: ["architecture", "history"] }));
    const r = s.reasons.find((x) => x.code === "interests");
    assert.ok(r && r.code === "interests" && r.interests.includes("architecture"));
  });
});

describe("Test A · different interests, same time budget", () => {
  it("recommends different stations", () => {
    const heritage = ids(visitor({ interests: ["history", "architecture"] }));
    const foodMusic = ids(visitor({ interests: ["food", "music"] }));
    const onlyOne = heritage.filter((x) => !foodMusic.includes(x)).length + foodMusic.filter((x) => !heritage.includes(x)).length;
    assert.ok(onlyOne >= 2, `plans should differ: ${heritage} vs ${foodMusic}`);
    assert.ok(heritage.includes("diriyah") && !foodMusic.includes("diriyah"));
    assert.ok(foodMusic.includes("mexico") && !heritage.includes("mexico"));
  });

  it("puts the strongest match first in the ranking", () => {
    assert.equal(planJourney(visitor({ interests: ["sustainability"] })).ranking[0].id, "ahsa");
    assert.equal(planJourney(visitor({ interests: ["music"] })).ranking[0].id, "ardah");
  });
});

describe("Test B · different time budgets", () => {
  it("gives a 30-minute visitor a shorter, feasible journey than a 120-minute one", () => {
    const short = planJourney(visitor({ minutes: 30 }));
    const long = planJourney(visitor({ minutes: 120 }));
    assert.ok(short.totals.total <= 30 && long.totals.total <= 120);
    assert.ok(short.totals.total < long.totals.total);
    assert.ok(short.stops.length < long.stops.length);
    assert.ok(short.stops.length >= 1);
  });

  it("never exceeds the budget, for any budget and profile", () => {
    const profiles: Interest[][] = [["history"], ["food", "music"], ["art", "crafts", "architecture"], ["sustainability", "technology"], []];
    for (const interests of profiles)
      for (let minutes = 0; minutes <= 300; minutes += 10)
        for (const gate of ["north", "south", "east", "west"] as const) {
          const plan = planJourney(visitor({ interests, minutes, gate }));
          assert.ok(plan.totals.total <= minutes, `${interests}/${minutes}/${gate}: ${plan.totals.total}`);
          const t = plan.totals;
          assert.equal(t.total, t.experience + t.walking + t.queue, "time breakdown adds up");
        }
  });

  it("respects step-free needs and the preferred depth", () => {
    const plan = planJourney(visitor({ interests: ["music", "history"], stepFreeOnly: true }));
    assert.ok(plan.stops.every((s) => STATIONS[s.id].access.stepFree));
    assert.ok(plan.excluded.some((e) => e.id === "ardah" && e.why === "notStepFree"));
    assert.ok(planJourney(visitor({ minutes: 240, maxDepth: "visit" })).stops.every((s) => s.depth !== "deep"));
  });
});

describe("Test C · dynamic compression", () => {
  it("+20 simulated minutes forces a replan that fits and keeps completed stops", () => {
    const prefs = visitor({ interests: ["history", "architecture"] });
    const j = journeyAfter(prefs, 1);
    const input = { stops: j.stops, budget: j.plan.budget, elapsed: j.elapsed + 20, position: j.position };
    const before = j.stops.filter((s) => s.status === "upcoming").reduce((sum, s) => sum + s.walkMin + s.queueMin + s.experienceMin, 0);
    assert.ok(before > input.budget - input.elapsed, "original remaining plan must be infeasible");

    const r = compressJourney(input);
    assert.ok(r.changes.length > 0);
    assert.ok(r.remainingPlan <= r.remainingBudget, `${r.remainingPlan} > ${r.remainingBudget}`);
    assert.equal(r.ended, false);
    const done = j.stops.filter((s) => s.status === "done");
    for (const d of done) assert.deepEqual(r.stops.find((s) => s.id === d.id), d, "completed stop untouched");
    // downgrades happen before removals: nothing is removed while an upcoming Deep Dive or Standard remains
    if (r.changes.some((c) => c.type === "removed")) assert.ok(r.stops.filter((s) => s.status === "upcoming").every((s) => s.depth === "glimpse"));
  });

  it("does nothing when the visitor is on time", () => {
    const j = journeyAfter(visitor(), 1);
    const r = compressJourney({ stops: j.stops, budget: j.plan.budget, elapsed: j.elapsed, position: j.position });
    assert.equal(r.changes.length, 0);
  });

  it("preserves the stop in progress and ends gracefully when nothing fits", () => {
    const j = journeyAfter(visitor(), 1);
    j.stops[1].status = "arrived";
    const r = compressJourney({ stops: j.stops, budget: j.plan.budget, elapsed: j.plan.budget + 30, position: j.position });
    assert.equal(r.ended, true);
    assert.equal(r.stops.find((s) => s.id === j.stops[1].id)?.status, "arrived");
    assert.ok(r.stops.filter((s) => s.status === "upcoming").length === 0);
    assert.equal(r.stops.filter((s) => s.status === "done").length, 1);
  });
});

describe("Test F · route optimization", () => {
  it("2-opt never returns a longer route than Nearest Neighbour", () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31) * 800;
    const pos = (p: { x: number; y: number }) => p;
    let improvedAtLeastOnce = false;
    for (let trial = 0; trial < 300; trial++) {
      const start = { x: rand(), y: rand() };
      const points = Array.from({ length: 3 + (trial % 9) }, () => ({ x: rand(), y: rand() }));
      const nn = nearestNeighbour(start, points, pos);
      const opt = twoOptPass(start, nn, pos);
      assert.ok(pathLength(start, opt, pos) <= pathLength(start, nn, pos) + 1e-9);
      assert.equal(opt.length, nn.length);
      const r = optimizeRoute(start, points, pos);
      assert.ok(r.stats.optimizedM <= r.stats.nearestNeighbourM);
      if (r.stats.improvedBy > 0) improvedAtLeastOnce = true;
    }
    assert.ok(improvedAtLeastOnce, "the 2-opt pass should improve some routes");
  });
});

describe("assessment", () => {
  it("scores quizzes deterministically", () => {
    assert.deepEqual(
      quizScore([
        { stationId: "saudi", depth: "visit", picked: 1, correctIndex: 1 },
        { stationId: "japan", depth: "glimpse", picked: 0, correctIndex: 2 },
      ]),
      { correct: 1, total: 2, points: 10 },
    );
  });

  it("keeps skipped stations distinct from ones visited at a shorter depth", () => {
    const missed = rankMissed(visitor(), [
      { id: "saudi", status: "done", depth: "glimpse" },
      { id: "coffee", status: "removed", depth: "visit" },
      { id: "diriyah", status: "done", depth: "deep" },
    ]);
    assert.equal(missed.find((m) => m.id === "saudi")?.kind, "shortened");
    assert.equal(missed.find((m) => m.id === "coffee")?.kind, "skipped");
    assert.equal(missed.find((m) => m.id === "diriyah"), undefined, "a full Deep Dive is not missed");
    assert.equal(missed.find((m) => m.id === "hegra")?.kind, "notPlanned");
  });
});
