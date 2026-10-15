import "server-only";

// Input parsing and access control shared by the AI endpoints: signed-in visitors only (keeps model spend tied
// to real sessions), same-origin, rate limited per user, and strictly validated parameters.
import { DEPTHS, isStationId, type Depth, type PavilionId } from "@/data/pavilions";
import { isLocale, type Locale } from "@/i18n/config";
import { currentUser, json, rateLimited, sameOrigin } from "@/server/session";
import type { UserRow } from "@/server/db";

export type Guarded = { user: UserRow; body: Record<string, unknown> } | { error: Response };

export async function guard(request: Request, { limit = 120 } = {}): Promise<Guarded> {
  if (!sameOrigin(request)) return { error: json({ error: "forbidden" }, 403) };
  const user = await currentUser();
  if (!user) return { error: json({ error: "unauthenticated" }, 401) };
  if (rateLimited(request, limit, 10 * 60_000, `ai:${user.id}`)) return { error: json({ error: "rate_limited" }, 429) };
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return { error: json({ error: "invalid" }, 400) };
  return { user, body };
}

export const station = (v: unknown): PavilionId | null => (isStationId(v) ? v : null);
export const depth = (v: unknown): Depth | null => (DEPTHS.includes(v as Depth) ? (v as Depth) : null);
export const lang = (v: unknown): Locale | null => (typeof v === "string" && isLocale(v) ? v : null);
export const bad = (what: string) => json({ error: "invalid", field: what }, 400);
