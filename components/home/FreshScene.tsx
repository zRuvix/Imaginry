"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "@/components/icons";
import { stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { encodeShare } from "@/lib/studio/storage";
import { gsap, LIVE, useScene, Words } from "./scene";

/** Which card the camera starts inside. */
const FOCUS = 1;

function Card({ look, url, focus, late }: { look?: CuratedLook; url: string | null; focus?: boolean; late?: boolean }) {
  const cls = "card lift group relative block h-full overflow-hidden rounded-[18px] bg-[var(--surface)] lg:rounded-[22px]";
  const shell = `s3-card ${focus ? "s3-focus" : ""} ${late ? "max-md:hidden" : ""} min-h-0 max-lg:aspect-[10/9]`;
  const inner = (
    <>
      <span className="still-ground absolute inset-0 opacity-40" />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={look ? `${look.name}: ${look.recipe}` : ""} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {look && (
        <span className="absolute inset-x-2.5 bottom-2.5 flex translate-y-[calc(100%+12px)] items-center justify-between gap-3 rounded-full bg-black/55 py-1.5 pl-4 pr-1.5 backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0">
          <span className="truncate text-[14px] text-[var(--bone)]">Remix {look.name}</span>
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--bone)] text-[var(--ink)]">
            <ArrowUpRight size={13} />
          </span>
        </span>
      )}
    </>
  );
  // Until the designs are picked the card is a plain frame, not a dead link.
  return (
    <div className={shell}>
      {look ? (
        <Link href={`/studio#${encodeShare(stateForLook(look))}`} className={cls}>
          {inner}
        </Link>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </div>
  );
}

/**
 * Scene three, "the pullback": the stage opens inside one fresh render,
 * filling the screen. The camera pulls back at a steady rate (eased in log
 * space) until that render is one card in a grid of eight, the others lock
 * in around it and the heading arrives. Every card opens in the studio.
 */
export default function FreshScene({
  looks,
  urls,
  focusUrl,
}: {
  looks: CuratedLook[];
  urls: (string | null)[];
  /** A larger render of the focus card, sharp while it fills the screen. */
  focusUrl: string | null;
}) {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, LIVE, (el) => {
    const stage = el.querySelector<HTMLElement>(".stage")!;
    const grid = el.querySelector<HTMLElement>(".s3-grid")!;
    const focus = el.querySelector<HTMLElement>(".s3-focus")!;
    const m = { scale: 1, dx: 0, dy: 0 };
    const state = { e: 0 };

    // Layout offsets ignore transforms, so this is safe to call mid-scene.
    const measure = () => {
      let x = focus.offsetWidth / 2;
      let y = focus.offsetHeight / 2;
      gsap.set(grid, { transformOrigin: `${focus.offsetLeft + x}px ${focus.offsetTop + y}px` });
      for (let n: HTMLElement | null = focus; n && n !== stage; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      m.scale = Math.max(stage.clientWidth / focus.offsetWidth, stage.clientHeight / focus.offsetHeight) * 1.04;
      m.dx = stage.clientWidth / 2 - x;
      m.dy = stage.clientHeight / 2 - y;
    };
    const apply = () => {
      const k = Math.pow(m.scale, 1 - state.e);
      const f = m.scale > 1 ? (k - 1) / (m.scale - 1) : 0;
      gsap.set(grid, { scale: k, x: m.dx * f, y: m.dy * f });
    };
    measure();
    apply();

    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          onRefresh: () => {
            measure();
            apply();
          },
        },
      })
      .to(state, { e: 1, duration: 0.72, ease: "sine.inOut", onUpdate: apply }, 0)
      .from(
        ".s3-card:not(.s3-focus)",
        { autoAlpha: 0, scale: 0.78, duration: 0.24, stagger: { each: 0.018, from: FOCUS }, ease: "power2.out" },
        0.4,
      )
      .from(".s3-head > *", { autoAlpha: 0, y: 30, duration: 0.14, stagger: 0.04, ease: "power2.out" }, 0.72)
      .to({}, { duration: 0.06 });

    return () => gsap.set(grid, { clearProps: "transform,transformOrigin" });
  });

  return (
    <section ref={ref} id="fresh" className="scene" aria-labelledby="fresh-h">
      <div className="stage">
        <div className="wrap flex flex-col pb-[var(--padb)] pt-[var(--padt)] live:h-full">
          <div className="s3-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <h2 id="fresh-h" className="h2 text-[var(--bone)]">
              <Words scrub text="Fresh off the GPU" />
            </h2>
            <p className="max-w-[46ch] text-[16px] leading-[1.6] text-[var(--bone)]/65">
              Your browser drew every card here as this page loaded, each with a new seed. Pick one to open it in
              the studio, or{" "}
              <Link href="/gallery" className="ulink text-[var(--bone)]">
                see the gallery
              </Link>
              .
            </p>
          </div>

          <div className="s3-grid relative mt-8 grid min-h-0 flex-1 grid-cols-2 gap-3 md:grid-cols-4 lg:mt-10 lg:grid-rows-2 lg:gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Card
                key={i}
                look={looks[i]}
                url={i === FOCUS ? (focusUrl ?? urls[i] ?? null) : (urls[i] ?? null)}
                focus={i === FOCUS}
                late={i >= 6}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
