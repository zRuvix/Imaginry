"use client";

import { useEffect, useState } from "react";
import { stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { renderOffscreen } from "@/lib/studio/renderer";

const LONG_SIDE = 640;
/** Pixel-based effects are tuned to look like they do on a ~900px studio canvas. */
const REFERENCE_PX = 900;

/**
 * Renders each look once on the shared offscreen WebGL context and returns
 * object URLs, filled in progressively.
 */
export function useLookImages(looks: CuratedLook[]) {
  const [urls, setUrls] = useState<(string | null)[]>(() => looks.map(() => null));

  useEffect(() => {
    let cancelled = false;
    const made: string[] = [];
    (async () => {
      for (let i = 0; i < looks.length; i++) {
        if (cancelled) return;
        const look = looks[i];
        const width = Math.round(look.ratio >= 1 ? LONG_SIDE : LONG_SIDE * look.ratio);
        const height = Math.round(look.ratio >= 1 ? LONG_SIDE / look.ratio : LONG_SIDE);
        try {
          const canvas = await renderOffscreen(stateForLook(look), width, height, {
            time: look.time ?? 2,
            detail: REFERENCE_PX / Math.min(width, height),
          });
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.9));
          if (!blob || cancelled) return;
          const url = URL.createObjectURL(blob);
          made.push(url);
          setUrls((prev) => prev.map((u, j) => (j === i ? url : u)));
        } catch (e) {
          console.error(e);
          return;
        }
        // Let the page breathe between renders.
        await new Promise((r) => setTimeout(r, 0));
      }
    })();
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [looks]);

  return urls;
}
