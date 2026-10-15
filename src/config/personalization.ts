// Personalization engine settings. Every number the planner uses lives here, so it can be tuned without
// touching the algorithm (src/lib/engine). Documentation for each factor: docs/AI-AND-ALGORITHMS.md.
import type { Depth } from "../data/pavilions.ts";

export const PERSONALIZATION = {
  /**
   * Score = Σ weight × component, every component normalised to 0–1. Weights must sum to 1.
   *  interest      cosine similarity between the visitor's interests and the station's tag weights
   *  cultural      editorial relevance: 0.5 × heritage recognition + 0.5 × Saudi connection
   *  preference    share of the visitor's preferred experience types the station offers
   *  diversity     share of the station's main themes not yet covered by stations already chosen
   *  accessibility demo accessibility metadata: step-free, seating, shade, quiet space
   */
  weights: { interest: 0.45, cultural: 0.2, preference: 0.15, diversity: 0.1, accessibility: 0.1 },

  /** Value of each depth relative to a full Deep Dive (diminishing returns per extra minute). */
  depthValue: { glimpse: 0.4, visit: 0.75, deep: 1 } satisfies Record<Depth, number>,

  /** A station must reach this score to be considered at all ("not a strong match" otherwise)… */
  minScore: 0.35,
  /** …and at least this share of the visitor's best station score, so weak matches don't fill the day. */
  relativeMinScore: 0.6,
  /**
   * Value of a stop = score^valueExponent × depthValue. Squaring makes the optimizer prefer depth at strong
   * matches over breadth at weak ones: a 0.8 station is worth 2.8× a 0.48 one instead of 1.7×.
   */
  valueExponent: 2,
  /** Upgrades (Glimpse → Standard → Deep Dive) must add at least this much value per extra minute. */
  minUpgradeValuePerMinute: 0.006,
  /** Tag weight from which a tag counts as one of a station's main themes (diversity, explanations). */
  mainThemeThreshold: 0.6,

  /** Walking model. 60 m/min ≈ 3.6 km/h, a relaxed pace in a crowded venue; paths are ~30% longer than straight lines. */
  walkingMetresPerMinute: 60,
  pathFactor: 1.3,

  /** Simulated start of the visit (minutes since midnight): 10:30. Drives which queue estimate applies. */
  demoStartMinute: 10 * 60 + 30,
} as const;

export type Weights = typeof PERSONALIZATION.weights;
