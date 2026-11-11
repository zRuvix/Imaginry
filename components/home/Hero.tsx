"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import LaunchButton from "@/components/landing/LaunchButton";
import type { CuratedLook } from "@/lib/studio/looks";
import LiveFrame from "./LiveFrame";
import { gsap, MOTION, useScene, Words } from "./scene";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * The first screen: the claim, what the product is, the one action, and a
 * live window that takes the rest of the screen. Scrolling on eases the words
 * away and pushes into the window, which the next scene then opens fully.
 */
export default function Hero({ look }: { look?: CuratedLook }) {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, MOTION, (el) => {
    gsap
      .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } })
      .to(".hero-copy", { yPercent: -14, autoAlpha: 0 }, 0)
      .to(".hero-canvas", { scale: 1.12 }, 0);
  });

  return (
    <section ref={ref} id="top" className="hero flex flex-col !pb-0" style={{ "--h": 1 } as CSSProperties}>
      <div className="wrap flex min-h-0 flex-1 flex-col items-center text-center">
        <div className="hero-copy flex flex-col items-center">
          <p
            data-rise
            className="inline-flex h-8 items-center gap-2 rounded-full bg-white/[0.07] px-4 text-[14px] text-[var(--bone)]/80"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--ember)]" />
            Free · No AI · Nothing uploaded
          </p>
          <h1 className="h1 mt-4 max-w-[17ch] text-[var(--bone)]">
            <Words text="Textures that didn’t exist a minute ago." delay={120} />
          </h1>
          <p data-rise style={d(520)} className="hero__lead lead mt-4 max-w-[58ch]">
            Imaginry is a free abstract background maker. Stack hand-written shader effects into stills up to 4K,
            looping video or a 20 kB embed, all drawn by your own GPU.
          </p>
          <div data-rise style={d(640)} className="btn-row mt-7 flex flex-wrap items-center justify-center gap-3">
            <LaunchButton
              className="btn cta-live h-[52px] pl-5 pr-6 text-[16px] bg-[var(--bone)] text-[var(--ink)] hover:bg-white"
              iconSize={17}
            />
            <Link href="/gallery" className="btn btn-ghost h-[52px] px-6 text-[16px]">
              See the gallery
            </Link>
          </div>
        </div>

        {/* The live window: whatever is left of the first screen, fading into the ground at its foot. */}
        <div
          data-rise
          style={{
            ...d(760),
            maskImage: "linear-gradient(to bottom, black 78%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent)",
          }}
          className="relative mt-8 min-h-[280px] w-full flex-1"
        >
          <LiveFrame
            look={look}
            className="absolute inset-0 rounded-t-[28px]"
            canvasClass="hero-canvas"
            controlClass="right-4 top-4"
          />
        </div>
      </div>
    </section>
  );
}
