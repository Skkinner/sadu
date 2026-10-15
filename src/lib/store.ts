"use client";

// Client store: who is using the app (session) plus their data (plan, journey progress, stamps, scores,
// saved items, preferences). The database is the source of truth: data is loaded from /api/session after
// entering name + email, and every change is saved back to /api/me/data (debounced). localStorage only
// caches display preferences so the theme applies before first paint.
// Server renders always use DEFAULT_STATE; the client switches to the real state after hydration.
import { useSyncExternalStore } from "react";
import { PERSONALIZATION } from "@/config/personalization";
import { DEPTHS, isStationId, type Depth, type PavilionId } from "@/data/pavilions";
import { GATE_POSITIONS as GATE, STATIONS, type ExperienceType, type Gate, type Interest, type Point } from "@/data/stations";
import type { Locale } from "@/i18n/config";
import type { SummaryResponse } from "@/lib/ai-types";
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "@/lib/constants";
import {
  compressJourney,
  planJourney,
  remainingMinutes,
  type Change,
  type Exclusion,
  type JourneyStop,
  type RouteStats,
  type VisitorPrefs,
} from "@/lib/engine";
import { normalizeEmail, type Profile, type ProfileErrors } from "@/lib/profile";

export type { Gate, Interest, ExperienceType };
export type Voice = "calm" | "lively";
export type TextSize = 1 | 2 | 3 | 4;

export type User = Profile & { id: string };

/** A quiz answer, graded deterministically (picked === correctIndex). Question text is kept for the summary. */
export type QuizAnswerRecord = {
  questionId: string;
  depth: Depth;
  question: string;
  options: string[];
  picked: number;
  correctIndex: number;
  origin: "ai" | "cache" | "fallback";
};

export type Adjustment = { at: number; delay: number; changes: Change[]; ended: boolean };

export type JourneyState = {
  id: string | null;
  status: "none" | "ready" | "active" | "complete";
  /** minutes the visitor had when the journey was planned */
  budget: number;
  /** ordered stops: done → in progress → upcoming (route order) → removed */
  stops: JourneyStop[];
  /** the plan as first generated, so "Reset simulation" can restore it */
  original: JourneyStop[];
  route: RouteStats | null;
  excluded: Exclusion[];
  /** SIMULATED clock: minutes since the journey started (never the real time) */
  clock: { elapsed: number; delay: number };
  /** SIMULATED visitor position (null = still at the gate); no GPS is used */
  position: Point | null;
  adjustments: Adjustment[];
  answers: Partial<Record<PavilionId, QuizAnswerRecord>>;
  /** passport: kept across journeys */
  stamps: Partial<Record<PavilionId, string>>;
  /** correct answers per station (0 or 1), kept across journeys */
  scores: Partial<Record<PavilionId, number>>;
  badgeAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  endReason: "finished" | "timeUp" | "ended" | null;
  summary: SummaryResponse | null;
};

export type JourneyRecord = {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  budget: number;
  stops: { id: PavilionId; depth: Depth; status: JourneyStop["status"] }[];
  correct: number;
  answered: number;
  recap: string | null;
};

/** Everything that belongs to one account. Stored per user in the database. */
export type UserData = {
  plan: {
    minutes: number;
    gate: Gate;
    interests: Interest[];
    experiences: ExperienceType[];
    stepFree: boolean;
    narrationLang: Locale | null; // null = follow site language
    voice: Voice;
    /** deepest level the visitor wants */
    depth: Depth;
  };
  journey: JourneyState;
  /** earlier journeys of this account (most recent first) */
  history: JourneyRecord[];
  saved: PavilionId[];
  nextVisit: string[];
  prefs: {
    theme: "light" | "dark";
    captions: boolean;
    readAloud: boolean;
    speed: number;
    contrast: boolean;
    reduceMotion: boolean;
    textSize: TextSize;
  };
};

export type State = UserData & {
  v: 2;
  /** "loading" until the session check returns */
  auth: "loading" | "none" | "user";
  user: User | null;
};

const EMPTY_JOURNEY: JourneyState = {
  id: null,
  status: "none",
  budget: 0,
  stops: [],
  original: [],
  route: null,
  excluded: [],
  clock: { elapsed: 0, delay: 0 },
  position: null,
  adjustments: [],
  answers: {},
  stamps: {},
  scores: {},
  badgeAt: null,
  startedAt: null,
  endedAt: null,
  endReason: null,
  summary: null,
};

