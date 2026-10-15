import "server-only";

// Postgres via Netlify Database (@netlify/database). On Netlify the connection comes from the environment;
// SADU_DATABASE_URL overrides it (any Postgres). The schema lives in netlify/database/migrations/, applied by
// Netlify on deploy and locally by `netlify database migrations apply`.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDatabase, type DatabaseConnection } from "@netlify/database";
import { normalizeEmail, type Profile } from "@/lib/profile";

export type UserRow = { id: string; firstName: string; lastName: string; email: string };

const SESSION_DAYS = 30;

// one pool per server process (kept across dev hot reloads)
const g = globalThis as unknown as { saduDb?: DatabaseConnection };
function connection() {
  return (g.saduDb ??= getDatabase({ connectionString: process.env.SADU_DATABASE_URL || undefined }));
}

async function query<T>(text: string, params: unknown[] = []) {
  const { rows } = await connection().pool.query(text, params);
  return rows as T[];
}

const now = () => new Date().toISOString();

const USER_COLUMNS = `id, first_name AS "firstName", last_name AS "lastName", email`;

export async function findUserByEmail(email: string) {
  const [user] = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [normalizeEmail(email)]);
  return user as UserRow | undefined;
}

/** Returns the account for this email, creating it only if none exists. Safe against concurrent requests. */
export async function findOrCreateUser(profile: Profile): Promise<{ user: UserRow; created: boolean }> {
  const email = normalizeEmail(profile.email);
  const t = now();
  const [inserted] = await query<UserRow>(
    `INSERT INTO users (id, email, first_name, last_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING RETURNING ${USER_COLUMNS}`,
    [randomUUID(), email, profile.firstName, profile.lastName, t, t],
  );
  if (inserted) return { user: inserted, created: true };
  const [user] = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [email]);
  return { user, created: false };
}

export class EmailTakenError extends Error {}

export async function updateUserProfile(userId: string, profile: Profile): Promise<UserRow> {
  const email = normalizeEmail(profile.email);
  const owner = await findUserByEmail(email);
  if (owner && owner.id !== userId) throw new EmailTakenError();
  try {
    const [user] = await query<UserRow>(
      `UPDATE users SET first_name = $1, last_name = $2, email = $3, updated_at = $4 WHERE id = $5 RETURNING ${USER_COLUMNS}`,
      [profile.firstName, profile.lastName, email, now(), userId],
    );
    return user;
  } catch (e) {
    // lost a race with another account claiming the same email (unique_violation)
    if ((e as { code?: string }).code === "23505") throw new EmailTakenError();
    throw e;
  }
}

export async function getUserData(userId: string): Promise<unknown> {
  const [row] = await query<{ data: unknown }>("SELECT data FROM user_data WHERE user_id = $1", [userId]);
  return row ? row.data : null;
}

export async function saveUserData(userId: string, data: unknown) {
  await query(
    "INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, $3) ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    [userId, JSON.stringify(data), now()],
  );
}

// ---------------------------------------------------------------- sessions
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query("DELETE FROM sessions WHERE expires_at < $1", [now()]);
  await query("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)", [hash(token), userId, now(), expires.toISOString()]);
  return { token, expires };
}

export async function getSessionUser(token: string) {
  const [user] = await query<UserRow>(
    `SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [hash(token), now()],
  );
  return user as UserRow | undefined;
}

export async function deleteSession(token: string) {
  await query("DELETE FROM sessions WHERE token_hash = $1", [hash(token)]);
}

// ---------------------------------------------------------------- AI layer storage
export async function getCached<T>(kind: string, key: string): Promise<{ value: T; model: string; createdAt: string } | null> {
  const [row] = await query<{ json: T; model: string; created_at: string }>("SELECT json, model, created_at FROM ai_cache WHERE kind = $1 AND cache_key = $2", [kind, key]);
  return row ? { value: row.json, model: row.model, createdAt: row.created_at } : null;
}

export async function putCached(kind: string, key: string, lang: string, value: unknown, model: string) {
  await query(
    "INSERT INTO ai_cache (kind, cache_key, lang, json, model, created_at) VALUES ($1, $2, $3, $4::jsonb, $5, $6) ON CONFLICT (kind, cache_key) DO UPDATE SET json = excluded.json, model = excluded.model, created_at = excluded.created_at",
    [kind, key, lang, JSON.stringify(value), model, now()],
  );
}

export async function getAudio(key: string) {
  const [row] = await query<{ provider: string; voice: string; mime: string; audio: Uint8Array }>("SELECT provider, voice, mime, audio FROM tts_cache WHERE cache_key = $1", [key]);
  return row ?? null;
}

export async function putAudio(key: string, provider: string, voice: string, mime: string, audio: Uint8Array) {
  await query(
    "INSERT INTO tts_cache (cache_key, provider, voice, mime, audio, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (cache_key) DO UPDATE SET provider = excluded.provider, voice = excluded.voice, mime = excluded.mime, audio = excluded.audio, created_at = excluded.created_at",
    [key, provider, voice, mime, Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength), now()],
  );
}

export type AiCall = { kind: string; provider: string; model: string; ok: boolean; ms: number; inputTokens?: number; outputTokens?: number; error?: string };

/** Never throws. Await it: on serverless, an un-awaited write can be cut off when the function returns. */
export async function logAiCall(c: AiCall) {
  try {
    await query(
      "INSERT INTO ai_calls (kind, provider, model, ok, ms, input_tokens, output_tokens, error, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [c.kind, c.provider, c.model, c.ok ? 1 : 0, c.ms, c.inputTokens ?? null, c.outputTokens ?? null, c.error?.slice(0, 300) ?? null, now()],
    );
  } catch {
    /* logging must never break a request */
  }
}

export async function recentAiCalls(limit = 20) {
  return query<Omit<AiCall, "ok"> & { ok: number; createdAt: string }>(
    `SELECT kind, provider, model, ok, ms, input_tokens AS "inputTokens", output_tokens AS "outputTokens", error, created_at AS "createdAt" FROM ai_calls ORDER BY id DESC LIMIT $1`,
    [limit],
  );
}

export async function aiCacheCounts() {
  return query<{ kind: string; lang: string; n: number }>("SELECT kind, lang, COUNT(*)::int AS n FROM ai_cache GROUP BY kind, lang");
}

export async function saveSummary(userId: string, journeyId: string, lang: string, summary: unknown, model: string) {
  const id = randomUUID();
  await query("INSERT INTO journey_summaries (id, user_id, journey_id, lang, json, model, created_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)", [
    id,
    userId,
    journeyId,
    lang,
    JSON.stringify(summary),
    model,
    now(),
  ]);
  return id;
}
