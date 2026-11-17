"use client";

import { useEffect } from "react";
import { renderOffscreen } from "@/lib/studio/renderer";
import { decodeShare } from "@/lib/studio/storage";

/** The studio canvas is about this many pixels on its short side; pixel-sized details are tuned to it. */
const STAGE_PX = 900;

export type RenderResult = { ok: true; png: string } | { ok: false; error: string };

declare global {
  interface Window {
    __imaginryRender?: RenderResult;
  }
}

/**
 * Draws the design in the URL hash at ?w=&h=&t= with the studio's own
 * renderer and leaves the PNG (base64) on `window.__imaginryRender` for the
 * headless browser to collect.
 */
export default function RenderPng() {
  useEffect(() => {
    const done = (r: RenderResult) => {
      window.__imaginryRender = r;
    };
    (async () => {
      const q = new URLSearchParams(location.search);
      const width = Number(q.get("w")) || 1600;
      const height = Number(q.get("h")) || 1000;
      const time = Number(q.get("t")) || 0;
      const state = decodeShare(location.hash);
      if (!state) return done({ ok: false, error: "Invalid design" });
      const canvas = await renderOffscreen(state, width, height, {
        time,
        pixel: Math.max(1, Math.min(width, height) / STAGE_PX),
      });
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) return done({ ok: false, error: "Could not encode the PNG" });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      done({ ok: true, png: btoa(bin) });
    })().catch((e) => done({ ok: false, error: e instanceof Error ? e.message : "Render failed" }));
  }, []);

  return null;
}
