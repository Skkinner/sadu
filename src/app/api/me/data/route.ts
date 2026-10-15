import { saveUserData } from "@/server/db";
import { currentUser, json, sameOrigin, sanitizeUserData } from "@/server/session";

// PUT { userId, data } → replace the signed-in user's app data (plan, journey, stamps, scores, saved, prefs).
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const user = await currentUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  const body = await request.json().catch(() => null);
  // never write one account's data into another: the tab must be acting for the session's user
  if (body?.userId !== user.id) return json({ error: "user_mismatch" }, 409);
  const data = sanitizeUserData(body?.data);
  if (!data) return json({ error: "invalid" }, 400);
  saveUserData(user.id, data);
  return json({ ok: true });
}
