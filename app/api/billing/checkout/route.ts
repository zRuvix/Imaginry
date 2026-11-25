import { type NextRequest } from "next/server";
import { createCheckout, isCycle, isPro } from "@/lib/server/billing";
import { currentUser } from "@/lib/server/profiles";
import type { Cycle } from "@/lib/pricing";

const originOf = (request: NextRequest) => process.env.BETTER_AUTH_URL ?? request.nextUrl.origin;

type Started = { url: string } | { error: string; status: number };

async function start(request: NextRequest, cycle: Cycle): Promise<Started> {
  const user = await currentUser(request);
  if (!user) return { error: "Sign in first", status: 401 };
  if (await isPro(user.id)) return { url: `${originOf(request)}/studio` };
  try {
    return { url: await createCheckout(user, cycle, originOf(request)) };
  } catch (e) {
    console.error("[billing] checkout failed", e);
    return { error: "Checkout is unavailable right now", status: 502 };
  }
}

/** POST { cycle } -> { url } of a hosted Dodo checkout. Already Pro -> the studio. */
export async function POST(request: NextRequest) {
  let body: { cycle?: unknown } = {};
  try {
    body = await request.json();
  } catch {}
  const cycle = isCycle(body.cycle) ? body.cycle : "yearly";
  const result = await start(request, cycle);
  return "url" in result ? Response.json({ url: result.url }) : Response.json({ error: result.error }, { status: result.status });
}

/**
 * GET ?cycle=monthly|yearly -> redirect to checkout. Used as the callback
 * after sign-in, so a signed-out "Get Pro" lands straight on the payment page.
 */
export async function GET(request: NextRequest) {
  const c = request.nextUrl.searchParams.get("cycle");
  const result = await start(request, isCycle(c) ? c : "yearly");
  if ("url" in result) return Response.redirect(result.url, 303);
  return Response.redirect(`${originOf(request)}/#pricing`, 303);
}
