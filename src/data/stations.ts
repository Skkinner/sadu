// Planning metadata for every station: ILLUSTRATIVE DEMO DATA, not confirmed Expo 2030 attractions.
// Coordinates are an illustrative site layout in metres (x → east, y → south), not real venue positions.
// Everything here is an explicit, documented input to the personalization engine (src/lib/engine).
import type { PavilionId } from "./pavilions.ts";

export type Interest = "history" | "art" | "food" | "architecture" | "music" | "sustainability" | "technology" | "crafts";
export const INTERESTS: Interest[] = ["history", "art", "food", "architecture", "music", "sustainability", "technology", "crafts"];

export type ExperienceType = "stories" | "visual" | "handsOn" | "tasting" | "outdoor" | "live";
export const EXPERIENCE_TYPES: ExperienceType[] = ["stories", "visual", "handsOn", "tasting", "outdoor", "live"];

export type Gate = "north" | "south" | "east" | "west";
export type Point = { x: number; y: number };

export type StationMeta = {
  id: PavilionId;
  /** how strongly the station covers each interest (0–1); absent = 0 */
  tags: Partial<Record<Interest, number>>;
  experiences: ExperienceType[];
  /**
   * Editorial relevance inputs (documented criteria):
   *  heritage: 1 = on a UNESCO list per the station's cited sources · 0.5 = nationally recognised tradition · 0 = none
   *  saudi:    1 = Saudi heritage · 0.5 = tradition explicitly linked to a Saudi one in the story · 0 = no link
   */
  relevance: { heritage: 0 | 0.5 | 1; saudi: 0 | 0.5 | 1 };
  /** demo accessibility metadata (not live data) */
  access: { stepFree: boolean; seating: boolean; shade: boolean; quiet: boolean };
  position: Point;
};

export const GATE_POSITIONS: Record<Gate, Point> = {
  north: { x: 300, y: 0 },
  south: { x: 300, y: 800 },
  east: { x: 600, y: 400 },
  west: { x: 0, y: 400 },
};

export const STATIONS: Record<PavilionId, StationMeta> = {
  saudi: {
    id: "saudi",
    tags: { crafts: 1, art: 0.8, history: 0.7, sustainability: 0.3 },
    experiences: ["handsOn", "visual", "stories"],
    relevance: { heritage: 1, saudi: 1 },
    access: { stepFree: true, seating: true, shade: true, quiet: true },
    position: { x: 300, y: 140 },
  },
  japan: {
    id: "japan",
    tags: { food: 0.7, crafts: 0.5, art: 0.5, history: 0.4 },
    experiences: ["tasting", "stories"],
    relevance: { heritage: 0.5, saudi: 0.5 },
    access: { stepFree: true, seating: true, shade: true, quiet: true },
    position: { x: 470, y: 420 },
  },
  morocco: {
    id: "morocco",
    tags: { art: 1, crafts: 0.9, architecture: 0.8 },
    experiences: ["visual", "handsOn"],
    relevance: { heritage: 0.5, saudi: 0.5 },
    access: { stepFree: true, seating: false, shade: true, quiet: false },
    position: { x: 380, y: 560 },
  },
  mexico: {
    id: "mexico",
    tags: { food: 1, history: 0.6, sustainability: 0.4 },
    experiences: ["tasting", "stories"],
    relevance: { heritage: 1, saudi: 0 },
    access: { stepFree: true, seating: true, shade: true, quiet: false },
    position: { x: 200, y: 620 },
  },
  korea: {
    id: "korea",
    tags: { crafts: 0.9, art: 0.6, architecture: 0.6, sustainability: 0.5, technology: 0.4 },
    experiences: ["handsOn", "visual"],
    relevance: { heritage: 0.5, saudi: 0 },
    access: { stepFree: true, seating: false, shade: true, quiet: true },
    position: { x: 90, y: 520 },
  },
  coffee: {
    id: "coffee",
    tags: { food: 0.9, history: 0.6, crafts: 0.3 },
    experiences: ["tasting", "stories"],
    relevance: { heritage: 1, saudi: 1 },
    access: { stepFree: true, seating: true, shade: true, quiet: false },
    position: { x: 420, y: 120 },
  },
  diriyah: {
    id: "diriyah",
    tags: { architecture: 1, history: 1, sustainability: 0.6, technology: 0.5 },
    experiences: ["visual", "stories"],
    relevance: { heritage: 1, saudi: 1 },
    access: { stepFree: true, seating: false, shade: true, quiet: true },
    position: { x: 120, y: 200 },
  },
  hegra: {
    id: "hegra",
    tags: { history: 1, architecture: 0.8, art: 0.6 },
    experiences: ["visual", "stories"],
    relevance: { heritage: 1, saudi: 1 },
    access: { stepFree: true, seating: true, shade: true, quiet: true },
    position: { x: 180, y: 360 },
  },
  ahsa: {
    id: "ahsa",
    tags: { sustainability: 1, food: 0.6, history: 0.5, technology: 0.5 },
    experiences: ["outdoor", "tasting"],
    relevance: { heritage: 1, saudi: 1 },
    access: { stepFree: true, seating: true, shade: false, quiet: true },
    position: { x: 520, y: 230 },
  },
  ardah: {
    id: "ardah",
    tags: { music: 1, history: 0.7, art: 0.5 },
    experiences: ["live", "outdoor"],
    relevance: { heritage: 1, saudi: 1 },
    access: { stepFree: false, seating: true, shade: true, quiet: false },
    position: { x: 330, y: 330 },
  },
};
