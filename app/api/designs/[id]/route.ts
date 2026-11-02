import { type NextRequest } from "next/server";
import { currentUser, deleteDesign } from "@/lib/server/profiles";

/** DELETE -> removes one of your own published designs. */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/designs/[id]">) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await deleteDesign(user.id, id))) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
