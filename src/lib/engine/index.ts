// Layer 2 · Algorithmic personalization. Pure, deterministic TypeScript: runs in the browser for instant
// replanning and in Node for tests (`npm test`). Nothing here calls an LLM.
export * from "./types.ts";
export { rankStations, scoreStation, interestMatch, culturalRelevance, preferenceMatch, diversityBonus, accessibilityScore, mainThemes } from "./scoring.ts";
export { distance, walkMinutes, nearestNeighbour, twoOptPass, optimizeRoute, pathLength } from "./route.ts";
export { planJourney, planRoute, timeline, restoreFeasibility } from "./optimizer.ts";
export { compressJourney, remainingMinutes, type JourneyStop, type StopStatus, type Change, type CompressionResult } from "./compression.ts";
export { quizScore, isCorrect, quizDepthFor, rankMissed, type QuizAnswer, type MissedItem, type MissedKind } from "./assessment.ts";
