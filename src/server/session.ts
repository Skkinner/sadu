import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { createSession, deleteSession, getSessionUser, type UserRow } from "./db";

// NOTE: an email typed into the entry form identifies a visitor; it does not prove they own it.
// Only store low-sensitivity app data (plan, stamps, quiz scores, preferences) behind this session.
// Anything private needs verified ownership first (passwordless email code or magic link).

export async function startSession(userId: string) {
  const { token, expires } = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  store.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<UserRow | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? ((await getSessionUser(token)) ?? null) : null;
}

/** Rejects cross-site writes (on top of SameSite=Lax) by requiring the Origin to match the Host. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers / non-browser clients
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Small fixed-window limiter (per client IP by default), to slow down scripted email guessing and AI abuse. */
const hits = new Map<string, { count: number; reset: number }>();
export function rateLimited(request: Request, limit = 20, windowMs = 10 * 60_000, bucket?: string) {
  const ip = bucket ?? (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local");
  const t = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < t) {
    if (hits.size > 10_000) hits.clear();
    hits.set(ip, { count: 1, reset: t + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > limit;
}

/** Keeps only the known top-level sections of a user's app data and caps its size. */
const DATA_KEYS = ["plan", "journey", "history", "saved", "nextVisit", "prefs"] as const;
const DATA_MAX_BYTES = 256 * 1024;
export function sanitizeUserData(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of DATA_KEYS) if (key in src) out[key] = src[key];
  return JSON.stringify(out).length > DATA_MAX_BYTES ? null : out;
}
