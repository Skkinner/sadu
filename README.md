# Sadu · سدو

A bilingual (Arabic RTL / English LTR), responsive website built from the Figma file
**سدو-sadu** (`qVWONXe3MqwBOLBk3ddFBD`): a cultural journey planner for Expo 2030 Riyadh.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn-style UI primitives on Radix.

```bash
npm install                 # Node 24+
cp .env.example .env.local  # add ANTHROPIC_API_KEY and AZURE_SPEECH_KEY / AZURE_SPEECH_REGION
netlify dev                 # http://localhost:8888 → redirects to /ar (next dev + a local Netlify Database)
netlify database migrations apply   # first run and after adding a migration: creates the tables locally
npm test                    # personalization engine tests (Node's test runner)
npm run build && npm start
npm run lint
```

Without keys the app still runs end to end: generated content falls back to clearly labelled pre-written copy and
narration switches to text-only reading. **Inside Sadu** (`/en/lab`) shows which integrations are configured.

**Database**: Netlify Database (managed Postgres, `@netlify/database`). Netlify provisions it and applies the
migrations in `netlify/database/migrations/` on deploy. Locally, use the Netlify CLI (`npm i -g netlify-cli`,
`netlify login`, `netlify link`): `netlify dev` provides the connection and `netlify database migrations apply`
creates the tables. To use another Postgres instead, set `SADU_DATABASE_URL` and apply the migration SQL to it
yourself. Add schema changes as a new numbered migration (`netlify database migrations new`); never edit one that
has been deployed.

## AI-powered journey (three layers)

| Layer | What | Code |
| --- | --- | --- |
| **Real AI** | Claude writes station stories (3 depths × AR/EN, grounded in cited sources), quiz questions (with an independent answerability check), narrative bridges between consecutive stops and the end-of-journey summary; Azure AI Speech neural voices narrate | `src/server/ai/`, `src/data/sources.ts` |
| **Explainable algorithms** | weighted station scores with reasons, greedy time-budget selection with depth upgrades, Nearest Neighbour + 2-opt route, dynamic compression, rule-based quiz grading, missed-experience ranking | `src/lib/engine/`, `src/config/personalization.ts` |
| **Transparent simulation** | illustrative stations and coordinates, simulated queues, Arrived / Done position, presenter clock (+10 / +20 min) | `src/data/stations.ts`, `src/config/queue-estimates.ts` |

Every screen labels content as **AI-generated**, **Algorithmic** or **Simulated**. Full details:
[docs/AI-AND-ALGORITHMS.md](docs/AI-AND-ALGORITHMS.md).

### Five-minute judge demo

1. `/en/lab`: show the three layers and integration status; optionally *Pre-generate content* (after step 2) so stories load instantly.
2. `/en/start`: enter a visitor (first name, last name, email).
3. `/en/plan`: pick interests (e.g. history + architecture), 2 hours, “Things to see”; the live preview re-plans as you click.
4. *Build my journey* → `/en/journey`: open **Why this stop** to show the score breakdown; point at the time breakdown and the NN → 2-opt route.
5. Tap **Arrived** on stop 1: the AI story (badge + sources) at the planned depth.
6. *Start the story here*: press **Play** for neural narration (badge shows the voice).
7. **Done with this stop** → answer the question (graded by rule, explanation shown).
8. Back on the journey: **+20 Minutes**: the plan compresses (Deep Dive → Standard / removed) with reasons; the completed stop stays.
9. Continue to the next stop: the narrative bridge connects the two stops.
10. *End my journey now* → `/en/essence`: the personal summary is written from this session and saved to the account.
11. Compare two visitor profiles live on `/en/lab` (Tests A & B), and switch to Arabic (`/ar/...`) at any time.

## What's in it