const DEFAULT_DATA: UserData = {
  plan: { minutes: 120, gate: "north", interests: ["history", "art", "food"], experiences: [], stepFree: false, narrationLang: null, voice: "calm", depth: "deep" },
  journey: EMPTY_JOURNEY,
  history: [],
  saved: [],
  nextVisit: [],
  prefs: { theme: "light", captions: true, readAloud: false, speed: 1, contrast: false, reduceMotion: false, textSize: 2 },
};

export const DEFAULT_STATE: State = { ...DEFAULT_DATA, v: 2, auth: "loading", user: null };

const validStop = (s: Partial<JourneyStop> | null | undefined): s is JourneyStop =>
  !!s && isStationId(s.id) && DEPTHS.includes(s.depth as Depth) && !!s.score && typeof s.status === "string";

/** Fills in anything missing from stored data (older or partial documents). */
function withDefaults(parsed: Partial<UserData> | null | undefined): UserData {
  const p = parsed ?? {};
  const j = (p.journey ?? {}) as Partial<JourneyState>;
  // journeys saved before the planner existed have no stops: keep the passport, start a fresh plan
  const planned = Array.isArray(j.stops) && j.stops.every(validStop);
  const journey: JourneyState = planned
    ? { ...EMPTY_JOURNEY, ...j, clock: { ...EMPTY_JOURNEY.clock, ...j.clock }, original: Array.isArray(j.original) ? j.original.filter(validStop) : [] }
    : { ...EMPTY_JOURNEY, stamps: j.stamps ?? {}, scores: j.scores ?? {}, badgeAt: j.badgeAt ?? null };
  return {
    plan: { ...DEFAULT_DATA.plan, ...p.plan, experiences: Array.isArray(p.plan?.experiences) ? p.plan.experiences : [] },
    journey,
    history: Array.isArray(p.history) ? p.history : [],
    saved: Array.isArray(p.saved) ? p.saved : [],
    nextVisit: Array.isArray(p.nextVisit) ? p.nextVisit : [],
    prefs: { ...DEFAULT_DATA.prefs, ...p.prefs },
  };
}

function dataOf(s: State): UserData {
  return { plan: s.plan, journey: s.journey, history: s.history, saved: s.saved, nextVisit: s.nextVisit, prefs: s.prefs };
}

/** Data for someone starting from scratch on this device (follows the system theme). */
function freshData(): UserData {
  const dark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return { ...DEFAULT_DATA, prefs: { ...DEFAULT_DATA.prefs, theme: dark ? "dark" : "light" } };
}

let state: State = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const fresh = freshData();
  let prefs = fresh.prefs;
  try {
    // display prefs only; user data arrives with the session
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) prefs = withDefaults({ prefs: (JSON.parse(raw) as Partial<UserData>).prefs } as Partial<UserData>).prefs;
  } catch {
    /* storage unavailable: keep defaults */
  }
  state = { ...state, ...fresh, prefs };
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ prefs: state.prefs }));
  } catch {
    /* ignore */
  }
}

export function getState() {
  load();
  return state;
}

export function setState(updater: (s: State) => State) {
  load();
  const prev = state;
  state = updater(state);
  persist();
  if (state.auth === "user" && state.user?.id === prev.user?.id && changedData(prev, state)) scheduleSave();
  listeners.forEach((l) => l());
}

function changedData(a: State, b: State) {
  return a.plan !== b.plan || a.journey !== b.journey || a.history !== b.history || a.saved !== b.saved || a.nextVisit !== b.nextVisit || a.prefs !== b.prefs;
}

/** Session transitions: replace state without queuing a save of the outgoing user's data. */
function replaceState(next: State) {
  load();
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(DEFAULT_STATE),
  );
}

const noopSubscribe = () => () => {};
/** true once the client has hydrated (persisted state is available). */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// ---------------------------------------------------------------- sync with the database
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<void> | null = null;
let dirty = false;
let legacyPending = false;

function scheduleSave(delay = 400) {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flush(), delay);
}

