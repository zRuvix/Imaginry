"use client";

import { useRef } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import LiveFrame from "./LiveFrame";
import { gsap, LIVE, useScene, Words } from "./scene";

/**
 * Scene one, "fly into the shape": the live window stands alone on the
 * stage, then the camera flies into it until the texture is the whole screen
 * and a band of the page's ground rises across the foot with the statement.
 * At rest (phones, reduced motion) it is the finished composition, stacked.
 */
export default function LiveScene({ look }: { look?: CuratedLook }) {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, LIVE, (el) => {
    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.5 },
      })
      .fromTo(
        ".s1-world",
        { clipPath: "inset(25% 31% 23% 31% round 32px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 0.6, ease: "power2.inOut" },
        0,
      )
      .fromTo(".s1-canvas", { scale: 1.28 }, { scale: 1, duration: 0.6, ease: "power2.inOut" }, 0)
      .to(".s1-kicker", { autoAlpha: 0, y: -36, duration: 0.16 }, 0.06)
      .from(".s1-band", { yPercent: 101, duration: 0.2, ease: "power2.out" }, 0.62)
      .from(".s1-band .rv-i", { yPercent: 118, duration: 0.14, stagger: 0.012, ease: "power3.out" }, 0.7)
      .from(".s1-line", { autoAlpha: 0, y: 18, duration: 0.1 }, 0.86)
      .to({}, { duration: 0.04 });
  });

  return (
    <section ref={ref} id="live" className="scene" aria-labelledby="live-h">
      <div className="stage flex flex-col pt-[var(--padt)] live:block live:pt-0">
        <p className="s1-kicker wrap font-display text-[clamp(19px,2vw,28px)] tracking-[-0.025em] text-[var(--bone)] live:absolute live:inset-x-0 live:top-[13svh] live:z-10 live:text-center">
          Drawn live, right now, by your GPU
        </p>

        <div className="s1-world wrap mt-6 h-[52svh] live:absolute live:inset-0 live:mt-0 live:h-auto live:w-auto!">
          <LiveFrame
            look={look}
            className="relative h-full w-full rounded-[24px] live:rounded-none"
            canvasClass="s1-canvas"
            controlClass="right-4 top-4 live:right-[var(--gut)] live:top-[calc(var(--nav)+16px)]"
          />
        </div>

        <div className="s1-band bg-[var(--ink)] py-9 live:absolute live:inset-x-0 live:bottom-0 live:z-10 live:py-11">
          <div className="wrap grid items-end gap-5 lg:grid-cols-12 lg:gap-6">
            <h2 id="live-h" className="h2 text-[var(--bone)] lg:col-span-8">
              <Words scrub text="No stock. No AI. Just light, glass and grain." />
            </h2>
            <p className="s1-line max-w-[44ch] text-[16px] leading-[1.6] text-[var(--bone)]/65 lg:col-span-4">
              Every pixel on this page is computed in this tab by hand-written shader code. There is no model, no
              prompt and no stock library behind it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
