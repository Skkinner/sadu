// RouteOptimizationService: Nearest Neighbour, then one complete 2-opt pass. Independent from any LLM.
// The path is open (starts at the visitor's position, ends at the last station) and the start never moves.
import { PERSONALIZATION } from "../../config/personalization.ts";
import type { Point } from "./types.ts";

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Walking minutes for a straight-line distance, using the documented speed and path-detour factor. */
export function walkMinutes(metres: number) {
  if (metres <= 0) return 0;
  return Math.max(1, Math.ceil((metres * PERSONALIZATION.pathFactor) / PERSONALIZATION.walkingMetresPerMinute));
}

export function pathLength<T>(start: Point, order: T[], pos: (t: T) => Point) {
  let total = 0;
  let prev = start;
  for (const item of order) {
    total += distance(prev, pos(item));
    prev = pos(item);
  }
  return total;
}

export function nearestNeighbour<T>(start: Point, items: T[], pos: (t: T) => Point): T[] {
  const left = [...items];
  const order: T[] = [];
  let here = start;
  while (left.length) {
    let best = 0;
    for (let i = 1; i < left.length; i++) if (distance(here, pos(left[i])) < distance(here, pos(left[best]))) best = i;
    const [next] = left.splice(best, 1);
    order.push(next);
    here = pos(next);
  }
  return order;
}

/**
 * One complete 2-opt pass over an open path: for every pair of edges, reverse the segment between them when
 * that makes the path shorter. Only improving moves are applied, so the result is never longer than the input.
 */
export function twoOptPass<T>(start: Point, order: T[], pos: (t: T) => Point): T[] {
  const path = [...order];
  const at = (i: number) => (i < 0 ? start : pos(path[i]));
  for (let i = 0; i < path.length - 1; i++) {
    for (let k = i + 1; k < path.length; k++) {
      const before = distance(at(i - 1), at(i)) + (k + 1 < path.length ? distance(at(k), at(k + 1)) : 0);
      const after = distance(at(i - 1), at(k)) + (k + 1 < path.length ? distance(at(i), at(k + 1)) : 0);
      if (after < before - 1e-9) {
        const segment = path.slice(i, k + 1).reverse();
        path.splice(i, segment.length, ...segment);
      }
    }
  }
  return path;
}

export function optimizeRoute<T>(start: Point, items: T[], pos: (t: T) => Point) {
  const initial = nearestNeighbour(start, items, pos);
  const improved = twoOptPass(start, initial, pos);
  const nearestNeighbourM = pathLength(start, initial, pos);
  const optimizedM = pathLength(start, improved, pos);
  // guard: keep the initial order if (floating point aside) the pass did not help
  const order = optimizedM <= nearestNeighbourM ? improved : initial;
  const finalM = Math.min(optimizedM, nearestNeighbourM);
  return {
    order,
    stats: { nearestNeighbourM: Math.round(nearestNeighbourM), optimizedM: Math.round(finalM), improvedBy: Math.round(nearestNeighbourM - finalM) },
  };
}