/** Saves pending changes now. `keepalive` lets the request finish while the page unloads. */
export async function flush(keepalive = false) {
  clearTimeout(saveTimer);
  if (inFlight) await inFlight;
  if (!dirty || state.auth !== "user" || !state.user) return;
  dirty = false;
  const userId = state.user.id;
  inFlight = fetch("/api/me/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, data: dataOf(state) }),
    keepalive,
  })
    .then((res) => {
      if (res.ok) {
        if (legacyPending) {
          legacyPending = false;
          try {
            window.localStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {}
        }
      } else if (res.status === 401 || res.status === 409) {
        // signed out, or another tab switched user: reload whoever this browser is now signed in as
        void session.bootstrap();
      } else scheduleSave(5000);
    })
    .catch(() => scheduleSave(5000))
    .finally(() => {
      inFlight = null;
    });
  await inFlight;
}

/** Progress saved in the browser before accounts moved to the database, if it belongs to this email. */
function legacyDataFor(email: string): UserData | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<UserData> & { user?: { email?: string } }) : null;
    if (!parsed?.user?.email || normalizeEmail(parsed.user.email) !== normalizeEmail(email)) return null;
    return withDefaults(parsed);
  } catch {
    return null;
  }
}

function signIn(user: User, stored: unknown) {
  const switching = !!state.user && state.user.id !== user.id;
  if (switching) dirty = false; // unsaved edits belonged to the previous user
  let data: UserData;
  if (stored) data = withDefaults(stored as Partial<UserData>);
  else {
    // new account (or one that never saved): start from this device's legacy progress for the same email,
    // otherwise from what was picked before entering (time, theme), never from another user's data
    const legacy = legacyDataFor(user.email);
    legacyPending = !!legacy;
    data = legacy ?? (switching ? freshData() : dataOf(state));
  }
  replaceState({ ...state, ...data, auth: "user", user });
  if (!stored) scheduleSave(0);
}

function signOutLocal() {
  dirty = false;
  clearTimeout(saveTimer);
  // clear a previous user's data from memory; an anonymous visitor keeps their device prefs
  replaceState(state.user ? { ...state, ...freshData(), auth: "none", user: null } : { ...state, auth: "none" });
}

/** Tells other tabs of this browser that the signed-in user changed. */
function announce() {
  try {
    window.localStorage.setItem("sadu-session", String(Date.now()));
  } catch {}
}

type EnterResult = { ok: true; created: boolean; user: User } | { ok: false; error: "invalid" | "rate_limited" | "network"; fields?: ProfileErrors };
type ProfileResult = { ok: true } | { ok: false; error: "invalid" | "email_taken" | "network"; fields?: ProfileErrors };

export const session = {
  /** Asks the server who this browser is signed in as and loads that user's data. */
  async bootstrap() {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const body = res.ok ? ((await res.json()) as { user: User | null; data: unknown }) : null;
      if (!body?.user) return signOutLocal();
      if (state.user?.id === body.user.id && state.auth === "user") {
        // same user: refresh the profile, keep local edits that are still waiting to be saved
        if (!dirty && !inFlight) replaceState({ ...state, ...withDefaults(body.data as Partial<UserData>), user: body.user });
        return;
      }
      signIn(body.user, body.data);
    } catch {
      if (state.auth === "loading") signOutLocal();
    }
  },

  /** Entry form: finds the account for this email or creates it, then loads its data. */
  async enter(profile: Profile): Promise<EnterResult> {
    await flush();
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const body = await res.json();
      if (!res.ok) return { ok: false, error: res.status === 429 ? "rate_limited" : "invalid", fields: body.fields };
      signIn(body.user, body.data);
      announce();
      return { ok: true, created: body.created, user: body.user };
    } catch {
      return { ok: false, error: "network" };
    }
  },

  /** "Switch user": saves, ends the session on this browser and clears the previous user's data from memory. */
  async switchUser() {
    await flush();
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {}
    signOutLocal();
    announce();
  },

  async updateProfile(profile: Profile): Promise<ProfileResult> {
    if (!state.user) return { ok: false, error: "network" };
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, userId: state.user.id }),
      });
      const body = await res.json();
      if (res.status === 409 && body.error === "user_mismatch") {
        void session.bootstrap();
        return { ok: false, error: "network" };
      }
      if (!res.ok) return { ok: false, error: body.error === "email_taken" ? "email_taken" : "invalid", fields: body.fields };
      replaceState({ ...state, user: body.user });
      return { ok: true };
    } catch {
      return { ok: false, error: "network" };
    }
  },
};

