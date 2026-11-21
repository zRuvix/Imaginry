import { type NextRequest } from "next/server";
import { AVATAR_SEED, avatarSvg } from "@/lib/avatar";

/** GET -> the generated avatar for a seed. A seed always draws the same picture, so it caches forever. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/avatar/[seed]">) {
  const { seed } = await ctx.params;
  if (!AVATAR_SEED.test(seed)) return new Response("Not found", { status: 404 });
  return new Response(avatarSvg(seed), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      // An SVG opened directly must not run anything.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
