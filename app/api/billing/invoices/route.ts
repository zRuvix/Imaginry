import { type NextRequest } from "next/server";
import { invoicesOf } from "@/lib/server/billing";
import { currentUser } from "@/lib/server/profiles";

/** GET -> the signed-in user's subscription payments, each with an invoice link. */
export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  try {
    return Response.json({ invoices: await invoicesOf(user.id) });
  } catch (e) {
    console.error("[billing] invoices failed", e);
    return Response.json({ error: "Invoices are unavailable right now" }, { status: 502 });
  }
}
