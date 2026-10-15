import { validateProfile } from "@/lib/profile";
import { findOrCreateUser, getUserData } from "@/server/db";
import { currentUser, endSession, json, rateLimited, sameOrigin, startSession } from "@/server/session";

// GET → who is using the app on this browser, with their saved data.
export async function GET() {
  const user = await currentUser();
  if (!user) return json({ user: null }); // nobody has entered yet: a normal state, not an error
  return json({ user, data: getUserData(user.id) });
}

// POST { firstName, lastName, email } → find the account for this email (or create it) and start a session.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (rateLimited(request)) return json({ error: "rate_limited" }, 429);
  const body = await request.json().catch(() => null);
  const result = validateProfile(body);
  if (!result.ok) return json({ error: "invalid", fields: result.errors }, 400);

  const { user, created } = findOrCreateUser(result.value);
  await endSession(); // drop any previous visitor's session on this browser
  await startSession(user.id);
  // an existing account keeps its stored name: an unverified form must not rename someone else's account
  return json({ user, created, data: created ? null : getUserData(user.id) }, created ? 201 : 200);
}

// DELETE → "Switch user": forget this browser's session. The account and its data stay in the database.
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  await endSession();
  return json({ ok: true });
}
