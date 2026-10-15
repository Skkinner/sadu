# Sadu · AI, algorithms and simulation

Sadu keeps three technical layers strictly apart, and the UI labels each one:

| Layer | Badge | What it does | Where |
| --- | --- | --- | --- |
| **1 · Real AI** | ✦ AI-generated | Station stories, quiz questions, narrative bridges, personal summaries (Claude), neural narration (Azure AI Speech) | `src/server/ai/` |
| **2 · Explainable algorithms** | ⇄ Algorithmic | Station scoring, time-budget selection, route order, journey compression, quiz grading, missed-experience ranking | `src/lib/engine/` (no LLM anywhere) |
| **3 · Transparent simulation** | ⧗ Simulated | Stations and their coordinates, queue times, the visitor's position, the presenter clock | `src/data/stations.ts`, `src/config/queue-estimates.ts`, store actions |

All stations are **illustrative demo content**, not confirmed Expo 2030 pavilions. Nothing simulated is presented as
live Expo 2030 data.

---

## Layer 1 · Real AI

All model calls happen on the server (`src/server/ai/llm.ts`); keys never reach the browser.

| Service | File | Input | Output | Checks |
| --- | --- | --- | --- | --- |
| AIContentService | `content.ts` | station, depth, language, **cited source note** (`src/data/sources.ts`) | title, 1 / 2–3 / 4–5 sections with cited reference ids, 3 takeaways, essence | schema; section count per depth; word count (≈1–2 / 3–5 / 6–10 min of narration); every cited id must exist in the station's references; output language |
| QuizGenerationService | `quiz.ts` | station, depth, language, source note + the narration the visitor heard at that depth | question, 4 options, correct index, explanation, refs | schema; 4 distinct options; valid index; refs; language; **independent answerability check**: a second model call must pick the same answer from the notes and confirm only one option is correct |
| NarrativeBridgeService | `bridge.ts` | previous stop → next stop (actual route order), language | 1–2 sentence transition | ≤ 45 words, no numbers (no invented facts), language |
| PersonalizedSummaryService | `summary.ts` | built on the server from the account's stored journey: first name only, interests, time, completed stops + depths, shortened/skipped stops, quiz answers, ranked misses | recap, themes, highlights, understood, explore-next, closing | highlights may only name completed stations; suggestions only missed/shortened ones; language |
| TextToSpeechService | `tts.ts` | a story section or bridge, looked up on the server (never free text from the request) | audio (Saudi Arabic `ar-SA-*Neural`, English `en-US-*Neural`) | cached per provider + voice + text |

* **Model:** `claude-opus-5-5` (override with `SADU_LLM_MODEL`), structured outputs via JSON schema (`output_config.format`),
  `effort` low/medium per task, server-side refusal fallback (`fallbacks: "default"`).
* **Grounding:** prompts allow facts from the source note only; narrative framing is allowed, new claims are not.
* **Retries & timeouts:** SDK retries 429/5xx twice with backoff; 90 s timeout; invalid output is retried once with the
  validation problem, then the request falls back.
* **Caching:** generations are cached in SQLite (`ai_cache`) by station / depth / language / **source hash** / prompt
  version, so editing a source note regenerates its content. Fallbacks are never cached.
* **Fallbacks:** if a key is missing, the provider fails, or output fails validation, the app shows the station's
  pre-written copy, labelled "Pre-written fallback" with the reason. TTS failure → text-only reading mode (the device
  voice is offered, labelled "not neural").
* **Audit log:** every model / TTS call is recorded in `ai_calls` (kind, model, latency, tokens, error; no visitor data)
  and shown on **Inside Sadu** (`/en/lab`) so judges can see real calls happen.

## Layer 2 · Explainable personalization engine

Settings: `src/config/personalization.ts`. Tests: `tests/engine.test.ts` (`npm test`).

### Station score (StationScoringService · `scoring.ts`)

```
Score = 0.45 × Interest match + 0.20 × Cultural relevance + 0.15 × Experience preference
      + 0.10 × Variety (diversity bonus) + 0.10 × Accessibility          (every component 0–1)
```

