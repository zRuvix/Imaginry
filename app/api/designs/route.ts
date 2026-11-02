import { type NextRequest } from "next/server";
import { allowRequest } from "@/lib/server/shortlinks";
import { currentUser, ensureProfile, exploreFeed, FEED_PAGE, publishDesign } from "@/lib/server/profiles";

/** GET ?before=<iso> -> { designs, next }: newest designs from public profiles. */
export async function GET(request: NextRequest) {
  const designs = await exploreFeed(request.nextUrl.searchParams.get("before"));
  const next = designs.length === FEED_PAGE ? designs[designs.length - 1].createdAt : null;
  return Response.json({ designs, next });
}

/** POST { title, design } -> { design }: publish to Explore (signed in only, photos stripped). */
export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in with Google to publish" }, { status: 401 });
  let body: { title?: unknown; design?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }
  try {
    if (!(await allowRequest(`publish:${user.id}`, 10))) {
      return Response.json({ error: "Publishing too fast, try again in a minute" }, { status: 429 });
    }
  } catch (e) {
    // The rate limiter lives in Redis; don't block publishing if it's down.
    console.error("[designs]", e instanceof Error ? e.message : e);
  }
  await ensureProfile(user);
  const result = await publishDesign(user.id, body.title, body.design);
  return Response.json(result, { status: "error" in result ? 400 : 201 });
}
