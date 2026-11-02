import { type NextRequest } from "next/server";
import { currentUser, profilePage } from "@/lib/server/profiles";

/** GET -> a profile and its designs; only { private: true } for someone else's private profile. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/profiles/[username]">) {
  const { username } = await ctx.params;
  const viewer = await currentUser(request);
  const page = await profilePage(username, viewer?.id ?? null);
  if (!page) return Response.json({ error: "No such profile" }, { status: 404 });
  return Response.json(page);
}
