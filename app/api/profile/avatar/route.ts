import { type NextRequest } from "next/server";
import { currentUser, ensureProfile, setAvatar } from "@/lib/server/profiles";

/** PUT { seed } -> { profile }: a seed picks that generated avatar, null goes back to the Google photo. */
export async function PUT(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  let body: { seed?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }
  await ensureProfile(user);
  const profile = await setAvatar(user.id, body?.seed ?? null);
  if (!profile) return Response.json({ error: "Invalid avatar" }, { status: 400 });
  return Response.json({ profile });
}