export function fullName(user: Pick<User, "firstName" | "lastName"> | null | undefined) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : "";
}

// ---------------------------------------------------------------- derived
export function stampCount(s: State) {
  return Object.keys(s.journey.stamps).length;
}

export function points(s: State) {
  const quiz = Object.values(s.journey.scores).reduce((a, b) => a + (b ?? 0), 0) * 10;
  return quiz + (s.journey.badgeAt ? 100 : 0);
}

export function level(pts: number) {
  if (pts >= 200) return { n: 3, index: 2, floor: 200, next: 300 };
  if (pts >= 100) return { n: 2, index: 1, floor: 100, next: 200 };
  return { n: 1, index: 0, floor: 0, next: 100 };
}

export function correctAnswers(s: State) {
  return Object.values(s.journey.answers).filter((a) => a && a.picked === a.correctIndex).length;
}

/** Caches a derived value per state object, so selectors that build arrays/objects keep a stable identity. */
function derived<T>(compute: (s: State) => T) {
  const cache = new WeakMap<State, T>();
  return (s: State): T => {
    if (!cache.has(s)) cache.set(s, compute(s));
    return cache.get(s)!;
  };
}

/** Stops still part of the journey (not removed by replanning). */
export const activeStops = derived((s) => s.journey.stops.filter((x) => x.status !== "removed"));

/** The stop in progress, or the next one to visit. */
export function currentStop(s: State) {
  return s.journey.stops.find((x) => x.status === "arrived") ?? s.journey.stops.find((x) => x.status === "upcoming") ?? null;
}

/** Planned total for the journey as it stands (walking + simulated queues + experiences). */
export function journeyMinutes(s: State) {
  return activeStops(s).reduce((t, x) => t + x.walkMin + x.queueMin + x.experienceMin, 0);
}

export const visitorPrefs = (plan: UserData["plan"]): VisitorPrefs => ({
  minutes: plan.minutes,
  interests: plan.interests,
  experiences: plan.experiences,
  maxDepth: plan.depth,
  stepFreeOnly: plan.stepFree,
  gate: plan.gate,
});

/** SIMULATED time of day (minutes since midnight) on the presenter clock. */
export const simulatedNow = (s: State) => PERSONALIZATION.demoStartMinute + s.journey.clock.elapsed;

function positionOf(j: JourneyState, gate: Gate): Point {
  return j.position ?? { ...GATE[gate] };
}

/** Minutes still needed to finish the plan from where the visitor is now. */
export function remainingPlanMinutes(s: State) {
  const j = s.journey;
  const upcoming = j.stops.filter((x) => x.status === "upcoming").map(({ id, depth }) => ({ id, depth }));
  return remainingMinutes({ stops: j.stops, budget: j.budget, elapsed: j.clock.elapsed, position: positionOf(j, s.plan.gate) }, upcoming).total;
}

const uuid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function archive(s: State): JourneyRecord[] {
  const j = s.journey;
  if (!j.id || !j.stops.some((x) => x.status === "done")) return s.history;
  const answers = Object.values(j.answers).filter(Boolean) as QuizAnswerRecord[];
  const record: JourneyRecord = {
    id: j.id,
    startedAt: j.startedAt,
    endedAt: j.endedAt ?? new Date().toISOString(),
    budget: j.budget,
    stops: j.stops.map(({ id, depth, status }) => ({ id, depth, status })),
    correct: answers.filter((a) => a.picked === a.correctIndex).length,
    answered: answers.length,
    recap: j.summary?.data.recap ?? null,
  };
  return [record, ...s.history.filter((h) => h.id !== j.id)].slice(0, 10);
}

/** Re-times the upcoming stops (route re-optimized from the visitor's position) without changing depths. */
function retime(j: JourneyState, gate: Gate): JourneyState {
  const result = compressJourney({ stops: j.stops, budget: Number.MAX_SAFE_INTEGER, elapsed: j.clock.elapsed, position: positionOf(j, gate) });
  return { ...j, stops: result.stops, route: result.route ?? j.route };
}

