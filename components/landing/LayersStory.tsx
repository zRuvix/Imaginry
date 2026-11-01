"use client";

import { useRef } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import { clamp01, useSmoothProgress } from "./motion";

type Layer = { id: string; name: string; recipe: string };

const GRADIENTS = ["g-ember", "g-sunset", "g-violet", "g-magenta", "g-teal", "g-spectrum", "g-gold", "g-ice"];
const GLASS: Layer[] = [
  { id: "gl-fluted", name: "Fluted glass", recipe: "Bends what's below" },
  { id: "gl-grid", name: "Grid glass", recipe: "Tiles what's below" },
  { id: "gl-frosted", name: "Frosted glass", recipe: "Softens what's below" },
  { id: "gl-rings", name: "Ring glass", recipe: "Ripples what's below" },
  { id: "gl-wavy", name: "Wavy glass", recipe: "Warps what's below" },
  { id: "gl-lens", name: "Lens glass", recipe: "Magnifies what's below" },
];
const OPTICS: Layer[] = [
  { id: "o-subtle", name: "Optics", recipe: "Aberration and glow" },
  { id: "o-prism", name: "Prism", recipe: "Splits the color" },
  { id: "o-dream", name: "Dream", recipe: "Soft glow and vignette" },
];
const GRAIN: Layer[] = [
  { id: "gr-fine", name: "Fine grain", recipe: "A light tooth" },
  { id: "gr-film", name: "Film grain", recipe: "The finishing tooth" },
  { id: "gr-heavy", name: "Heavy grain", recipe: "Rough and analog" },
];

