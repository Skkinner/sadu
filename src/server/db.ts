import "server-only";

// SQLite (Node's built-in node:sqlite, no extra dependency). One file, created on first use.
// Schema changes are numbered migrations tracked with PRAGMA user_version; add new ones to the end.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { normalizeEmail, type Profile } from "@/lib/profile";

export type UserRow = { id: string; firstName: string; lastName: string; email: string };

const SESSION_DAYS = 30;

const MIGRATIONS: string[] = [
  // 1 · users identified by a unique (normalized) email, user-owned data, sessions
  `
  CREATE TABLE users (
    id          TEXT PRIMARY KEY,                       -- random UUID, never derived from the email
    email       TEXT NOT NULL UNIQUE COLLATE NOCASE,    -- stored normalized (trimmed, lower-case)
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE TABLE user_data (
    user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data        TEXT NOT NULL CHECK (json_valid(data)), -- plan, journey (stamps, scores), saved, preferences
    updated_at  TEXT NOT NULL
  );
  CREATE TABLE sessions (
    token_hash  TEXT PRIMARY KEY,                       -- sha-256 of the cookie value; the token itself is never stored
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL
  );
  CREATE INDEX sessions_user_id ON sessions(user_id);
  `,
  // 2 · AI layer: cached generations, cached narration audio, an audit log of real model calls, saved summaries
  `
  CREATE TABLE ai_cache (
    kind        TEXT NOT NULL,                          -- content | quiz | bridge
    cache_key   TEXT NOT NULL,                          -- inputs + source hash + prompt version
    lang        TEXT NOT NULL,
    json        TEXT NOT NULL CHECK (json_valid(json)),
    model       TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (kind, cache_key)
  );
  CREATE TABLE tts_cache (
    cache_key   TEXT PRIMARY KEY,                       -- sha-256 of provider + voice + text
    provider    TEXT NOT NULL,
    voice       TEXT NOT NULL,
    mime        TEXT NOT NULL,
    audio       BLOB NOT NULL,
    created_at  TEXT NOT NULL
  );
  CREATE TABLE ai_calls (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    kind          TEXT NOT NULL,                        -- content | quiz | quiz-check | bridge | summary | tts
    provider      TEXT NOT NULL,
    model         TEXT NOT NULL,
    ok            INTEGER NOT NULL,
    ms            INTEGER NOT NULL,
    input_tokens  INTEGER,
    output_tokens INTEGER,
    error         TEXT,
    created_at    TEXT NOT NULL
  );
  CREATE TABLE journey_summaries (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_id  TEXT NOT NULL,
    lang        TEXT NOT NULL,
    json        TEXT NOT NULL CHECK (json_valid(json)),
    model       TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );
  CREATE INDEX journey_summaries_user ON journey_summaries(user_id, created_at);
  `,
];

function open() {
  const file = process.env.SADU_DB_PATH ?? path.join(process.cwd(), "data", "sadu.db");
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  const { user_version: version } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let i = version; i < MIGRATIONS.length; i++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
    });
  }
  return db;
}

// one connection per server process (kept across dev hot reloads)
const g = globalThis as unknown as { saduDb?: DatabaseSync };
function db() {
  return (g.saduDb ??= open());
}

function transaction<T>(conn: DatabaseSync, fn: () => T): T {
  conn.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (e) {
    conn.exec("ROLLBACK");
    throw e;
  }
}

const now = () => new Date().toISOString();

const USER_COLUMNS = "id, first_name AS firstName, last_name AS lastName, email";

export function findUserByEmail(email: string) {
  return db().prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`).get(normalizeEmail(email)) as UserRow | undefined;
}

/** Returns the account for this email, creating it only if none exists. Safe against concurrent requests. */
export function findOrCreateUser(profile: Profile): { user: UserRow; created: boolean } {
  const conn = db();
  return transaction(conn, () => {
    const email = normalizeEmail(profile.email);
    const t = now();
    const inserted = conn
      .prepare("INSERT INTO users (id, email, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING")
      .run(randomUUID(), email, profile.firstName, profile.lastName, t, t);
    const user = conn.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`).get(email) as UserRow;
    return { user, created: inserted.changes === 1 };
  });
}

