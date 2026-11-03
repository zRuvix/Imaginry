"use client";

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import { MaskLines, Marker, useScrollRange } from "./kit";

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

/** Where in the pinned scroll each layer has finished landing. */
const landsAt = (i: number, n: number) => 0.08 + (i / (n - 1)) * 0.72;

/** One plate, wiped on from the bottom by a glowing scan line. */
function Plate({ p, i, n, url, alt }: { p: MotionValue<number>; i: number; n: number; url: string | null; alt: string }) {
  const end = landsAt(i, n);
  const k = useTransform(p, [end - 0.16, end], i === 0 ? [1, 1] : [0, 1]);
  const clipPath = useTransform(k, (v) => `inset(${(1 - v) * 100}% 0 0 0)`);
  const lineTop = useTransform(k, (v) => `${(1 - v) * 100}%`);
  const lineOpacity = useTransform(k, (v) => (v > 0.01 && v < 0.99 ? 1 : 0));
  return (
    <>
      <motion.div className="absolute inset-0" style={{ clipPath }}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} className="h-full w-full object-cover" />
        )}
      </motion.div>
      {i > 0 && (
        <motion.span
          aria-hidden
          className="absolute inset-x-0 h-[2px] -translate-y-1/2 bg-[var(--bone)] shadow-[0_0_24px_6px_rgba(255,90,44,0.65)]"
          style={{ top: lineTop, opacity: lineOpacity }}
        />
      )}
    </>
  );
}

/**
 * How it works, as a recipe: a pinned plate gains one layer at a time while
 * the steps on the left tick through, each new layer scanning on over the last.
 */
export default function Recipe({ looks = STORY, urls }: { looks?: CuratedLook[]; urls: (string | null)[] }) {
  const ref = useRef<HTMLElement>(null);
  const n = looks.length;
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    let a = 0;
    for (let i = 0; i < n; i++) if (v >= landsAt(i, n) - 0.08) a = i;
    setActive(a);
  });

  const rail = useScrollRange(p, [0.02, landsAt(n - 1, n)], [0, 1]);
  const tilt = useScrollRange(p, [0, 0.85], [-4, 0]);
  const plateScale = useScrollRange(p, [0, 0.12, 0.85, 1], [0.9, 1, 1, 0.96]);
  const caption = useScrollRange(p, [0.84, 0.92], [0, 1]);

  return (
    <section id="how" ref={ref} className="relative h-[380vh]">
      <div className="sticky top-0 mx-auto grid h-[100svh] max-w-[1400px] grid-rows-[auto_1fr_auto] gap-6 px-4 pb-[5svh] pt-[11svh] md:grid-cols-12 md:grid-rows-1 md:items-center md:gap-8 md:px-8 md:py-0">
        <div className="md:col-span-5">
          <Marker n="02">How it works</Marker>
          <h2 className="mt-4 font-display text-[clamp(34px,5vw,84px)] leading-[0.95] tracking-[-0.035em] text-[var(--bone)]">
            <MaskLines lines={["Built in", "layers"]} />
          </h2>
          <p className="mt-5 max-w-[400px] text-[15.5px] leading-relaxed text-[var(--bone)]/60">
            Every design is a stack of effects. Each one works on everything beneath it.
          </p>

          {/* The steps, with a rail that fills as the stack grows */}
          <div className="relative mt-10 hidden pl-6 md:block">
            <span className="absolute bottom-2 left-0 top-2 w-px bg-white/10" />
            <motion.span
              className="absolute bottom-2 left-0 top-2 w-px origin-top bg-[var(--ember)]"
              style={{ scaleY: rail }}
            />
            <ol className="space-y-1">
              {looks.map((s, i) => (
                <li
                  key={i}
                  className={`flex items-baseline gap-4 py-2 transition-all duration-700 ${
                    i <= active ? "text-[var(--bone)]" : "text-[var(--bone)]/25"
                  } ${i === active ? "translate-x-2" : ""}`}
                >
                  <span className="font-condensed text-[15px] text-[var(--dim)]">0{i + 1}</span>
                  <span className="font-display text-[clamp(20px,1.8vw,28px)] tracking-[-0.02em]">{s.name}</span>
                  <span
                    className={`font-condensed text-[15px] text-[var(--dim)] transition-opacity duration-700 ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {s.recipe}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex min-h-0 items-center justify-center md:col-span-7">
          <motion.div
            className="relative aspect-[4/3] max-h-full w-full max-w-[760px] overflow-hidden rounded-[22px] bg-[var(--surface)] shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95)] md:rounded-[30px]"
            style={{ rotate: tilt, scale: plateScale }}
          >
            {looks.map((s, i) => (
              <Plate key={i} p={p} i={i} n={n} url={urls[i]} alt={`${s.name}: ${s.recipe}`} />
            ))}
            {/* Which layer just landed */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3.5 py-1.5 font-condensed text-[14px] text-[var(--bone)] backdrop-blur-md md:left-5 md:top-5">
              <span className="size-1.5 rounded-full bg-[var(--ember)]" />
              {active === 0 ? "Gradient" : `+ ${looks[active].name}`}
              <span className="text-[var(--bone)]/50">
                {active + 1}/{n}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Phones: the active step under the plate */}
        <div className="md:hidden">
          <div className="flex gap-1.5">
            {looks.map((_, i) => (
              <span
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
                  i <= active ? "bg-[var(--ember)]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <p className="mt-4 font-display text-[22px] tracking-[-0.02em] text-[var(--bone)]">{looks[active].name}</p>
          <p className="mt-1 font-condensed text-[15px] text-[var(--dim)]">{looks[active].recipe}</p>
        </div>

        <motion.p
          style={{ opacity: caption }}
          className="pointer-events-none absolute bottom-[5svh] right-4 hidden max-w-[300px] text-right font-condensed text-[15px] text-[var(--bone)]/60 md:right-8 md:block"
        >
          {n} layers, one image. Reorder them in the studio and the result changes.
        </motion.p>
      </div>
    </section>
  );
}
