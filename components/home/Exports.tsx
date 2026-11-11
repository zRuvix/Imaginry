"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import LiveFrame from "./LiveFrame";
import { gsap, LIVE, useScene, Words } from "./scene";

const SNIPPET = `import ImaginryLook from "./ImaginryLook";

export default function Hero() {
  return (
    <section className="relative h-screen">
      <ImaginryLook animate speed={0.8} />
      <h1>Hello, world</h1>
    </section>
  );
}`;

const RATIOS: [string, number][] = [
  ["1:1", 1],
  ["4:5", 4 / 5],
  ["16:9", 16 / 9],
  ["9:16", 9 / 16],
  ["21:9", 21 / 9],
];

const FORMATS = ["PNG", "MP4", "WebM", "AV1", "React", "Framer", "HTML"];

/** Counts up every `ms` while the element is on screen and motion is welcome. */
function useTicker(ref: React.RefObject<HTMLElement | null>, ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (entry.isIntersecting) timer = window.setInterval(() => setTick((n) => n + 1), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [ref, ms]);
  return tick;
}

/** One frame that steps through every export ratio, a new still each time. */
function Ratios({ stills }: { stills: (string | null)[] }) {
  const box = useRef<HTMLDivElement>(null);
  const tick = useTicker(box, 3200);
  const [area, setArea] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const i = tick % RATIOS.length;
  const ratio = RATIOS[i][1];
  const w = Math.min(area.w * 0.78, (area.h - 64) * 0.86 * ratio) || 180;
  const shown = stills.filter(Boolean) as string[];

  return (
    <div ref={box} className="absolute inset-0 flex flex-col items-center justify-center gap-4 pb-2">
      <div
        className="still-ground relative overflow-hidden rounded-[14px] ring-1 ring-white/15 transition-[width,height] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: w, height: w / ratio }}
      >
        {shown.map((src, j) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: j === tick % shown.length ? 1 : 0 }}
          />
        ))}
      </div>
      <ul aria-label="Export ratios" className="flex gap-1">
        {RATIOS.map(([label], j) => (
          <li
            key={label}
            className={`rounded-full px-2.5 py-1 text-[13px] transition-colors duration-500 ${
              j === i ? "bg-[var(--bone)] text-[var(--ink)]" : "text-[var(--bone)]/60"
            }`}
          >
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <article className="x-card card flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-[var(--raised)]">
      <div className="relative min-h-[240px] flex-1 overflow-hidden bg-[var(--ink)]">{children}</div>
      <div className="p-6">
        <h3 className="font-display text-[20px] leading-[1.15] tracking-[-0.025em] text-[var(--bone)]">{title}</h3>
        <p className="mt-2 text-[15px] leading-[1.55] text-[var(--bone)]/65">{body}</p>
      </div>
    </article>
  );
}

/**
 * The export story as three cards. On the way in they fan out of one stack
 * into the grid, scrubbed with the scroll; each card then runs its own small
 * loop (a ratio change, a seamless loop, a caret).
 */
export default function Exports({ stills, loop }: { stills: (string | null)[]; loop?: CuratedLook }) {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, LIVE, (el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".x-card", el);
    const mid = (cards.length - 1) / 2;
    gsap
      .timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: { trigger: el, start: "top 82%", end: "top 18%", scrub: true },
      })
      .from(cards, {
        xPercent: (i) => (mid - i) * 96,
        y: 140,
        rotation: (i) => (i - mid) * 5,
        scale: 0.86,
        stagger: { each: 0.06, from: "center" },
      })
      .from(".x-formats > *", { autoAlpha: 0, y: 16, stagger: 0.05, duration: 0.3 }, 0.45);
  });

  return (
    <section
      ref={ref}
      id="export"
      className="[--h:1] max-md:[--h:2]"
      style={{ background: "var(--surface)" } as CSSProperties}
      aria-labelledby="export-h"
    >
      <div className="wrap flex flex-col lg:h-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <h2 id="export-h" className="h2 text-[var(--bone)]">
            <Words text="Export stills, loops and embeds" />
          </h2>
          <p data-rise className="max-w-[34ch] text-[16px] leading-[1.6] text-[var(--bone)]/65">
            Every format is free, with no watermark and no account.
          </p>
        </div>

        <div className="mt-8 grid min-h-0 flex-1 gap-4 md:grid-cols-3 lg:mt-10 lg:gap-6">
          <Card title="Save a PNG up to 4K" body="Any ratio, from square to ultra-wide, rendered straight from the shader and never upscaled.">
            <Ratios stills={stills} />
          </Card>
          <Card title="Record a seamless loop" body="MP4, WebM or AV1, rendered frame by frame. The end fades into the start, so it never jumps.">
            <LiveFrame look={loop} className="absolute inset-0" speed={1} resolution={0.7} controlClass="right-3 top-3" />
            <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-black/60 p-3.5 backdrop-blur-md">
              <div className="mb-2 flex justify-between text-[13px] text-[var(--bone)]">
                <span>0 s</span>
                <span>6 s</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/15">
                <span className="absolute inset-y-0 right-0 w-[18%] bg-gradient-to-r from-transparent to-[var(--ember)]/80" />
                <span className="loop-head absolute inset-y-0 left-0 w-1 rounded-full bg-[var(--bone)]" />
              </div>
            </div>
          </Card>
          <Card title="Paste a 20 kB embed" body="One self-contained file for React, Framer or plain HTML that keeps drawing on your visitor’s GPU.">
            <pre className="absolute inset-0 overflow-hidden whitespace-pre p-5 font-mono text-[12px] leading-[1.75] text-[var(--bone)]/90">
              {SNIPPET}
              <span aria-hidden className="caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--ember)]" />
            </pre>
          </Card>
        </div>

        <ul aria-label="Export formats" className="x-formats mt-6 flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <li key={f} className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[14px] text-[var(--bone)]/80">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
