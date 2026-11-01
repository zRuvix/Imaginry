"use client";

import { useEffect, useState } from "react";
import { GROUPS, thumbState } from "@/lib/studio/presets";
import { renderOffscreen } from "@/lib/studio/renderer";
import { emptyState, orderFromEnabled, type SectionKey, type StudioState } from "@/lib/studio/schema";

const PRESET_PX = 128;
const LAYER_PX = 72;

// Preset thumbnails never change, so they're rendered once per page load.
let presetCache: Record<string, string> | null = null;

/** Every preset rendered once with the real shaders, filled in a few per frame. */
export function usePresetThumbs() {
  const [thumbs, setThumbs] = useState<Record<string, string>>(() => presetCache ?? {});
  useEffect(() => {
    if (presetCache) return;
    let cancelled = false;
    const out: Record<string, string> = {};
    const queue = GROUPS.flatMap((g) => g.presets.map((p) => [g, p] as const));
    const step = async () => {
      if (cancelled) return;
      try {
        for (const [group, preset] of queue.splice(0, 4)) {
          const canvas = await renderOffscreen(thumbState(group, preset), PRESET_PX, PRESET_PX, { time: 2.5, detail: 3 });
          out[preset.id] = canvas.toDataURL("image/jpeg", 0.88);
        }
      } catch (e) {
        console.error(e);
        return;
      }
      setThumbs({ ...out });
      if (queue.length) setTimeout(step, 16);
      else presetCache = out;
    };
    const start = setTimeout(step, 200);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, []);
  return thumbs;
}

/** The layer alone (over its group's usual backdrop), with its current settings. */
function layerThumbState(state: StudioState, key: SectionKey): StudioState {
  const thumb = emptyState(state.seed);
  const group = GROUPS.find((g) => g.section === key);
  for (const [k, values] of Object.entries(group?.thumbBase ?? {})) {
    const s = k as SectionKey;
    thumb.sections[s] = { ...thumb.sections[s], ...values, enabled: true };
  }
  thumb.sections[key] = { ...state.sections[key], enabled: true, layerOpacity: 1, layerBlend: "normal" };
  thumb.order = orderFromEnabled(thumb.sections);
  return thumb;
}

/** Live thumbnails for each layer, re-rendered shortly after edits settle. */
export function useLayerThumbs(state: StudioState, time: number) {
  const [thumbs, setThumbs] = useState<Partial<Record<SectionKey, string>>>({});
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const next: Partial<Record<SectionKey, string>> = {};
      for (const key of state.order) {
        if (key === "image") continue;
        try {
          const canvas = await renderOffscreen(layerThumbState(state, key), LAYER_PX, LAYER_PX, { time, detail: 3 });
          next[key] = canvas.toDataURL("image/jpeg", 0.85);
        } catch {
          return;
        }
      }
      if (!cancelled) setThumbs(next);
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [state, time]);
  return thumbs;
}