export class EmailTakenError extends Error {}

export function updateUserProfile(userId: string, profile: Profile): UserRow {
  const email = normalizeEmail(profile.email);
  const owner = findUserByEmail(email);
  if (owner && owner.id !== userId) throw new EmailTakenError();
  try {
    db()
      .prepare("UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = ? WHERE id = ?")
      .run(profile.firstName, profile.lastName, email, now(), userId);
  } catch (e) {
    // lost a race with another account claiming the same email
    if (String((e as Error).message).includes("UNIQUE")) throw new EmailTakenError();
    throw e;
  }
  return db().prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).get(userId) as UserRow;
}

export function getUserData(userId: string): unknown {
  const row = db().prepare("SELECT data FROM user_data WHERE user_id = ?").get(userId) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
}

export function saveUserData(userId: string, data: unknown) {
  db()
    .prepare("INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .run(userId, JSON.stringify(data), now());
}

// ---------------------------------------------------------------- sessions
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const conn = db();
  conn.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
  conn.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(hash(token), userId, now(), expires.toISOString());
  return { token, expires };
}

export function getSessionUser(token: string) {
  return db()
    .prepare(`SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`)
    .get(hash(token), now()) as UserRow | undefined;
}

export function deleteSession(token: string) {
  db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash(token));
}

// ---------------------------------------------------------------- AI layer storage
export function getCached<T>(kind: string, key: string): { value: T; model: string; createdAt: string } | null {
  const row = db().prepare("SELECT json, model, created_at FROM ai_cache WHERE kind = ? AND cache_key = ?").get(kind, key) as
    | { json: string; model: string; created_at: string }
    | undefined;
  return row ? { value: JSON.parse(row.json) as T, model: row.model, createdAt: row.created_at } : null;
}

export function putCached(kind: string, key: string, lang: string, value: unknown, model: string) {
  db()
    .prepare("INSERT INTO ai_cache (kind, cache_key, lang, json, model, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(kind, cache_key) DO UPDATE SET json = excluded.json, model = excluded.model, created_at = excluded.created_at")
    .run(kind, key, lang, JSON.stringify(value), model, now());
}

export function getAudio(key: string) {
  const row = db().prepare("SELECT provider, voice, mime, audio FROM tts_cache WHERE cache_key = ?").get(key) as
    | { provider: string; voice: string; mime: string; audio: Uint8Array }
    | undefined;
  return row ?? null;
}

export function putAudio(key: string, provider: string, voice: string, mime: string, audio: Uint8Array) {
  db().prepare("INSERT OR REPLACE INTO tts_cache (cache_key, provider, voice, mime, audio, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(key, provider, voice, mime, audio, now());
}

export type AiCall = { kind: string; provider: string; model: string; ok: boolean; ms: number; inputTokens?: number; outputTokens?: number; error?: string };

export function logAiCall(c: AiCall) {
  try {
    db()
      .prepare("INSERT INTO ai_calls (kind, provider, model, ok, ms, input_tokens, output_tokens, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(c.kind, c.provider, c.model, c.ok ? 1 : 0, c.ms, c.inputTokens ?? null, c.outputTokens ?? null, c.error?.slice(0, 300) ?? null, now());
  } catch {
    /* logging must never break a request */
  }
}

export function recentAiCalls(limit = 20) {
  return db()
    .prepare("SELECT kind, provider, model, ok, ms, input_tokens AS inputTokens, output_tokens AS outputTokens, error, created_at AS createdAt FROM ai_calls ORDER BY id DESC LIMIT ?")
    .all(limit) as (Omit<AiCall, "ok"> & { ok: number; createdAt: string })[];
}

export function aiCacheCounts() {
  return db().prepare("SELECT kind, lang, COUNT(*) AS n FROM ai_cache GROUP BY kind, lang").all() as { kind: string; lang: string; n: number }[];
}

export function saveSummary(userId: string, journeyId: string, lang: string, summary: unknown, model: string) {
  const id = randomUUID();
  db().prepare("INSERT INTO journey_summaries (id, user_id, journey_id, lang, json, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, userId, journeyId, lang, JSON.stringify(summary), model, now());
  return id;
}
