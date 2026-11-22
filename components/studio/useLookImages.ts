"use client";

import { useEffect, useMemo, useState } from "react";
import { stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { renderOffscreen } from "@/lib/studio/renderer";

const LONG_SIDE = 640;
/** Pixel-based effects are tuned to look like they do on a ~900px studio canvas. */
const REFERENCE_PX = 900;

/** Renders one look to a still and returns an object URL (caller revokes it). */
export async function renderLookUrl(look: CuratedLook, longSide = LONG_SIDE): Promise<string | null> {
  const width = Math.round(look.ratio >= 1 ? longSide : longSide * look.ratio);
  const height = Math.round(look.ratio >= 1 ? longSide / look.ratio : longSide);
  const canvas = await renderOffscreen(stateForLook(look), width, height, {
    time: look.time ?? 2,
    detail: REFERENCE_PX / Math.min(width, height),
  });
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.9));
  return blob ? URL.createObjectURL(blob) : null;
}

/**
 * Renders each look once on the shared offscreen WebGL context and returns
 * object URLs, filled in progressively.
 */
export function useLookImages(lookList: CuratedLook[], longSide = LONG_SIDE) {
  // Keyed by content, so a fresh array with the same looks (e.g. an inline
  // slice) doesn't re-render everything and revoke the URLs on screen.
  const key = lookList.map((l) => l.name).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const looks = useMemo(() => lookList, [key]);
  const [urls, setUrls] = useState<(string | null)[]>(() => looks.map(() => null));

  useEffect(() => {
    let cancelled = false;
    setUrls(looks.map(() => null));
    const made: string[] = [];
    (async () => {
      for (let i = 0; i < looks.length; i++) {
        if (cancelled) return;
        try {
          const url = await renderLookUrl(looks[i], longSide);
          if (!url) return;
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
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
  }, [looks, longSide]);

  return urls;
}
