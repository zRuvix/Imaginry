"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { GALLERY, type CuratedLook } from "@/lib/studio/looks";
import { useLookImages } from "@/components/studio/useLookImages";
import { CARD_MOTION, ZOOM_MOTION } from "./buttonMotion";

const LOOKS = GALLERY.slice(0, 12);

/**
 * Light panel that slides up over the pinned features stage. Real gallery
 * looks, rendered live on the visitor's GPU, sit in white frames on a
 * filmstrip that glides sideways as the panel scrolls past.
 */
export default function LooksGallery() {
  const section = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const near = useNear(section);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });

  // Slide the strip by however much it overflows the panel, plus a little lead-in.
  const [overflow, setOverflow] = useState(0);
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const measure = () => setOverflow(Math.max(0, el.scrollWidth - el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [near]);
  const x = useTransform(scrollYProgress, [0.35, 0.95], [0, -overflow], { clamp: true });

  return (
    <section ref={section} aria-labelledby="looks-heading" className="relative z-10 -mt-[100svh] px-2 pb-2">
      <div className="overflow-clip rounded-[24px] bg-white sm:rounded-[28px]">
        {/* Heading row */}
        <div className="grid gap-6 px-5 pt-[clamp(2.5rem,9svh,6rem)] sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:items-end xl:px-10">
          <div>
            <span className="font-outfit inline-flex items-center gap-1.5 rounded-md bg-[#f3f4f5] px-2 py-1 text-[11.5px] text-[#3a3d40] xl:px-2.5 xl:py-1.5 xl:text-[13px]">
              Gallery
              <span className="rounded-[4px] bg-[#141414] px-1.5 py-px text-[10.5px] text-white xl:text-[12px]">{GALLERY.length} looks</span>
            </span>
            <h2
              id="looks-heading"
              className="font-lexend mt-5 text-[clamp(2.2rem,min(5vw,9svh),6rem)] font-light leading-[1.02] tracking-[-0.045em] text-[#121416]"
            >
              Start from a look.
              <br />
              <span className="text-[#b4b8bc]">Make it yours.</span>
            </h2>
          </div>
          <div className="lg:justify-self-end lg:pb-2">
            <p className="font-outfit max-w-[36ch] text-[14px] leading-relaxed text-[#6b7075] xl:text-[15.5px]">
              Every look is a stack of effects you can open, pull apart and remix. They render live, right here in your browser.
            </p>
            <Link
              href="/studio"
              className="blue-button blue-button-large mt-5"
            >
              Browse all looks
            </Link>
          </div>
        </div>

        {/* Filmstrip */}
        <div ref={strip} className="overflow-hidden pb-[clamp(2.5rem,9svh,6rem)] pt-[clamp(2rem,7svh,4.5rem)]">
          <motion.div style={{ x }} className="flex w-max gap-3 px-5 sm:gap-4 sm:px-8 xl:px-10">
            {near
              ? <Frames />
              : LOOKS.map((l) => <div key={l.name} className="h-[clamp(240px,46svh,520px)] rounded-[18px] bg-[#f3f4f5]" style={{ aspectRatio: l.ratio }} />)}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Frames() {
  const urls = useLookImages(LOOKS, 640);
  return LOOKS.map((look, i) => <Frame key={look.name} look={look} url={urls[i]} index={i} />);
}

/** One look in a white frame, with its name and recipe underneath. */
function Frame({ look, url, index }: { look: CuratedLook; url: string | null; index: number }) {
  return (
    <Link href="/studio" className="group block shrink-0">
      <div className={`rounded-[18px] bg-white p-1.5 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_24px_50px_-28px_rgba(20,40,60,0.4)] ring-1 ring-black/[0.05] sm:rounded-[22px] sm:p-2 ${CARD_MOTION}`}>
        <div
          className="relative h-[clamp(240px,46svh,520px)] overflow-hidden rounded-[12px] bg-[#f3f4f5] sm:rounded-[15px]"
          style={{ aspectRatio: look.ratio }}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={`${look.name}: ${look.recipe}`}
              className={`absolute inset-0 size-full object-cover ${ZOOM_MOTION}`}
              style={{ animation: "look-in 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
            />
          )}
        </div>
      </div>
      <div className="font-outfit mt-3 flex items-baseline gap-2 px-1">
        <span className="text-[11px] tabular-nums text-[#b4b8bc]">{String(index + 1).padStart(2, "0")}</span>
        <span className="text-[14px] text-[#141414] xl:text-[15px]">{look.name}</span>
        <span className="text-[12px] text-[#9a9fa4] xl:text-[13px]">{look.recipe}</span>
      </div>
    </Link>
  );
}

/** True once the element is within a screen of the viewport, so WebGL renders don't compete with the hero. */
function useNear(ref: React.RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
}
