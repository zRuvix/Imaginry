"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowUpRight } from "@/components/icons";
import { MaskLines, Marker, useScrollRange } from "./kit";
import StudioFrame from "./StudioFrame";

/**
 * The real studio, embedded. Its window arrives tipped back like a laptop
 * lid and swings upright as it scrolls into place.
 */
export default function StudioWindow({ previewUrl }: { previewUrl: string | null }) {
  const lid = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: lid, offset: ["start end", "start 0.18"] });
  const rotateX = useTransform(p, [0, 1], [34, 0]);
  const scale = useTransform(p, [0, 1], [0.8, 1]);
  const y = useTransform(p, [0, 1], ["6vh", "0vh"]);
  const glow = useScrollRange(p, [0.4, 1], [0, 0.22]);

  return (
    <section className="relative mx-auto max-w-[1400px] px-4 pb-[18vh] pt-[6vh] md:px-8">
      <div className="mb-10 grid gap-6 md:mb-14 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <Marker n="04">Try it here</Marker>
          <h2 className="mt-4 font-display text-[clamp(34px,5vw,84px)] leading-[0.95] tracking-[-0.035em] text-[var(--bone)]">
            <MaskLines lines={["The whole studio,", "right in the page"]} />
          </h2>
        </div>
        <p className="max-w-[360px] text-[15.5px] leading-relaxed text-[var(--bone)]/60 md:col-span-4 md:justify-self-end">
          Not a video, not a mock-up. This is the studio itself, running live. Drag a slider and see.
        </p>
      </div>

      {/* Phones: the studio needs a wide screen, so show a preview instead */}
      <a href="/studio" className="relative block overflow-hidden rounded-[24px] md:hidden" style={{ aspectRatio: "4 / 5" }}>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-16">
          <p className="font-condensed text-[17px] font-semibold text-[var(--bone)]">Best on a laptop or desktop</p>
          <p className="mt-1 text-[14px] text-[var(--dim)]">The studio wants a wide screen. Tap to open it anyway.</p>
        </div>
      </a>

      <div ref={lid} className="hidden md:block" style={{ perspective: "2000px" }}>
        <motion.div className="relative origin-bottom will-change-transform" style={{ rotateX, scale, y }}>
          <motion.div
            aria-hidden
            className="absolute -inset-x-[6%] -bottom-[14%] top-[30%] -z-10 rounded-[50%] bg-[var(--ember)] blur-[120px]"
            style={{ opacity: glow }}
          />
          <div className="overflow-hidden rounded-[22px] bg-black ring-1 ring-white/10">
            <div className="flex h-10 items-center gap-1.5 bg-[var(--surface)] px-4">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="mx-auto rounded-full bg-white/[0.05] px-4 py-0.5 font-condensed text-[13px] text-[var(--dim)]">
                imaginry.tech/studio
              </span>
              <span className="w-[42px]" />
            </div>
            <StudioFrame />
          </div>
        </motion.div>
        <div className="mt-8 flex justify-end">
          <Link
            href="/studio"
            className="group inline-flex items-center gap-2 text-[15px] text-[var(--dim)] transition-colors hover:text-[var(--bone)]"
          >
            Open it full screen
            <ArrowUpRight size={14} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
