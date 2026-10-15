// Shared types for the deterministic personalization engine. No LLM is involved anywhere in src/lib/engine.
import type { Depth, PavilionId } from "../../data/pavilions.ts";
import type { ExperienceType, Gate, Interest, Point } from "../../data/stations.ts";

export type VisitorPrefs = {
  /** total time the visitor has, in minutes */
  minutes: number;
  interests: Interest[];
  experiences: ExperienceType[];
  /** deepest level the visitor wants: stops are never planned deeper than this */
  maxDepth: Depth;
  stepFreeOnly: boolean;
  gate: Gate;
};

export type ScoreComponents = { interest: number; cultural: number; preference: number; diversity: number; accessibility: number };

/** Plain-language reasons, rendered by the UI in the visitor's language. */
export type Reason =
  | { code: "interests"; interests: Interest[] }
  | { code: "heritage" }
  | { code: "saudi" }
  | { code: "experiences"; experiences: ExperienceType[] }
  | { code: "newThemes"; interests: Interest[] }
  | { code: "accessible" };

export type StationScore = {
  id: PavilionId;
  /** weighted sum, 0–1 */
  total: number;
  components: ScoreComponents;
  /** components × weights, so the breakdown adds up to `total` */
  weighted: ScoreComponents;
  reasons: Reason[];
};

export type Exclusion = { id: PavilionId; why: "notStepFree" | "lowMatch" | "noTime" };

export type TimedStop = {
  id: PavilionId;
  depth: Depth;
  walkMin: number;
  /** simulated queue estimate at the expected arrival time */
  queueMin: number;
  experienceMin: number;
  /** minutes since midnight */
  arriveAt: number;
  leaveAt: number;
  distanceM: number;
};

export type Timeline = {
  stops: TimedStop[];
  totals: { experience: number; walking: number; queue: number; total: number; distanceM: number };
  end: Point;
};

export type RouteStats = {
  /** metres, Nearest Neighbour order */
  nearestNeighbourM: number;
  /** metres, after one full 2-opt pass (never longer than the Nearest Neighbour route) */
  optimizedM: number;
  improvedBy: number;
};

export type PlannedStop = TimedStop & { score: StationScore; plannedDepth: Depth };

export type JourneyPlan = {
  budget: number;
  stops: PlannedStop[];
  totals: Timeline["totals"];
  /** budget − total: unused minutes, kept as buffer */
  slack: number;
  route: RouteStats;
  excluded: Exclusion[];
  /** every station's score, best first: lets the UI and tests compare visitors */
  ranking: StationScore[];
};

export type { Depth, PavilionId, Interest, ExperienceType, Gate, Point };