| Route (`/ar/…` or `/en/…`) | Figma frames |
| --- | --- |
| `/` | D01 Landing · M02 Welcome |
| `/language` | M01 Choose language (first visit on phones) |
| `/start` | Entry form: first name, last name, email → Continue (layout of D03 / M03). Old `/signup` `/login` `/verify` `/forgot` URLs redirect here |
| `/home` | D08 / M08 · "Not {name}? Switch user" |
| `/plan` | D09 (one page + live summary) · M09–M11 (three steps) |
| `/preparing` | D12 / M12 |
| `/journey` | D13 / M13 · D22 / M22 running-late dialog (auto, or `?late=1`) |
| `/map` | M14 |
| `/pavilion/[id]` | D15–D19 / M15–M19 |
| `/pavilion/[id]/route` | D20, D40, D44, D48, D52 (+ mobile) |
| `/pavilion/[id]/listen` | D21, D41, D45, D49, D53 (+ mobile) |
| `/pavilion/[id]/quiz` · `/stamp` | D23/D24, D42–D55 (+ mobile) |
| `/badge` | D56 / M56 |
| `/essence` `/passport` `/missed` | D25–D27 / M25–M27 |
| `/account` `/accessibility` `/faq` `/contact` | D28–D31 / M28–M31 · D32 / M32 switch user |
| `/privacy` | footer link (no Figma frame) |
| `/lab` | Inside Sadu: AI / algorithm / simulation overview, integration status, audit log of real model calls, profile comparison |

`[id]` is one of `saudi`, `japan`, `morocco`, `mexico`, `korea` (Figma) or `coffee`, `diriyah`, `hegra`, `ahsa`, `ardah` (Saudi heritage stations, same layout). All are illustrative demo stations.

- **Responsive**: ≥1024px uses the desktop frames (site nav + footer); below that the mobile frames
  (app bar, bottom tab bar, sticky bottom action bar). Tablets get the mobile layout with a wider column.
- **Arabic / English**: every string comes from `src/i18n/messages/{ar,en}.ts`; layout mirrors with logical
  CSS properties and directional icons flip in RTL. Fonts follow the design system: Readex Pro + Noto Sans Arabic,
  Space Grotesk + IBM Plex Sans.
- **Dark mode, higher contrast, larger text, reduce motion**: tokens in `src/app/globals.css`
  (Foundations › Colour roles), saved per visitor and applied before first paint.
- **Users and data**: no passwords. Visitors enter first name, last name and email on `/start`; each email
  (trimmed, lower-cased) maps to exactly one account. Plan, journey progress, stamps, quiz scores, saved items and
  preferences are stored per account in Postgres (Netlify Database, see above; `src/server/db.ts`) and synced
  by `src/lib/store.ts`. Progress saved in the browser by earlier versions is moved
  into the account the first time the same email is entered. Pages other than the landing, entry, FAQ, contact,
  accessibility and privacy pages need a session (`src/proxy.ts` + `SessionGate`).
- **Not authentication**: an email typed into the form identifies a visitor but does not prove they own it,
  so anyone who types an email opens that journey. Only low-sensitivity data is stored. If verified ownership
  is ever needed, add a passwordless email code or magic link before creating the session.

  | API | |
  | --- | --- |
  | `GET /api/session` | current user + their data (401 if none) |
  | `POST /api/session` | `{ firstName, lastName, email }` → existing account (200) or new one (201), sets an HttpOnly session cookie |
  | `DELETE /api/session` | switch user: ends this browser's session |
  | `PATCH /api/me` | edit own name / email (409 if the email belongs to another account) |
  | `PUT /api/me/data` | save own data; refused (409) if the tab is acting for a different user than the session |
- **Audio** is simulated (progress, chapters, speed, captions with word highlight, transcript). "Listen to the
  question", voice samples and "Read pages aloud" use the browser's speech synthesis.

## Where things live

```
src/app/[locale]/…          routes (thin pages)
src/components/screens/     one file per screen group
src/components/sadu/        domain components (stamps, station card, maps, celebration…)
src/components/ui/          primitives (button, field, switch, dialog, list rows…)
src/components/layout/      site nav, footer, app bar, tab bar, page shell
src/components/brand/       generated from Figma SVG exports (icons, logos, illustrations, maps)
src/data/pavilions.ts       mock pavilion content in both languages
src/server/                 database queries and session helpers
netlify/database/migrations/  Postgres schema (applied by Netlify on deploy)
src/app/api/                session and user-data endpoints
public/stamps, public/passport  country stamp artwork
```

## Notes on fidelity

Built to match the Figma frames; two spots in the file looked like slips and were rendered as intended:
the auth illustration caption (its frame is 10px tall in Figma, clipping the text) is shown in full, and the
"Today at Expo" cards are aligned to the same top edge. Quiz questions 1 and 3 for each pavilion are mock
content written in the same voice (Figma only shows question 2).
