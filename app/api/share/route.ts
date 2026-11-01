import { type NextRequest } from "next/server";
import { allowRequest, createShortLink, MAX_DESIGN_LENGTH } from "@/lib/server/shortlinks";
import { decodeShare } from "@/lib/studio/storage";

/** POST { design } -> { code, path }: a short link for a compact design string. */
export async function POST(request: NextRequest) {
  let design: unknown;
  try {
    ({ design } = await request.json());
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }
  if (typeof design !== "string" || !design || design.length > MAX_DESIGN_LENGTH) {
    return Response.json({ error: "Invalid design" }, { status: 400 });
  }
  // Only store things that actually decode to a design.
  if (!decodeShare(`#${design}`)) return Response.json({ error: "Invalid design" }, { status: 400 });

  const caller = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  try {
    if (!(await allowRequest(caller))) {
      return Response.json({ error: "Too many links, try again in a minute" }, { status: 429 });
    }
    const code = await createShortLink(design);
    return Response.json({ code, path: `/s/${code}` });
  } catch (e) {
    console.error("[share]", e instanceof Error ? e.message : e);
    return Response.json({ error: "Link service unavailable" }, { status: 503 });
  }
}
