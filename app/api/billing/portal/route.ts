import { type NextRequest } from "next/server";
import { portalLink } from "@/lib/server/billing";
import { currentUser } from "@/lib/server/profiles";

/** GET -> redirect to Dodo's customer portal for the signed-in user (cancel, card, invoices). */
export async function GET(request: NextRequest) {
  const origin = process.env.BETTER_AUTH_URL ?? request.nextUrl.origin;
  const user = await currentUser(request);
  if (!user) return Response.redirect(`${origin}/studio`, 303);
  try {
    const link = await portalLink(user.id);
    return Response.redirect(link ?? `${origin}/#pricing`, 303);
  } catch (e) {
    console.error("[billing] portal failed", e);
    return Response.json({ error: "Billing portal is unavailable right now" }, { status: 502 });
  }
}
