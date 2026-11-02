import { type NextRequest } from "next/server";
import { currentUser, ensureProfile, updateProfile } from "@/lib/server/profiles";

/** GET -> the signed-in user's profile (created on first call). */
export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  return Response.json({ profile: await ensureProfile(user) });
}

/** PATCH { username, firstName, lastName, socials, isPublic } -> { profile } or { errors }. */
export async function PATCH(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }
  await ensureProfile(user);
  const result = await updateProfile(user.id, (body ?? {}) as Record<string, unknown>);
  return Response.json(result, { status: "errors" in result ? 400 : 200 });
}
