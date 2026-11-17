import { type NextRequest } from "next/server";
import { fitSize, renderPng } from "@/lib/server/png";
import { allowRequest } from "@/lib/server/shortlinks";
import { decodeShare, encodeShare } from "@/lib/studio/storage";

// Headless Chromium renders on the CPU; big frames take a few seconds.
export const maxDuration = 60;

/**
 * GET ?d=<design>&w=&h=&t= -> image/png. The same design, size and frame
 * always render the same picture, so the CDN keeps each one for a year.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const state = decodeShare(`#${q.get("d") ?? ""}`);
  if (!state || state.order.length === 0) return Response.json({ error: "Invalid design" }, { status: 400 });
  const design = encodeShare(state);
  const size = fitSize(Number(q.get("w")), Number(q.get("h")));
  const time = Math.min(600, Math.max(0, Number(q.get("t")) || 0));

  const caller = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  try {
    if (!(await allowRequest(`png:${caller}`, 12))) {
      return Response.json({ error: "Too many renders, try again in a minute" }, { status: 429 });
    }
  } catch {
    // The limiter lives in Redis; render anyway if it's down.
  }

  try {
    const png = await renderPng(request.nextUrl.origin, design, size, time);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="imaginry-${size.width}x${size.height}.png"`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("[png]", e instanceof Error ? e.message : e);
    return Response.json({ error: "Render failed" }, { status: 503 });
  }
}
