import { type NextRequest } from "next/server";
import { billingOf } from "@/lib/server/billing";
import { currentUser } from "@/lib/server/profiles";

/** GET -> the signed-in user's plan. */
export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  return Response.json({ billing: await billingOf(user.id) });
}
