import { validateProfile } from "@/lib/profile";
import { EmailTakenError, updateUserProfile } from "@/server/db";
import { currentUser, json, sameOrigin } from "@/server/session";

// PATCH { userId, firstName, lastName, email } → edit the signed-in user's own profile.
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const user = await currentUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  const body = await request.json().catch(() => null);
  // the tab must still be acting for the user this browser is signed in as (another tab may have switched)
  if (body?.userId !== user.id) return json({ error: "user_mismatch" }, 409);
  const result = validateProfile(body);
  if (!result.ok) return json({ error: "invalid", fields: result.errors }, 400);
  try {
    return json({ user: await updateUserProfile(user.id, result.value) });
  } catch (e) {
    if (e instanceof EmailTakenError) return json({ error: "email_taken" }, 409);
    throw e;
  }
}
