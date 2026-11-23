"use client";

import { useEffect, useState } from "react";
import { renderOffscreen } from "@/lib/studio/renderer";
import { SCHEMA_BY_KEY } from "@/lib/studio/schema";
import { isInteractive, LAB_LOOKS, stateForLabLook, type LabLook } from "@/lib/lab/looks";

type Props = {
  current: string | null;
  onPick: (look: LabLook) => void;
};

/** Thumbnails render without the live simulation, so fluid looks get painted ink swirls instead. */
function inkPreview(colors: string[]) {
  const c = document.createElement("canvas");
  c.width = 264;
  c.height = 168;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = "blur(10px)";
  const list = colors.length ? colors : ["#ffffff"];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const x = 132 + Math.cos(a * 1.3) * 80;
    const y = 84 + Math.sin(a * 2) * 40;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 46);
    g.addColorStop(0, list[i % list.length]);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(x, y, 60, 26, a, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

// Looks never change, so their thumbnails render once per page load.
let cache: Record<string, string> | null = null;

function useLookThumbs() {
  const [thumbs, setThumbs] = useState<Record<string, string>>(() => cache ?? {});
  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    const out: Record<string, string> = {};
    (async () => {
      for (const look of LAB_LOOKS) {
        if (cancelled) return;
        const state = stateForLabLook(look);
        const image = look.layers.some((l) => l.key === "fluid") ? inkPreview(state.sections.fluid.colors as string[]) : null;
        const canvas = await renderOffscreen(state, 264, 168, { time: 3, detail: 1.5, image });
        out[look.id] = canvas.toDataURL("image/jpeg", 0.86);
        if (!cancelled) setThumbs({ ...out });
        // Let the canvas breathe between renders.
        await new Promise((r) => setTimeout(r, 16));
      }
      cache = out;
    })().catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, []);
  return thumbs;
}

export default function LooksPanel({ current, onPick }: Props) {
  const thumbs = useLookThumbs();
  return (
    <div className="scroll-thin h-full overflow-y-auto p-3">
      <header className="anim-rise px-1 pb-3 pt-1">
        <h2 className="font-display text-[20px] leading-none tracking-[-0.02em] text-bone">Backgrounds</h2>
        <p className="mt-1.5 text-[12.5px] leading-snug text-bone/50">Made for the Lab. Pick one, then tune it.</p>
      </header>
      <div className="grid grid-cols-2 gap-2">
        {LAB_LOOKS.map((look, i) => {
          const active = look.id === current;
          const style = SCHEMA_BY_KEY[look.layers[0].key].label;
          return (
            <button
              key={look.id}
              type="button"
              onClick={() => onPick(look)}
              aria-pressed={active}
              className="press anim-rise group text-left"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span
                className={`relative block aspect-[264/168] overflow-hidden rounded-[14px] bg-surface transition-shadow duration-300 ${
                  active ? "ring-2 ring-ember ring-offset-2 ring-offset-[#1a1815]" : ""
                }`}
              >
                {thumbs[look.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[look.id]} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                ) : (
                  <span className="skeleton block size-full" />
                )}
                {isInteractive(look) && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-ink/70 px-1.5 py-0.5 text-[10.5px] text-bone/85 backdrop-blur">Cursor</span>
                )}
              </span>
              <span className="mt-1.5 block truncate px-0.5 text-[13px] font-medium text-bone">{look.name}</span>
              <span className="block truncate px-0.5 text-[11.5px] text-bone/45">
                {style} · {look.note}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
