import { after, type NextRequest } from "next/server";
import { isEventKind } from "@/lib/events";
import { clientIp, recordEvent } from "@/lib/server/events";
import { currentUser } from "@/lib/server/profiles";
import { allowRequest } from "@/lib/server/shortlinks";

/** POST { kind, meta? } -> 204: one usage event from the studio (see lib/events). */
export async function POST(request: NextRequest) {
  let body: { kind?: unknown; meta?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!isEventKind(body.kind) || body.kind === "publish") return new Response(null, { status: 400 });
  const kind = body.kind;

  try {
    if (!(await allowRequest(`track:${clientIp(request)}`, 120))) return new Response(null, { status: 429 });
  } catch {
    // Redis down: still record, the per-minute cap is only a guard.
  }
  const user = await currentUser(request).catch(() => null);
  // Answer straight away; the insert runs after the response is sent.
  after(() => recordEvent(kind, { request, userId: user?.id, meta: body.meta }));
  return new Response(null, { status: 204 });
}
