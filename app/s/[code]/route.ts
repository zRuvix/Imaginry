import { type NextRequest } from "next/server";
import { resolveShortLink } from "@/lib/server/shortlinks";

/** /s/<code> -> the studio with that design in the hash. */
export async function GET(request: NextRequest, ctx: RouteContext<"/s/[code]">) {
  const { code } = await ctx.params;
  let design: string | null = null;
  try {
    design = await resolveShortLink(code);
  } catch (e) {
    console.error("[s]", e instanceof Error ? e.message : e);
  }
  const target = design ? `/studio#${design}` : "/studio?link=missing";
  return Response.redirect(new URL(target, request.url), 307);
}
