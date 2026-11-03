"use client";

import Link from "next/link";
import { motion, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { useRef } from "react";
import { ArrowUpRight } from "@/components/icons";
import { stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { encodeShare } from "@/lib/studio/storage";
import { MaskLines, Marker } from "./kit";

function Card({ look, url, hidden }: { look: CuratedLook; url: string | null; hidden?: boolean }) {
  return (
    <Link
      href={`/studio#${encodeShare(stateForLook(look))}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group relative block h-[clamp(170px,24vw,340px)] shrink-0 overflow-hidden rounded-[18px] bg-[var(--surface)] md:rounded-[24px]"
      style={{ aspectRatio: Math.min(1.6, Math.max(0.75, look.ratio)) }}
    >
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={hidden ? "" : `${look.name}: ${look.recipe}`}
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
        />
      )}
      <span className="absolute inset-x-3 bottom-3 flex translate-y-[calc(100%+16px)] items-center justify-between gap-3 rounded-full bg-black/50 py-2 pl-4 pr-2 backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
        <span className="truncate font-condensed text-[15px] text-[var(--bone)]">
          {look.name}
          <span className="ml-2 text-[var(--bone)]/55">{look.recipe}</span>
        </span>
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--bone)] text-[var(--ink)]">
          <ArrowUpRight size={13} />
        </span>
      </span>
    </Link>
  );
}

function Row({
  items,
  x,
  skew,
}: {
  items: { look: CuratedLook; url: string | null }[];
  x: MotionValue<string>;
  skew: MotionValue<number>;
}) {
  // Twice over, so the row never runs out at either end.
  return (
    <motion.div className="flex w-max gap-3 md:gap-5" style={{ x, skewX: skew }}>
      {[0, 1].map((copy) =>
        items.map((it, i) => <Card key={`${copy}-${i}`} look={it.look} url={it.url} hidden={copy === 1} />),
      )}
    </motion.div>
  );
}

/**
 * Two rows of fresh renders drifting against each other with the scroll.
 * Scrolling fast leans them over; they straighten when the page settles.
 */
export default function Drift({ looks, urls }: { looks: CuratedLook[]; urls: (string | null)[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["-4%", "-34%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-36%", "-6%"]);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const skew = useSpring(useTransform(velocity, [-2500, 0, 2500], [9, 0, -9]), { stiffness: 260, damping: 40 });

  const items = looks.map((look, i) => ({ look, url: urls[i] }));
  const half = Math.ceil(items.length / 2);

  return (
    <section ref={ref} className="relative overflow-x-clip pb-[16vh] pt-[10vh]">
      <div className="mx-auto mb-12 flex max-w-[1400px] flex-col gap-6 px-4 md:mb-16 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <Marker n="03">Fresh off the GPU</Marker>
          <h2 className="mt-4 font-display text-[clamp(34px,5vw,84px)] leading-[0.95] tracking-[-0.035em] text-[var(--bone)]">
            <MaskLines lines={["Rendered on this", "page, just now"]} />
          </h2>
        </div>
        <div className="max-w-[340px]">
          <p className="text-[15.5px] leading-relaxed text-[var(--bone)]/60">
            Every card below was drawn by your browser as this page loaded, with a fresh seed. Click one to open it in the
            studio and make it yours.
          </p>
          <Link
            href="/gallery"
            className="group mt-5 inline-flex items-center gap-2 text-[15px] text-[var(--bone)] transition-colors hover:text-[var(--ember)]"
          >
            Browse the gallery
            <ArrowUpRight size={14} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:gap-5">
        <Row items={items.slice(0, half)} x={x1} skew={skew} />
        <Row items={items.slice(half)} x={x2} skew={skew} />
      </div>
    </section>
  );
}
