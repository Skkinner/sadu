-- Initial schema (Postgres, Netlify Database). Ported from the two original SQLite migrations.
-- Netlify applies new migrations on deploy; locally run `netlify database migrations apply`.
-- Add schema changes as new numbered files; never edit one that has been deployed.

-- users identified by a unique (normalized) email, user-owned data, sessions
CREATE TABLE users (
  id          TEXT PRIMARY KEY,                       -- random UUID, never derived from the email
  email       TEXT NOT NULL UNIQUE,                   -- stored normalized (trimmed, lower-case)
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE TABLE user_data (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,                         -- plan, journey (stamps, scores), saved, preferences
  updated_at  TEXT NOT NULL
);
CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,                       -- sha-256 of the cookie value; the token itself is never stored
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);
CREATE INDEX sessions_user_id ON sessions(user_id);

-- AI layer: cached generations, cached narration audio, an audit log of real model calls, saved summaries
CREATE TABLE ai_cache (
  kind        TEXT NOT NULL,                          -- content | quiz | bridge
  cache_key   TEXT NOT NULL,                          -- inputs + source hash + prompt version
  lang        TEXT NOT NULL,
  json        JSONB NOT NULL,
  model       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (kind, cache_key)
);
CREATE TABLE tts_cache (
  cache_key   TEXT PRIMARY KEY,                       -- sha-256 of provider + voice + text
  provider    TEXT NOT NULL,
  voice       TEXT NOT NULL,
  mime        TEXT NOT NULL,
  audio       BYTEA NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE TABLE ai_calls (
  id            BIGSERIAL PRIMARY KEY,
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
  json        JSONB NOT NULL,
  model       TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX journey_summaries_user ON journey_summaries(user_id, created_at);
