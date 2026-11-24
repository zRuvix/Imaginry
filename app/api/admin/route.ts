import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_TTL_SECONDS, adminEnabled, adminToken, keyMatches } from "@/lib/server/admin";
import { clientIp } from "@/lib/server/events";
import { allowRequest } from "@/lib/server/shortlinks";

/** POST { key } -> 204 and the admin cookie, or 401. */
export async function POST(request: NextRequest) {
  if (!adminEnabled()) return Response.json({ error: "Admin is turned off" }, { status: 404 });
  try {
    // 5 tries a minute per address.
    if (!(await allowRequest(`admin:${clientIp(request)}`, 5))) {
      return Response.json({ error: "Too many tries, wait a minute" }, { status: 429 });
    }
  } catch (e) {
    console.error("[admin]", e instanceof Error ? e.message : e);
  }
  let key: unknown;
  try {
    key = (await request.json()).key;
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }
  if (!keyMatches(key)) return Response.json({ error: "Wrong key" }, { status: 401 });

  (await cookies()).set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_TTL_SECONDS,
  });
  return new Response(null, { status: 204 });
}

/** DELETE -> 204: lock the dashboard again. */
export async function DELETE() {
  (await cookies()).delete(ADMIN_COOKIE);
  return new Response(null, { status: 204 });
}
