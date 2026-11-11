"use client";

import { useRef } from "react";
import { Layers } from "@/components/icons";
import type { CuratedLook } from "@/lib/studio/looks";
import { gsap, LIVE, useScene, Words } from "./scene";

type Layer = { id: string; name: string; recipe: string };

const GRADIENTS = ["g-ember", "g-sunset", "g-violet", "g-magenta", "g-teal", "g-spectrum", "g-gold", "g-ice"];
const GLASS: Layer[] = [
  { id: "gl-fluted", name: "Fluted glass", recipe: "Bends what is below" },
  { id: "gl-grid", name: "Grid glass", recipe: "Tiles what is below" },
  { id: "gl-frosted", name: "Frosted glass", recipe: "Softens what is below" },
  { id: "gl-rings", name: "Ring glass", recipe: "Ripples what is below" },
  { id: "gl-wavy", name: "Wavy glass", recipe: "Warps what is below" },
  { id: "gl-lens", name: "Lens glass", recipe: "Magnifies what is below" },
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
function makeStory(gradient: string, layers: Layer[], seed: number): CuratedLook[] {
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

/** The stack named before a random one is picked, so the markup is stable. */
export const STORY = makeStory("g-ember", [GLASS[0], OPTICS[0], GRAIN[1]], 12.5);

/**
 * Scene two, "the product assembles": the studio's own window builds a
 * design one layer at a time while the page is held. Each layer wipes onto
 * the plate behind a scan line as its row slides into the layer dock, lit in
 * ember for a beat, and its step takes the ink in the list beside it.
 */
export default function LayersScene({ looks = STORY, urls }: { looks?: CuratedLook[]; urls: (string | null)[] }) {
  const ref = useRef<HTMLElement>(null);
  const n = looks.length;

  useScene(ref, LIVE, (el) => {
    const q = gsap.utils.selector(el);
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.5 },
    });
    tl.fromTo(".s2-glow", { opacity: 0.06 }, { opacity: 0.25, duration: 0.9 }, 0);
    tl.fromTo(".s2-frame", { scale: 0.93, y: 28 }, { scale: 1, y: 0, duration: 0.86, ease: "power1.out" }, 0);
    const plates = q(".s2-plate");
    const lines = q(".s2-scan");
    const rows = q(".s2-row");
    const steps = q(".s2-step");
    for (let i = 1; i < n; i++) {
      const at = 0.1 + (i - 1) * 0.24;
      tl.fromTo(plates[i], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2 }, at)
        .fromTo(lines[i], { top: "100%", autoAlpha: 1 }, { top: "0%", duration: 0.2 }, at)
        .to(lines[i], { autoAlpha: 0, duration: 0.02 }, at + 0.2)
        .from(rows[i], { y: 44, autoAlpha: 0, duration: 0.1, ease: "power2.out" }, at)
        .fromTo(
          rows[i],
          { backgroundColor: "#ff5a2c", color: "#0d0c0b" },
          { backgroundColor: "rgba(237,231,220,0.06)", color: "#ede7dc", duration: 0.1 },
          at + 0.12,
        )
        .from(steps[i], { opacity: 0.25, duration: 0.08 }, at);
    }
    tl.to({}, { duration: 0.1 });
    // Rebuilt once the finished plate exists, so the glow behind the stage joins the timeline.
  }, [Boolean(urls[n - 1])]);

  return (
    <section ref={ref} id="layers" className="scene" aria-labelledby="layers-h">
      <div className="stage relative overflow-hidden">
        {/* The stage takes on the color of the design as it is built. */}
        {urls[n - 1] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urls[n - 1]!}
            alt=""
            aria-hidden
            className="s2-glow pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-[90px]"
          />
        )}
        <div className="wrap relative grid gap-8 pb-[var(--padb)] pt-[var(--padt)] lg:h-full lg:grid-cols-12 lg:items-center lg:gap-6 lg:pb-0 lg:pt-[var(--nav)]">
          <div className="lg:col-span-4">
            <h2 id="layers-h" className="h2 text-[var(--bone)]">
              <Words text="Built in layers" />
            </h2>
            <p data-rise className="lead mt-4 max-w-[36ch]">
              Every design is a stack of shader effects. Each one works on everything beneath it, so the order
              changes the picture.
            </p>
            <ol className="mt-9 hidden border-t border-white/10 lg:block">
              {looks.map((s, i) => (
                <li key={i} className="s2-step flex items-baseline justify-between gap-4 border-b border-white/10 py-4">
                  <span className="font-display text-[21px] tracking-[-0.025em] text-[var(--bone)]">{s.name}</span>
                  <span className="text-right text-[14px] text-[var(--dim)]">{s.recipe}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* The studio's own window */}
          <div className="s2-frame frame overflow-hidden rounded-[22px] bg-[var(--surface)] ring-1 ring-white/10 lg:col-span-8">
            <div className="flex h-10 items-center gap-1.5 px-4">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="mx-auto rounded-full bg-white/[0.05] px-4 py-0.5 text-[13px] text-[var(--dim)]">
                imaginry.tech/studio
              </span>
              <span className="w-[42px]" />
            </div>
            <div className="grid gap-3 p-3 pt-0 md:grid-cols-[1fr_200px]">
              <div className="still-ground relative aspect-[4/3] overflow-hidden rounded-[14px]">
                {looks.map((s, i) => (
                  <div key={i} className="s2-plate absolute inset-0">
                    {urls[i] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls[i]!} alt={i === n - 1 ? `A design made of ${n} layers` : ""} className="h-full w-full object-cover" />
                    )}
                    <span
                      aria-hidden
                      className="s2-scan invisible absolute inset-x-0 top-0 h-[2px] -translate-y-1/2 bg-[var(--bone)] shadow-[0_0_24px_6px_rgba(255,90,44,0.65)]"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col rounded-[14px] bg-black/30 p-3">
                <p className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[var(--bone)]/60">
                  <Layers size={14} /> Layers
                </p>
                {/* Newest on top, as in the studio's dock */}
                <ul className="grid grid-cols-2 gap-1.5 md:flex md:flex-col-reverse md:justify-end">
                  {looks.map((s, i) => (
                    <li
                      key={i}
                      className="s2-row flex items-center gap-2.5 rounded-[10px] bg-[rgba(237,231,220,0.06)] px-3 py-2.5 text-[14px] text-[var(--bone)]"
                    >
                      <span aria-hidden className="size-2 shrink-0 rounded-full bg-[var(--ember)]" />
                      <span className="truncate">{s.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
