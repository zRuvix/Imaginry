"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { encodeShare } from "@/lib/studio/storage";
import LaunchButton from "./LaunchButton";
import LiveLook from "./LiveLook";
import { EASE_OUT, MaskLines, useScrollRange } from "./kit";

/** The live window's resting rect, as insets from the stage edges (vh / vw). */
type Rect = { t: number; r: number; b: number; l: number };
const WINDOW: Record<"wide" | "narrow", Rect> = {
  wide: { t: 14, r: 5, b: 22, l: 50 },
  narrow: { t: 33, r: 5, b: 31, l: 5 },
};

/** A still floating around the window: position in % of the stage, width in vw, depth 0 (far) to 1 (near). */
type Spot = { x: number; y: number; w: number; d: number };
const FIELD: Record<"wide" | "narrow", Spot[]> = {
  wide: [
    { x: 36, y: 15, w: 7, d: 0.3 },
    { x: 42, y: 41, w: 5, d: 0.15 },
    { x: 45, y: 5, w: 6, d: 0.55 },
    { x: 71, y: 3, w: 5.5, d: 0.25 },
    { x: 90, y: 8, w: 7, d: 0.65 },
    { x: 88, y: 57, w: 9, d: 0.9 },
    { x: 70, y: 82, w: 6.5, d: 0.4 },
    { x: 84, y: 85, w: 5, d: 0.2 },
    { x: 30, y: 43, w: 4.5, d: 0.2 },
    { x: 60, y: 84, w: 6, d: 0.7 },
  ],
  narrow: [
    { x: 72, y: 25, w: 20, d: 0.6 },
    { x: 3, y: 62, w: 17, d: 0.85 },
    { x: 80, y: 63, w: 14, d: 0.3 },
    { x: 46, y: 28, w: 10, d: 0.2 },
  ],
};

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function Tile({
  spot,
  look,
  url,
  index,
  center,
  p,
  mx,
  my,
}: {
  spot: Spot;
  look: CuratedLook;
  url: string | null;
  index: number;
  center: { x: number; y: number };
  p: MotionValue<number>;
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  // Scrolling flies every still outward past the camera, nearer ones faster.
  const k = 0.7 + spot.d * 1.7;
  const x = useTransform(p, [0, 0.6], ["0vw", `${(spot.x + spot.w / 2 - center.x) * k}vw`]);
  const y = useTransform(p, [0, 0.6], ["0vh", `${(spot.y - center.y) * k}vh`]);
  const scale = useScrollRange(p, [0, 0.6], [1, 1 + spot.d * 1.8]);
  const opacity = useScrollRange(p, [0.08, 0.42], [1, 0]);
  // The cursor sways the field; near stills move more than far ones.
  const px = useTransform(mx, (v) => v * spot.d * -38);
  const py = useTransform(my, (v) => v * spot.d * -26);

  return (
    <motion.div
      className="absolute"
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}vw`, x, y, scale, opacity, zIndex: spot.d > 0.5 ? 30 : 5 }}
    >
      <motion.div style={{ x: px, y: py }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={url ? { opacity: spot.d < 0.3 ? 0.55 : 1, scale: 1, y: 0 } : undefined}
          transition={{ duration: 1.3, delay: 0.35 + index * 0.07, ease: EASE_OUT }}
          whileHover={{ scale: 1.08, rotate: index % 2 ? 3 : -3, opacity: 1 }}
        >
          <Link
            href={`/studio#${encodeShare(stateForLook(look))}`}
            aria-label={`Remix ${look.name} in the studio`}
            className="block overflow-hidden rounded-[12px] bg-[var(--surface)] shadow-[0_24px_50px_-18px_rgba(0,0,0,0.85)] md:rounded-[16px]"
            style={{ aspectRatio: Math.min(1.35, Math.max(0.78, look.ratio)) }}
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * A field of fresh stills floats around one live window. Scrolling flies the
 * stills out past the camera while the window opens to fill the screen, so
 * the page falls into the texture.
 */
export default function Hero({
  looks,
  urls,
  windowLook,
}: {
  looks: CuratedLook[];
  urls: (string | null)[];
  /** The design in the live window, drawn fresh each visit; empty until picked. */
  windowLook?: CuratedLook;
}) {
  const lenis = useLenis();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [size, setSize] = useState<"wide" | "narrow">("wide");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setSize(mq.matches ? "wide" : "narrow");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress: p } = useScroll({ target: section, offset: ["start start", "end end"] });

  // The window opens from a sliver on load.
  const intro = useMotionValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    const c = animate(intro, 1, { duration: 1.8, delay: 0.15, ease: EASE_OUT });
    return () => c.stop();
  }, [intro, reduced]);

  const rect = WINDOW[size];
  const clipPath = useTransform([p, intro], ([s, i]: number[]) => {
    const open = 1 - ease(s / 0.58);
    const shut = (1 - i) * 10;
    return `inset(${(rect.t + shut) * open}vh ${(rect.r + shut) * open}vw ${(rect.b + shut) * open}vh ${(rect.l + shut / 2) * open}vw round ${28 * open}px)`;
  });
  const windowScale = useScrollRange(p, [0, 0.58], [1.12, 1]);

  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { stiffness: 50, damping: 18 });
  const my = useSpring(myRaw, { stiffness: 50, damping: 18 });
  useEffect(() => {
    if (reduced) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mxRaw.set((e.clientX / window.innerWidth) * 2 - 1);
      myRaw.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [mxRaw, myRaw, reduced]);

  const copyY = useTransform(p, [0, 0.4], ["0vh", "-12vh"]);
  const copyOpacity = useScrollRange(p, [0.04, 0.3], [1, 0]);
  const scrim = useScrollRange(p, [0.45, 0.75], [0, 0.55]);
  const outroOpacity = useScrollRange(p, [0.6, 0.78], [0, 1]);
  const outroY = useTransform(p, [0.6, 0.85], ["8vh", "0vh"]);
  const outroScale = useScrollRange(p, [0.6, 1], [0.94, 1]);

  const center = { x: 100 - rect.r - (100 - rect.l - rect.r) / 2, y: rect.t + (100 - rect.t - rect.b) / 2 };
  const spots = FIELD[size];

  return (
    <section ref={section} id="top" className="relative h-[290vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* The live window */}
        <motion.div aria-hidden className="absolute inset-0 z-10" style={{ clipPath }}>
          <motion.div className="absolute inset-0" style={{ scale: windowScale }}>
            {windowLook && <LiveLook look={windowLook} speed={0.5} resolution={0.6} className="h-full w-full" />}
          </motion.div>
          <motion.div className="absolute inset-0 bg-[var(--ink)]" style={{ opacity: scrim }} />
        </motion.div>

        {/* Floating stills, each a link into the studio */}
        <div className="absolute inset-0">
          {spots.map((spot, i) =>
            looks[i] ? (
              <Tile
                key={i}
                spot={spot}
                look={looks[i]}
                url={urls[i]}
                index={i}
                center={center}
                p={p}
                mx={mx}
                my={my}
              />
            ) : null,
          )}
        </div>

        {/* Copy: a short brief up top, the headline set large at the bottom */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between px-4 pb-[5svh] pt-[12svh] md:px-8 md:pb-[6svh] md:pt-[15svh]"
          style={{ y: copyY, opacity: copyOpacity }}
        >
          <motion.div
            className="order-2 md:order-1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.9, ease: EASE_OUT }}
          >
            <p className="max-w-[290px] font-display text-[clamp(17px,1.45vw,21px)] leading-[1.2] tracking-[-0.02em] text-[var(--bone)]">
              Stack light, glass and grain into backgrounds that move.
            </p>
            <p className="mt-2.5 font-condensed text-[14px] text-[var(--bone)]/45">Free · No AI · Nothing uploaded</p>
            <div className="pointer-events-auto mt-7 flex items-center gap-5">
              <LaunchButton
                variant="orb"
                className="h-14 gap-6 pl-6 text-[15px] bg-[var(--bone)] text-[var(--ink)]"
                iconSize={17}
              />
              <a
                href="#how"
                onClick={(e) => {
                  if (!lenis) return;
                  e.preventDefault();
                  lenis.scrollTo("#how", { duration: 2.2 });
                }}
                className="group inline-flex items-center gap-1.5 font-condensed text-[15px] text-[var(--bone)]/60 transition-colors hover:text-[var(--bone)]"
              >
                How it works
                <span className="inline-block transition-transform duration-500 group-hover:translate-y-0.5">↓</span>
              </a>
            </div>
          </motion.div>

          <h1 className="order-1 font-display text-[clamp(38px,5.6vw,108px)] leading-[0.94] tracking-[-0.035em] text-[var(--bone)] md:order-2">
            <MaskLines onMount delay={0.2} lines={["Textures that", "didn’t exist", "a minute ago."]} />
          </h1>
        </motion.div>

        {/* Once the window fills the screen */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center px-5 text-center"
          style={{ opacity: outroOpacity, y: outroY, scale: outroScale }}
        >
          <p className="font-condensed text-[15px] text-[var(--bone)]/75">Drawn live, right now, by your GPU</p>
          <p className="mt-4 font-display text-[clamp(34px,6.2vw,112px)] leading-[0.95] tracking-[-0.035em] text-[var(--bone)]">
            No stock. No AI.
            <br />
            Just light, glass
            <br />
            and grain.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
