import { type NextRequest } from "next/server";
import { claimExport, isQuotaKind, quotaOf } from "@/lib/server/exports";
import { currentUser } from "@/lib/server/profiles";

/** GET -> { quota }: the signed-in user's plan and exports left today. */
export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  return Response.json({ quota: await quotaOf(user.id) });
}

/**
 * POST { kind, width, height, meta? } -> { quota } once an export is
 * allowed and counted, or 403 with { error, quota } when the plan doesn't allow it.
 */
export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  let body: { kind?: unknown; width?: unknown; height?: unknown; meta?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const width = Number(body.width);
  const height = Number(body.height);
  if (!isQuotaKind(body.kind) || !(width > 0) || !(height > 0)) {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const result = await claimExport(user.id, body.kind, {
    request,
    width,
    height,
    meta: body.meta,
  });
  if (!result.ok) return Response.json({ error: result.error, quota: result.quota }, { status: 403 });
  return Response.json({ quota: result.quota });
}
