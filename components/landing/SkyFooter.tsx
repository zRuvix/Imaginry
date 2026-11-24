"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { LEGAL_PAGES } from "@/lib/legal";

/** Panorama of sky over a low grassy rise; 2000×667 (3:1). */
const PHOTO = "/landing/footer.webp";

/**
 * Alpha mask of the photo's grass (and rock), cut pixel by pixel from the photo
 * itself, blade tips included, so no sky ever lies over the wordmark.
 */
const GRASS_MASK = 'url("/landing/footer-grass-mask.png")';

const WORD = "imaginry";

const COLUMNS = [
  {
    title: "Make",
    links: [
      { label: "Studio", href: "/studio" },
      { label: "Explore", href: "/explore" },
      { label: "Agents", href: "/#agents" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  { title: "Legal", links: LEGAL_PAGES },
  {
    title: "Follow",
    links: [
      { label: "X / Twitter", href: "https://x.com/zRuvix1" },
      { label: "Sponsor", href: "/sponsor" },
    ],
  },
];

/**
 * Last screen of the site. As it scrolls in, the hill swells up into frame
 * and a giant wordmark climbs out from behind the grass one letter at a time.
 */
export default function SkyFooter() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end end"] });

  // The photo only slides up into place; it is never scaled or cropped.
  const sceneY = useTransform(p, [0, 1], ["14%", "0%"]);
  const topOpacity = useTransform(p, [0.45, 0.85], [0, 1]);
  const topY = useTransform(p, [0.45, 0.85], [30, 0]);

  return (
    <footer ref={ref} className="relative px-2 pb-2">
      {/* Above the photo, the panel continues its top-edge sky colour so the join is invisible */}
      <div className="relative flex min-h-[calc(100svh-16px)] flex-col overflow-clip rounded-[24px] bg-[linear-gradient(90deg,#cbdef5,#c2d9f1_50%,#b9d2ee)] sm:rounded-[28px]">
        {/* Top: closing line, CTA, links */}
        <motion.div
          // Opacity goes through a CSS variable: motion's native scroll-linked opacity ends stuck at 0 here.
          style={{ ["--o" as string]: topOpacity, y: topY }}
          className="relative z-10 grid opacity-(--o) gap-8 px-5 pt-[clamp(2rem,7svh,5rem)] sm:px-8 lg:grid-cols-[1.2fr_1fr] xl:px-10"
        >
          <div>
            <h2 className="font-lexend text-[clamp(2rem,min(4.2vw,8svh),5rem)] font-light leading-[1.02] tracking-[-0.045em] text-[#121416]">
              Your next background
              <br />
              is one tab away
            </h2>
            <Link
              href="/studio"
              className="blue-button blue-button-large mt-6"
            >
              Open studio
            </Link>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-3 gap-4 lg:justify-self-end lg:gap-12">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="font-outfit text-[12px] text-[#4f5b66] xl:text-[13px]">{c.title}</p>
                <ul className="mt-3 space-y-2">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="font-outfit text-[14px] text-[#121416] underline-offset-4 transition-opacity hover:underline xl:text-[15.5px]"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </motion.div>

        {/* Desktop: the whole panorama at 3:1. Below lg the strip would be a sliver, so it takes a share of the screen and crops only its sides, keeping the flat middle of the hill. Photo and grass cut-out move as one. */}
        <motion.div style={{ y: sceneY }} className="relative mt-auto h-[clamp(260px,46svh,520px)] w-full lg:aspect-[3/1] lg:h-auto">
          {/* Top edge feathered into the panel's sky so a cropped photo shows no seam */}
          <Image
            src={PHOTO}
            alt=""
            fill
            sizes="(max-width: 1023px) 150svh, 100vw"
            className="object-cover object-bottom [mask-image:linear-gradient(to_bottom,transparent,black_20%)]"
          />

          {/* Wordmark, behind the grass */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-[9%] flex justify-center overflow-hidden pt-[0.1em] font-lexend text-[24vw] lg:text-[clamp(4.5rem,min(21vw,calc(var(--frame)*0.21)),24rem)] font-light leading-[0.8] tracking-[-0.07em] text-[#121416]"
          >
            {WORD.split("").map((ch, i) => (
              <Letter key={i} ch={ch} i={i} p={p} />
            ))}
          </div>

          <div
            aria-hidden
            className="absolute inset-0"
            // The mask crops exactly like the photo under it (cover, same anchor) so the edges stay aligned.
            style={{ maskImage: GRASS_MASK, maskSize: "cover", maskPosition: "50% 100%", WebkitMaskImage: GRASS_MASK, WebkitMaskSize: "cover", WebkitMaskPosition: "50% 100%" }}
          >
            <Image src={PHOTO} alt="" fill sizes="(max-width: 1023px) 150svh, 100vw" className="object-cover object-bottom" />
          </div>

          {/* Bottom line, on the grass */}
          <div className="font-outfit absolute inset-x-0 bottom-0 z-10 flex justify-between px-5 pb-3 text-[11px] text-white/90 [text-shadow:0_1px_8px_rgba(0,30,0,0.5)] sm:px-8 sm:pb-4 sm:text-[12px] xl:px-10 xl:pb-6 xl:text-[13px]">
            <span>© Imaginry</span>
            <span>Made by Ruvix</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

/** One wordmark letter, climbing out from behind the hill on its own beat. */
function Letter({ ch, i, p }: { ch: string; i: number; p: MotionValue<number> }) {
  const start = 0.3 + i * 0.05;
  const y = useTransform(p, [start, start + 0.35], ["105%", "0%"], { clamp: true });
  return (
    <motion.span style={{ y }} className="inline-block">
      {ch}
    </motion.span>
  );
}