/** Cumulative renders: each plate is the design with one more layer on. */
export function makeStory(gradient: string, layers: Layer[], seed: number): CuratedLook[] {
  const plates = [{ id: gradient, name: "Gradient", recipe: "The color underneath" }, ...layers];
  return plates.map((l, i) => ({
    name: l.name,
    recipe: l.recipe,
    presets: plates.slice(0, i + 1).map((p) => p.id),
    seed,
    ratio: 4 / 3,
  }));
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** A different gradient, glass, optics and grain every page load. */
export function randomStory(): CuratedLook[] {
  return makeStory(pick(GRADIENTS), [pick(GLASS), pick(OPTICS), pick(GRAIN)], Math.random() * 100);
}

export const STORY = makeStory("g-ember", [GLASS[0], OPTICS[0], GRAIN[1]], 12.5);

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A pinned "exploded view": the design starts as four floating plates, one
 * per layer, and scrolling presses them together into the finished image.
 */
export default function LayersStory({ looks = STORY, urls }: { looks?: CuratedLook[]; urls: (string | null)[] }) {
  const outer = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const plates = useRef<(HTMLDivElement | null)[]>([]);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const pills = useRef<(HTMLSpanElement | null)[]>([]);
  const caption = useRef<HTMLParagraphElement>(null);
  const shadow = useRef<HTMLDivElement>(null);

  // One smoothed number drives the whole scene, measured in viewport heights
  // since the section started arriving: 0..1 is the arrival, then the pin.
  useSmoothProgress(
    outer,
    (rect, vh) => Math.max(0, (vh - rect.top) / vh),
    (v) => {
      const el = outer.current;
      if (!el) return;
      const vh = window.innerHeight;
      const pinned = Math.max(1, el.offsetHeight / vh - 1);
      const p = clamp01((v - 1) / pinned);
      const enter = clamp01(v);
      const merge = easeInOut(clamp01((p - 0.14) / 0.6)); // 0 exploded → 1 pressed flat
      const n = looks.length;
      const gap = Math.min(window.innerWidth * 0.085, 96);

      if (stack.current) {
        // No opacity here: fading a preserve-3d element flattens it.
        const tiltX = 56 * (1 - merge);
        const tiltZ = -28 * (1 - merge);
        const scale = 0.72 + 0.28 * merge;
        stack.current.style.transform = `translate3d(0, ${(1 - easeInOut(enter)) * 10 + (1 - merge) * 5}vh, 0) rotateX(${tiltX}deg) rotateZ(${tiltZ}deg) scale(${scale})`;
      }
      plates.current.forEach((plate, i) => {
        if (!plate) return;
        // Plates fly in bottom first, each from further below.
        const arrive = easeInOut(clamp01(enter * 1.7 - 0.25 - i * 0.16));
        // Spread around the middle; a hair of z on each keeps the top one on top when flat.
        const z = (i - (n - 1) / 2) * gap * (1 - merge) + i * 0.6 - (1 - arrive) * 260;
        plate.style.transform = `translate3d(0, ${(1 - arrive) * 220}px, ${z}px)`;
        plate.style.opacity = String(arrive);
      });
      labels.current.forEach((label, i) => {
        if (!label) return;
        const show = clamp01((enter - 0.55 - i * 0.1) / 0.3) * (1 - clamp01((merge - 0.5) / 0.3));
        label.style.opacity = String(show);
        label.style.transform = `translateX(${(1 - show) * -24}px)`;
      });
      // Pills light up as each plate settles into the stack, top to bottom.
      pills.current.forEach((pill, i) => {
        if (!pill) return;
        const on = merge >= (n - 1 - i) / n + 0.08 || merge > 0.98;
        pill.dataset.on = on ? "1" : "0";
      });
      if (caption.current) {
        const c = clamp01((p - 0.78) / 0.14);
        caption.current.style.opacity = String(c);
        caption.current.style.transform = `translateY(${(1 - c) * 18}px)`;
      }
      if (shadow.current) shadow.current.style.opacity = String((0.2 + merge * 0.5) * enter);
    },
  );

  return (
    <section id="how" ref={outer} className="relative h-[340vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center overflow-hidden px-4 pt-[11svh] md:px-6">
        <div className="relative z-10 text-center">
          <p className="font-condensed text-[15px] font-medium text-[var(--ember)]">How it works</p>
          <h2 className="mt-3 font-display text-[clamp(30px,4.4vw,60px)] leading-[1] tracking-[-0.025em] text-[var(--bone)]">
            Built in layers
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-[var(--bone)]/55">
            Every design is a stack you can pull apart. Scroll to press it back together.
          </p>
        </div>

        <div className="relative flex w-full flex-1 items-center justify-center" style={{ perspective: "1800px" }}>
          <div
            ref={shadow}
            aria-hidden
            className="absolute left-1/2 top-[60%] h-[30%] w-[min(560px,70vw)] -translate-x-1/2 rounded-full bg-[var(--ember)] opacity-25 blur-[90px]"
          />
          <div
            ref={stack}
            className="relative aspect-[4/3] w-[min(520px,72vw,58svh)] will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {looks.map((s, i) => (
              <div
                key={i}
                ref={(el) => {
                  plates.current[i] = el;
                }}
                className="absolute inset-0 will-change-transform"
                style={{ opacity: 0 }}
              >
                <div className="h-full w-full overflow-hidden rounded-[22px] bg-[var(--surface)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/15">
                  {urls[i] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[i]!} alt={`${s.name}: ${s.recipe}`} className="h-full w-full object-cover" />
                  )}
                </div>
                {/* Label rides on the plate's own plane, off its right edge */}
                <div
                  ref={(el) => {
                    labels.current[i] = el;
                  }}
                  className="absolute left-[calc(100%+20px)] top-1/2 hidden -translate-y-1/2 items-center gap-3 whitespace-nowrap sm:flex"
                >
                  <span className="h-px w-14 bg-[var(--bone)]/40" />
                  <span className="font-condensed text-[22px] font-medium text-[var(--bone)]">
                    <span className="mr-2 text-[var(--dim)]">{String(i + 1).padStart(2, "0")}</span>
                    {s.name}
                    <span className="ml-2 text-[var(--dim)]">{s.recipe}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 pb-[7svh]">
          <div className="flex flex-wrap justify-center gap-2">
            {looks.map((s, i) => (
              <span
                key={i}
                ref={(el) => {
                  pills.current[i] = el;
                }}
                data-on="0"
                className="rounded-full bg-white/[0.06] px-3.5 py-1.5 font-condensed text-[14px] text-[var(--bone)]/45 transition-all duration-700 data-[on=1]:bg-[var(--bone)] data-[on=1]:text-[var(--ink)]"
              >
                {s.name}
              </span>
            ))}
          </div>
          <p ref={caption} className="font-condensed text-[15px] text-[var(--bone)]/60" style={{ opacity: 0 }}>
            Four layers, one image. Reorder them in the studio and the result changes.
          </p>
        </div>
      </div>
    </section>
  );
}