| Component | Definition (measurable inputs in `src/data/stations.ts`) |
| --- | --- |
| Interest match | cosine similarity between the visitor's selected interests (0/1 vector) and the station's tag weights |
| Cultural relevance | 0.5 × heritage recognition (1 = on a UNESCO list per the cited source, 0.5 = national tradition, 0 = none) + 0.5 × Saudi connection (1 = Saudi heritage, 0.5 = explicitly linked in the story, 0 = none) |
| Experience preference | share of the visitor's preferred experience types (stories, things to see, hands-on, tasting, outdoors, live) the station offers; 0.5 when none chosen |
| Variety | share of the station's main themes (tags ≥ 0.6) not covered by stations already chosen (depends on selection order) |
| Accessibility | mean of four demo flags: step-free, seating, shade, quiet space |

Every stop shows its plain-language reasons ("you selected history and architecture · part of Saudi heritage") and the
full weighted breakdown. No confidence percentages are shown, because there are none.

### Time-budget optimization (JourneyOptimizerService · `optimizer.ts`)

1. Score all stations. Exclude stations that are not step-free when the visitor needs it, and weak matches
   (score < max(0.35, 0.6 × the best station's score)).
2. Every candidate starts at Glimpse.
3. Repeat: evaluate every feasible action (add a station at Glimpse, or upgrade a chosen one Glimpse → Standard → Deep
   Dive, up to the visitor's preferred depth) and take the best **marginal value ÷ extra minutes**.
   Value of a stop = score² × depth value (Glimpse 0.4, Standard 0.75, Deep 1); squaring favours depth at strong
   matches over breadth at weak ones. Upgrades must add ≥ 0.006 value per minute.
4. "Extra minutes" come from re-planning and re-timing the whole route (walk + simulated queue at the expected arrival
   time + experience), so an action is taken only if the journey still fits the budget.
5. The final route is re-optimized and re-timed; `restoreFeasibility` downgrades, then removes, the lowest-value choices
   if anything overshoots.

The journey page shows the breakdown: time at stations, walking, queues (simulated), delays, total vs budget, and the
assumptions (60 m/min ≈ 3.6 km/h, paths 30 % longer than straight lines, queue estimates for the time of day).

### Route (RouteOptimizationService · `route.ts`)

Nearest Neighbour from the visitor's (simulated) position, then **one complete 2-opt pass** on the open path (start
fixed). Only improving swaps are applied, so the result is never longer, a property the tests check over 300 random
instances. Both distances are shown ("Nearest Neighbour 725 m → after 2-opt 725 m"). Coordinates are an illustrative
layout in metres.

### Dynamic compression (JourneyCompressionService · `compression.ts`)

Triggered by the presenter clock (+10 / +20 min):

1. remaining budget = budget − simulated elapsed minutes;
2. completed stops and quiz results are never touched; a stop in progress is kept as it is;
3. while the remaining plan (re-routed from the visitor's position, re-timed) does not fit: downgrade upcoming Deep Dives
   to Standard (lowest value first), then Standard to Glimpse, then remove the lowest-value upcoming stops;
4. re-order the remaining stops (NN + 2-opt); bridges for the new consecutive pairs are fetched or generated;
5. if not even the stop in progress fits, the journey ends gracefully.

Each change is listed with its reason ("Hegra: Deep dive → Standard").

### Assessment (`assessment.ts`)

* Quiz: the question matches the depth the visitor actually completed; grading is `picked === correctIndex`
  (10 points per correct answer). No LLM scores anything.
* Missed experiences: rank = 0.5 × personalization score + 0.2 × cultural relevance + 0.2 × kind
  (skipped 1 · visited at a shorter depth 0.6 · never planned 0.4) + 0.1 × share of uncovered themes. "Skipped" and
  "visited as Glimpse/Standard" are labelled separately.

## Layer 3 · Simulation

| What | How it is simulated | Label |
| --- | --- | --- |
| Stations | 10 illustrative stations with cited cultural facts; not confirmed Expo pavilions | "Illustrative demo station" |
| Site layout | metre coordinates in `src/data/stations.ts` | "Illustrative site layout" |
| Queues | static minutes per station × time of day (`src/config/queue-estimates.ts`), used in planning | "Simulated" |
| Position | moved only by **Arrived** / **Done**; no GPS | "Position is simulated" |
| Clock | **Demo Simulation — Time Advancement**: +10 / +20 minutes, Reset; only a simulated clock moves, never system time | "Simulated" |

## Accounts and data

One account per normalized email (unique index). Plan, journey (stops, scores, depths, simulated clock, adjustments,
answers), journey history and the saved summary live in the account's `user_data`; summaries are also stored in
`journey_summaries`. Email-only entry does not prove ownership; only low-sensitivity demo data is stored. For production,
add passwordless email verification.
