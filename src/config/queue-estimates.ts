// SIMULATED queue estimates (minutes) by station and time of day. Expo 2030 has not happened, so there is no
// live operational data: these are static demo values, labelled "simulated estimate" wherever they appear.
// The planner reads them for every stop's expected arrival time, so editing them changes journey timings.
import type { PavilionId } from "../data/pavilions.ts";

export type QueueSlot = "morning" | "midday" | "afternoon" | "evening";

/** Slot boundaries in minutes since midnight: [start, end). */
export const QUEUE_SLOTS: { slot: QueueSlot; from: number; to: number }[] = [
  { slot: "morning", from: 0, to: 12 * 60 },
  { slot: "midday", from: 12 * 60, to: 15 * 60 },
  { slot: "afternoon", from: 15 * 60, to: 18 * 60 },
  { slot: "evening", from: 18 * 60, to: 24 * 60 },
];

export const QUEUE_ESTIMATES: Record<PavilionId, Record<QueueSlot, number>> = {
  saudi: { morning: 3, midday: 6, afternoon: 5, evening: 4 },
  japan: { morning: 5, midday: 8, afternoon: 6, evening: 4 },
  morocco: { morning: 2, midday: 4, afternoon: 3, evening: 2 },
  mexico: { morning: 4, midday: 7, afternoon: 6, evening: 5 },
  korea: { morning: 3, midday: 5, afternoon: 4, evening: 3 },
  coffee: { morning: 2, midday: 4, afternoon: 3, evening: 5 },
  diriyah: { morning: 1, midday: 3, afternoon: 2, evening: 2 },
  hegra: { morning: 4, midday: 6, afternoon: 5, evening: 3 },
  ahsa: { morning: 0, midday: 2, afternoon: 1, evening: 1 },
  ardah: { morning: 0, midday: 3, afternoon: 2, evening: 6 },
};

export function queueSlot(minuteOfDay: number): QueueSlot {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  return (QUEUE_SLOTS.find((s) => m >= s.from && m < s.to) ?? QUEUE_SLOTS[0]).slot;
}

export function queueMinutes(id: PavilionId, minuteOfDay: number) {
  return QUEUE_ESTIMATES[id][queueSlot(minuteOfDay)];
}