function finish(j: JourneyState, reason: JourneyState["endReason"]): JourneyState {
  const allDone = j.stops.filter((x) => x.status !== "removed").every((x) => x.status === "done");
  return {
    ...j,
    status: "complete",
    endedAt: j.endedAt ?? new Date().toISOString(),
    endReason: j.endReason ?? reason,
    badgeAt: allDone && j.stops.some((x) => x.status === "done") ? (j.badgeAt ?? new Date().toISOString()) : j.badgeAt,
  };
}

export type AdvanceResult = { changes: Change[]; ended: boolean; remainingBudget: number; remainingPlan: number };

// ---------------------------------------------------------------- actions
export const actions = {
  setPlan(patch: Partial<State["plan"]>) {
    setState((s) => ({ ...s, plan: { ...s.plan, ...patch } }));
  },
  toggleInterest(i: Interest) {
    setState((s) => {
      const has = s.plan.interests.includes(i);
      return { ...s, plan: { ...s.plan, interests: has ? s.plan.interests.filter((x) => x !== i) : [...s.plan.interests, i] } };
    });
  },
  toggleExperience(e: ExperienceType) {
    setState((s) => {
      const has = s.plan.experiences.includes(e);
      return { ...s, plan: { ...s.plan, experiences: has ? s.plan.experiences.filter((x) => x !== e) : [...s.plan.experiences, e] } };
    });
  },

  /** Runs the personalization engine (scoring → greedy time-budget selection → NN + 2-opt route). */
  buildJourney() {
    setState((s) => {
      const plan = planJourney(visitorPrefs(s.plan));
      const stops: JourneyStop[] = plan.stops.map((p) => ({
        id: p.id,
        depth: p.depth,
        plannedDepth: p.plannedDepth,
        status: "upcoming",
        score: p.score,
        walkMin: p.walkMin,
        queueMin: p.queueMin,
        experienceMin: p.experienceMin,
        arriveAt: p.arriveAt,
      }));
      const j = s.journey;
      return {
        ...s,
        history: archive(s),
        journey: {
          ...EMPTY_JOURNEY,
          id: uuid(),
          status: stops.length ? "ready" : "none",
          budget: plan.budget,
          stops,
          original: stops,
          route: plan.route,
          excluded: plan.excluded,
          stamps: j.stamps,
          scores: j.scores,
          badgeAt: j.badgeAt,
        },
      };
    });
  },
  startJourney() {
    setState((s) =>
      s.journey.status === "ready" ? { ...s, journey: { ...s.journey, status: "active", startedAt: s.journey.startedAt ?? new Date().toISOString() } } : s,
    );
  },

  /** SIMULATED movement: the visitor taps "Arrived". Advances the simulated clock by the planned walk + queue. */
  arrive(id: PavilionId) {
    setState((s) => {
      const j = s.journey;
      const stop = j.stops.find((x) => x.id === id);
      if (!stop || stop.status !== "upcoming") return s;
      const stops = j.stops.map((x) => (x.status === "arrived" ? { ...x, status: "done" as const } : x.id === id ? { ...x, status: "arrived" as const } : x));
      const journey: JourneyState = {
        ...j,
        status: "active",
        startedAt: j.startedAt ?? new Date().toISOString(),
        stops,
        clock: { ...j.clock, elapsed: j.clock.elapsed + stop.walkMin + stop.queueMin },
        position: { ...STATIONS[id].position },
      };
      return { ...s, journey: retime(journey, s.plan.gate) };
    });
  },
  /** SIMULATED: the visitor taps "Done". Completes the stop at its current depth and stamps the passport. */
  complete(id: PavilionId) {
    setState((s) => {
      const j = s.journey;
      const stop = j.stops.find((x) => x.id === id);
      if (!stop || (stop.status !== "arrived" && stop.status !== "upcoming")) return s;
      const extra = stop.status === "upcoming" ? stop.walkMin + stop.queueMin : 0;
      let journey: JourneyState = {
        ...j,
        status: "active",
        startedAt: j.startedAt ?? new Date().toISOString(),
        stops: j.stops.map((x) => (x.id === id ? { ...x, status: "done" as const } : x)),
        clock: { ...j.clock, elapsed: j.clock.elapsed + extra + stop.experienceMin },
        position: { ...STATIONS[id].position },
        stamps: { ...j.stamps, [id]: j.stamps[id] ?? new Date().toISOString() },
      };
      journey = retime(journey, s.plan.gate);
      if (!journey.stops.some((x) => x.status === "upcoming" || x.status === "arrived")) journey = finish(journey, "finished");
      return { ...s, journey };
    });
  },
  /** Manual depth change for a stop that has not started; the remaining route is re-timed. */
  setDepth(id: PavilionId, depth: Depth) {
    setState((s) => {
      const j = s.journey;
      const stop = j.stops.find((x) => x.id === id);
      if (!stop || stop.status !== "upcoming") return s;
      const stops = j.stops.map((x) => (x.id === id ? { ...x, depth, plannedDepth: depth, change: undefined } : x));
      return { ...s, journey: retime({ ...j, stops }, s.plan.gate) };
    });
  },

  /**
   * DEMO SIMULATION: the presenter advances the simulated clock (+10 / +20 min). The real compression algorithm
   * then downgrades or removes upcoming stops until the rest of the journey fits the remaining time.
   */
  advanceClock(minutes: number): AdvanceResult {
    let out: AdvanceResult = { changes: [], ended: false, remainingBudget: 0, remainingPlan: 0 };
    setState((s) => {
      const j = s.journey;
      if (j.status === "none" || j.status === "complete") return s;
      const clock = { elapsed: j.clock.elapsed + minutes, delay: j.clock.delay + minutes };
      const r = compressJourney({ stops: j.stops, budget: j.budget, elapsed: clock.elapsed, position: positionOf(j, s.plan.gate) });
      out = { changes: r.changes, ended: r.ended, remainingBudget: r.remainingBudget, remainingPlan: r.remainingPlan };
      let journey: JourneyState = {
        ...j,
        status: j.status === "ready" ? "active" : j.status,
        startedAt: j.startedAt ?? new Date().toISOString(),
        clock,
        stops: r.stops,
        route: r.route ?? j.route,
        adjustments: r.changes.length || r.ended ? [...j.adjustments, { at: clock.elapsed, delay: minutes, changes: r.changes, ended: r.ended }] : j.adjustments,
      };
      if (r.ended) journey = finish(journey, "timeUp");
      return { ...s, journey };
    });
    return out;
  },
  /** DEMO SIMULATION: back to the plan as generated (clock 0, nothing visited, stamps from this run kept). */
  resetSimulation() {
    setState((s) => {
      const j = s.journey;
      if (!j.original.length) return s;
      return {
        ...s,
        journey: {
          ...j,
          status: "ready",
          stops: j.original,
          clock: { elapsed: 0, delay: 0 },
          position: null,
          adjustments: [],
          answers: {},
          startedAt: null,
          endedAt: null,
          endReason: null,
          summary: null,
        },
      };
    });
  },

  /** Records a quiz answer; correctness is computed here, deterministically. */
  answerQuiz(id: PavilionId, answer: QuizAnswerRecord) {
    setState((s) => ({
      ...s,
      journey: {
        ...s.journey,
        answers: { ...s.journey.answers, [id]: answer },
        scores: { ...s.journey.scores, [id]: answer.picked === answer.correctIndex ? 1 : 0 },
      },
    }));
  },
  endJourney() {
    setState((s) => (s.journey.status === "none" ? s : { ...s, journey: finish(s.journey, "ended") }));
  },
  saveSummary(summary: SummaryResponse) {
    setState((s) => (s.journey.id === summary.journeyId ? { ...s, journey: { ...s.journey, summary } } : s));
  },
  resetJourney() {
    setState((s) => ({ ...s, history: archive(s), journey: { ...EMPTY_JOURNEY, stamps: s.journey.stamps, scores: s.journey.scores, badgeAt: s.journey.badgeAt } }));
  },
  toggleSaved(id: PavilionId) {
    setState((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] }));
  },
  addNextVisit(key: string) {
    setState((s) => ({ ...s, nextVisit: s.nextVisit.includes(key) ? s.nextVisit : [...s.nextVisit, key] }));
  },
  setPrefs(patch: Partial<State["prefs"]>) {
    setState((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }));
  },
};

/** Remaining time on the simulated clock versus what the plan still needs. */
export const journeyMetrics = derived((s) => {
  const j = s.journey;
  const remainingBudget = j.budget - j.clock.elapsed;
  const remainingPlan = j.status === "none" ? 0 : remainingPlanMinutes(s);
  return { remainingBudget, remainingPlan, behind: remainingPlan > remainingBudget, now: simulatedNow(s) };
});
