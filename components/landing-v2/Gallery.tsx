"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLookImages } from "@/components/studio/useLookImages";
import { GALLERY, stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { encodeShare } from "@/lib/studio/storage";
import "./figs.css";

const EASE = [0.16, 1, 0.3, 1] as const;
const LOOKS = GALLERY.slice(0, 10);
const studioLink = (look: CuratedLook) => `/studio#${encodeShare(stateForLook(look))}`;

/** Wide screens with motion welcome get the pinned walk; everyone else swipes a native strip. */
function usePinned() {
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setPinned(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return pinned;
}

/** True once the section is within a screen or so, so looks render before they're seen. */
function useNear(ref: React.RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

const HEADING = [
  { text: "Start from a look.", dim: false },
  { text: "Make it yours.", dim: true },
];

function Heading() {
  return (
    <motion.h2
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ staggerChildren: 0.06 }}
      className="font-figtree text-[clamp(2.4rem,min(5vw,9svh),5.25rem)] font-medium leading-[1] tracking-[-0.05em]"
    >
      {HEADING.map((line) => (
        <span key={line.text} className={`block ${line.dim ? "text-[#0e1a2b]/30" : ""}`}>
          {line.text.split(" ").map((w, i) => (
            <span key={i} className="inline-block overflow-clip pb-[0.08em] align-bottom [overflow-clip-margin:0.1em]">
              <motion.span
                className="inline-block"
                variants={{ hidden: { y: "115%" }, shown: { y: 0 } }}
                transition={{ duration: 1, ease: EASE }}
              >
                {w}
                {" "}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </motion.h2>
  );
}

/** One look hung on the wall: framed, with a small label under it. */
function Piece({ look, url, index, skew }: { look: CuratedLook; url: string | null; index: number; skew: MotionValue<number> }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px -5% 0px -5%" }}
      transition={{ duration: 1, ease: EASE, delay: Math.min(index, 4) * 0.06 }}
      className="shrink-0 snap-start"
      style={{ ["--r" as string]: look.ratio }}
    >
      <Link href={studioLink(look)} className="group block" aria-label={`Remix ${look.name}: ${look.recipe}`}>
        <motion.div
          style={{ skewX: skew }}
          className="relative h-[clamp(260px,50svh,540px)] w-[calc(clamp(260px,50svh,540px)*var(--r))] overflow-hidden rounded-[18px] bg-[#dfe5ec] shadow-[0_1px_2px_rgba(14,26,43,0.06),0_24px_60px_-30px_rgba(14,26,43,0.45)] transition-shadow duration-500 group-hover:shadow-[0_1px_2px_rgba(14,26,43,0.06),0_40px_80px_-30px_rgba(14,26,43,0.6)]"
        >
          {/* Soft shimmer while the look renders on the GPU */}
          {!url && <span className="gl-shimmer absolute inset-0" aria-hidden />}
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              src={url}
              alt=""
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: EASE }}
              className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            />
          )}
          {/* Remix chip slides up on hover */}
          <span className="absolute bottom-3 right-3 translate-y-[140%] rounded-full bg-white/85 px-3.5 py-1.5 text-[13px] font-medium text-[#0e1a2b] opacity-0 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            Remix →
          </span>
        </motion.div>
        <div className="mt-4 flex items-baseline justify-between gap-4 pr-1">
          <p className="text-[15px] font-medium tracking-[-0.01em] text-[#0e1a2b]">{look.name}</p>
          <p className="text-[13px] font-light text-[#0e1a2b]/55">{look.recipe}</p>
        </div>
      </Link>
    </motion.li>
  );
}

/** Last spot on the wall: an empty frame that sends you to the studio. */
function EmptyFrame() {
  return (
    <li className="shrink-0 snap-start">
      <Link
        href="/studio"
        className="group flex h-[clamp(260px,50svh,540px)] w-[clamp(220px,34svh,360px)] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-[#0e1a2b]/25 text-[#0e1a2b] transition-colors duration-500 hover:border-[#1d4fbf] hover:bg-white/50"
      >
        <span className="grid size-12 place-items-center rounded-full bg-[#0e1a2b] text-[20px] text-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90 group-hover:bg-[#1d4fbf]">
          +
        </span>
        <span className="text-[15px] font-medium">Make your own</span>
      </Link>
    </li>
  );
}

/**
 * Third section: a wall of looks. On wide screens the section pins and
 * scrolling down walks you along the wall; the pieces lean a touch with
 * scroll speed. Looks render live on the visitor's GPU once the wall is near.
 */
export default function Gallery() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const near = useNear(section);
  const pinned = usePinned();
  const reduce = useReducedMotion();
  const urls = useLookImages(near ? LOOKS : [], 720);

  // How far the strip has to travel; the section is that much taller than the screen.
  const [travel, setTravel] = useState(0);
  useLayoutEffect(() => {
    const el = track.current;
    if (!el || !pinned) return setTravel(0);
    const measure = () => setTravel(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned]);

  const { scrollYProgress, scrollY } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const velocity = useVelocity(scrollY);
  const rawSkew = useTransform(velocity, [-3000, 0, 3000], reduce || !pinned ? [0, 0, 0] : [4, 0, -4]);
  const skew = useSpring(rawSkew, { stiffness: 220, damping: 30 });

  return (
    <section
      ref={section}
      aria-labelledby="gallery-heading"
      className="relative bg-[#e9eef4] text-[#0e1a2b]"
      style={pinned ? { height: `calc(100svh + ${travel}px)` } : undefined}
    >
      <div className={pinned ? "sticky top-0 flex h-svh flex-col justify-center overflow-clip" : "py-[clamp(4rem,12svh,8rem)]"}>
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-end justify-between gap-6 px-6 sm:px-10">
          <div id="gallery-heading">
            <Heading />
          </div>
          <Link
            href="/explore"
            className="group mb-2 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0e1a2b]/75 transition-colors hover:text-[#0e1a2b]"
          >
            See what people made
            <span className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        <motion.ul
          ref={track}
          style={pinned ? { x } : undefined}
          aria-label="Looks"
          className={`mt-[clamp(2rem,6svh,4rem)] flex items-end gap-[clamp(1.25rem,2.5vw,2.5rem)] px-6 sm:px-10 ${
            pinned ? "w-max will-change-transform" : "snap-x snap-mandatory overflow-x-auto pb-4 [scrollbar-width:none]"
          }`}
        >
          {LOOKS.map((look, i) => (
            <Piece key={look.name} look={look} url={urls[i] ?? null} index={i} skew={skew} />
          ))}
          <EmptyFrame />
        </motion.ul>

        {/* Progress along the wall */}
        {pinned && (
          <div className="mx-auto mt-[clamp(1.5rem,4svh,3rem)] w-full max-w-[1440px] px-6 sm:px-10">
            <div className="h-px w-full bg-[#0e1a2b]/10">
              <motion.div style={{ scaleX: bar }} className="h-px origin-left bg-[#0e1a2b]/60" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
