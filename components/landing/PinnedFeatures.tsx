"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useLenis } from "lenis/react";
import { useRef, useState, type ReactNode } from "react";
import { EFFECT_COUNT } from "@/lib/studio/effects";

type Tile = { name: string; meta: string; icon: IconName };

const STEPS: { tab: string; sub: string; title: string; body: string; cta: string; tiles: Tile[]; dock: IconName[] }[] = [
  {
    tab: "Layers",
    sub: `${EFFECT_COUNT} live effects`,
    title: "Layers",
    body: "Stack gradients, glass, grain and glitch into one live canvas, reordered and blended in real time.",
    cta: "Start stacking",
    tiles: [
      { name: "Gradient", meta: "12 presets", icon: "gradient" },
      { name: "Fluted glass", meta: "4 styles", icon: "glass" },
      { name: "Grain", meta: "Texture", icon: "grain" },
      { name: "Halftone", meta: "Stylize", icon: "halftone" },
      { name: "Bloom", meta: "Light", icon: "spark" },
      { name: "Glitch", meta: "Stylize", icon: "glitch" },
    ],
    dock: ["gradient", "glass", "grain"],
  },
  {
    tab: "Motion",
    sub: "Seamless loops",
    title: "Motion",
    body: "Every effect can drift, pulse or flow. Set the speed and ease, and the loop closes without a seam.",
    cta: "Make it move",
    tiles: [
      { name: "Speed", meta: "0.1× to 4×", icon: "speed" },
      { name: "Loop", meta: "Seamless", icon: "loop" },
      { name: "Ease", meta: "Curve editor", icon: "curve" },
      { name: "Drift", meta: "Flow", icon: "wave" },
      { name: "Pulse", meta: "Light", icon: "spark" },
      { name: "Warp", meta: "Distort", icon: "glitch" },
    ],
    dock: ["speed", "loop", "curve"],
  },
  {
    tab: "Export",
    sub: "PNG, MP4, WebM",
    title: "Export",
    body: "Download stills, looping video, or embed code that renders live on your own site. Free for commercial use.",
    cta: "Export a design",
    tiles: [
      { name: "PNG", meta: "Up to 4K", icon: "image" },
      { name: "MP4", meta: "Looping video", icon: "video" },
      { name: "WebM", meta: "Looping video", icon: "video" },
      { name: "HTML", meta: "Live embed", icon: "code" },
      { name: "React", meta: "Live embed", icon: "code" },
      { name: "Link", meta: "Share a remix", icon: "link" },
    ],
    dock: ["image", "video", "code"],
  },
  {
    tab: "Agents",
    sub: "MCP server",
    title: "Agents",
    body: "Point any MCP client at imaginry.tech/mcp and let your agent build, render and share designs for you.",
    cta: "Connect an agent",
    tiles: [
      { name: "create_design", meta: "Stack layers", icon: "gradient" },
      { name: "random_design", meta: "Surprise me", icon: "spark" },
      { name: "list_effects", meta: `${EFFECT_COUNT} effects`, icon: "grain" },
      { name: "render_png", meta: "Up to 2048px", icon: "image" },
      { name: "get_embed_code", meta: "HTML or React", icon: "code" },
      { name: "read_design", meta: "From a link", icon: "link" },
    ],
    dock: ["spark", "code", "link"],
  },
];

/** Entrance in two phases: the hero crops to a strip by CROP, then the cards strip up by ENTER. The rest walks the tabs. */
const CROP = 0.11;
const ENTER = 0.24;
/** Track height in screens. The last screen is the exit: the next section slides up over the still-pinned stage. */
const TRACK_SCREENS = 6.4;
const EXIT = 1 - 1 / (TRACK_SCREENS - 1);
/** The one settling curve (tasteskill --m-ease-enter): no overshoot. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Pinned stage. Scrolling first shrinks the hero to a sky strip with a new
 * headline, and only then do two cards strip up from the bottom; then, still pinned,
 * scrolling walks the four tabs.
 */
export default function PinnedFeatures({ hero }: { hero: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  const lenis = useLenis();

  const steps = useTransform(p, [ENTER, EXIT], [0, 1], { clamp: true });
  useMotionValueEvent(steps, "change", (v) => setStep(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length))));

  // 0 → full hero, 1 → sky strip. Drives the clip and the hero's own fade via CSS vars.
  const shrink = useTransform(p, [0, CROP], [0, 1], { clamp: true });
  const headOpacity = useTransform(p, [CROP * 0.6, CROP], [0, 1]);
  const headY = useTransform(p, [CROP * 0.6, CROP], [24, 0]);
  // Percent of the cards still hidden above their revealed part; both strip upward together, level.
  const hide = useTransform(p, [CROP, ENTER], [100, 0], { clamp: true });

  // While the next section covers it, the stage eases back and fades.
  const exitScale = useTransform(p, [EXIT, 1], [1, 0.94], { clamp: true });
  const exitOpacity = useTransform(p, [EXIT, 1], [1, 0.2], { clamp: true });

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    const at = ENTER + ((i + 0.5) / STEPS.length) * (EXIT - ENTER);
    const top = el.offsetTop + travel * at;
    // Glide there with Lenis when it runs, so the jump has the same feel as the wheel.
    if (lenis) lenis.scrollTo(top, { duration: 1.4 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  const s = STEPS[step];

  return (
    <div ref={track} className="relative" style={{ height: `${TRACK_SCREENS * 100}svh` }}>
      <motion.div
        style={{ scale: exitScale, opacity: exitOpacity }}
        className="sticky top-0 h-svh origin-top overflow-clip [--top:0.24] lg:[--top:0.36]"
      >
        {/* Hero, clipped from the bottom up into the sky strip */}
        <motion.div
          style={{ ["--enter" as string]: shrink }}
          className="absolute inset-x-2 top-2 h-[calc(100svh-16px)] [clip-path:inset(0_0_calc(var(--enter)*(1-var(--top))*100%)_0_round_24px)] sm:[clip-path:inset(0_0_calc(var(--enter)*(1-var(--top))*100%)_0_round_28px)]"
        >
          {hero}
          <motion.div
            style={{ opacity: headOpacity, y: headY }}
            className="pointer-events-none absolute inset-x-0 top-0 flex h-[calc(var(--top)*100%)] items-center justify-center px-4 pt-14 text-center"
          >
            <h2 className="font-lexend max-w-[18ch] text-[clamp(1.6rem,min(3.4vw,5.5svh),3.75rem)] font-light leading-[1.05] tracking-[-0.04em] text-[#121416]">
              Stack live effects, loop them, export in seconds
            </h2>
          </motion.div>
        </motion.div>

        {/* Desktop: two cards under the strip. The wrapper lets clicks through to the
            hero underneath; only the cards' revealed (unclipped) parts take them. */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 top-[calc(8px+var(--top)*(100svh-16px)+8px)] hidden gap-2 lg:grid lg:grid-cols-2">
          {/* Left: tabs, then title, copy and button at the bottom */}
          <motion.div style={{ ["--hide" as string]: hide }} className="pointer-events-auto [clip-path:inset(calc(var(--hide)*1%)_0_0_0_round_24px)] flex min-h-0 flex-col rounded-[24px] bg-[#f7f7f7]">
            <div className="relative grid grid-cols-4 border-b border-black/[0.07]">
              {STEPS.map((t, i) => (
                <button
                  key={t.tab}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  onClick={() => goTo(i)}
                  className="cursor-pointer px-3 pb-4 pt-5 text-left sm:px-5 xl:px-7 xl:pb-5 xl:pt-6"
                >
                  <span className={`font-outfit block text-[15px] font-semibold transition-colors duration-300 xl:text-[18px] ${i === step ? "text-[#141414]" : "text-[#8a9097]"}`}>
                    {t.tab}
                  </span>
                  <span className="font-outfit mt-1 hidden text-[13px] text-[#9a9fa4] sm:block xl:text-[14px]">{t.sub}</span>
                </button>
              ))}
              <motion.span aria-hidden style={{ scaleX: steps }} className="absolute inset-x-0 -bottom-px h-[2px] origin-left bg-[#7f9b5c]" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-end p-5 sm:p-6 xl:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <h3 className="font-lexend text-[clamp(2.75rem,min(5vw,10svh),6rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[#121416]">
                    {s.title}
                  </h3>
                  <p className="font-outfit mt-4 max-w-[38ch] text-[16px] font-medium leading-relaxed text-[#4f555b] xl:mt-5 xl:text-[19px]">{s.body}</p>
                </motion.div>
              </AnimatePresence>
              <Link
                href="/studio"
                className="blue-button blue-button-large mt-6 w-fit xl:mt-8"
              >
                {s.cta}
              </Link>
            </div>
          </motion.div>

          {/* Right: rock photo with a grid of tiles and a small dock in the sky */}
          <motion.div style={{ ["--hide" as string]: hide }} className="pointer-events-auto [clip-path:inset(calc(var(--hide)*1%)_0_0_0_round_24px)] relative min-h-0 overflow-hidden rounded-[24px]">
            <Image src="/landing/rock.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[60%_78%]" />
            <div className="absolute inset-x-0 top-0 flex h-[72%] flex-col items-center justify-center gap-3 px-4 xl:gap-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ clipPath: "inset(100% 0% 0% 0%)", y: 12 }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)", y: 0 }}
                  exit={{ clipPath: "inset(0% 0% 100% 0%)", y: -12 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="flex flex-col items-center gap-3 xl:gap-4"
                >
                  <TileGrid tiles={s.tiles} dock={s.dock} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Phones and tablets: one rock card, tabs on top, tiles in the sky, copy on a white sheet */}
        <motion.div
          style={{ ["--hide" as string]: hide }}
          className="absolute inset-x-2 bottom-2 top-[calc(8px+var(--top)*(100svh-16px)+8px)] overflow-hidden rounded-[24px] [clip-path:inset(calc(var(--hide)*1%)_0_0_0_round_24px)] lg:hidden"
        >
          <Image src="/landing/rock.webp" alt="" fill sizes="100vw" className="object-cover object-[62%_82%]" />

          <div className="absolute inset-x-2 top-2 z-10">
            <div role="tablist" aria-label="Features" className="flex gap-1 rounded-[14px] bg-white/80 p-1 backdrop-blur-md">
              {STEPS.map((t, i) => (
                <button
                  key={t.tab}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  onClick={() => goTo(i)}
                  className={`font-outfit min-h-11 flex-1 cursor-pointer rounded-[10px] text-[14px] font-semibold transition-colors duration-200 ${
                    i === step ? "blue-button" : "text-[#3a3d40]"
                  }`}
                >
                  {t.tab}
                </button>
              ))}
            </div>
            <div className="mx-3 mt-2 h-[2px] overflow-hidden rounded-full bg-white/50">
              <motion.span aria-hidden style={{ scaleX: steps }} className="block h-full origin-left bg-[#141414]" />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-[clamp(170px,36%,230px)] top-[76px] flex items-center justify-center px-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ clipPath: "inset(100% 0% 0% 0%)", y: 12 }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)", y: 0 }}
                exit={{ clipPath: "inset(0% 0% 100% 0%)", y: -12 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="flex w-full flex-col items-center gap-2.5"
              >
                <TileGrid tiles={s.tiles} dock={s.dock} compact />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute inset-x-2 bottom-2 rounded-[18px] bg-white/90 p-4 backdrop-blur-xl sm:p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <h3 className="font-lexend text-[34px] font-semibold leading-none tracking-[-0.05em] text-[#121416] sm:text-[42px]">{s.title}</h3>
                <p className="font-outfit mt-2 text-[14px] font-medium leading-relaxed text-[#4f555b] sm:text-[16px]">{s.body}</p>
              </motion.div>
            </AnimatePresence>
            <Link
              href="/studio"
              className="blue-button blue-button-large mt-3 w-full"
            >
              {s.cta}
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** The 2×3 tile grid and the small dock under it; `compact` for phones. */
function TileGrid({ tiles, dock, compact = false }: { tiles: Tile[]; dock: IconName[]; compact?: boolean }) {
  return (
    <>
      <div className={`grid grid-cols-2 ${compact ? "w-[min(340px,100%)] gap-1.5" : "w-[min(380px,100%)] gap-1.5 xl:w-[420px] xl:gap-2"}`}>
        {tiles.map((t) => (
          <div
            key={t.name}
            className={`flex items-center rounded-[6px] bg-white shadow-[0_1px_2px_rgba(20,40,60,0.06)] ${compact ? "gap-2 px-2 py-1.5" : "gap-2.5 px-2.5 py-2 xl:px-3 xl:py-2.5"}`}
          >
            <span className={`grid shrink-0 place-items-center rounded-[6px] bg-[#eef2fb] text-[#6f86c7] ${compact ? "size-6" : "size-7 xl:size-8"}`}>
              <Icon name={t.icon} />
            </span>
            <span className="font-outfit min-w-0 leading-tight">
              <span className={`block truncate font-medium text-[#141414] ${compact ? "text-[11px]" : "text-[11.5px] xl:text-[12.5px]"}`}>{t.name}</span>
              <span className={`block truncate text-[#9a9fa4] ${compact ? "text-[9.5px]" : "text-[10px] xl:text-[11px]"}`}>{t.meta}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded-[8px] bg-white p-1.5 shadow-[0_0_0_3px_rgba(150,175,235,0.35),0_8px_20px_-8px_rgba(60,90,160,0.4)]">
        {dock.map((d, i) => (
          <span key={d + i} className={`grid size-7 place-items-center rounded-[6px] ${i === 0 ? "text-[#ff5a2c]" : "text-[#141414]"}`}>
            <Icon name={d} />
          </span>
        ))}
      </div>
    </>
  );
}

type IconName =
  | "gradient" | "glass" | "grain" | "halftone" | "spark" | "glitch"
  | "speed" | "loop" | "curve" | "wave" | "image" | "video" | "code" | "link";

/** Small 14px line icons for the tiles. */
function Icon({ name }: { name: IconName }) {
  const p = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "gradient":
      return <svg {...p}><rect x="2" y="2" width="12" height="12" rx="3" /><path d="M2 10 L10 2 M6 14 L14 6" /></svg>;
    case "glass":
      return <svg {...p}><path d="M3 2v12M6.5 2v12M10 2v12M13.5 2v12" /></svg>;
    case "grain":
      return <svg {...p} fill="currentColor" stroke="none"><circle cx="4" cy="4" r="1.1" /><circle cx="9" cy="3" r="1.1" /><circle cx="13" cy="6" r="1.1" /><circle cx="5" cy="9" r="1.1" /><circle cx="10" cy="9" r="1.1" /><circle cx="3" cy="13" r="1.1" /><circle cx="8" cy="13" r="1.1" /><circle cx="13" cy="12" r="1.1" /></svg>;
    case "halftone":
      return <svg {...p} fill="currentColor" stroke="none"><circle cx="4" cy="4" r="2" /><circle cx="11" cy="4" r="1.4" /><circle cx="4" cy="11" r="1.4" /><circle cx="11" cy="11" r="0.9" /></svg>;
    case "spark":
      return <svg {...p}><path d="M8 1.5v4M8 10.5v4M1.5 8h4M10.5 8h4M3.4 3.4l2.4 2.4M10.2 10.2l2.4 2.4M12.6 3.4l-2.4 2.4M5.8 10.2l-2.4 2.4" /></svg>;
    case "glitch":
      return <svg {...p}><path d="M2 4h8M5 8h9M2 12h6" /></svg>;
    case "speed":
      return <svg {...p}><path d="M2.5 11a5.5 5.5 0 1 1 11 0" /><path d="M8 11l3-4" /></svg>;
    case "loop":
      return <svg {...p}><path d="M12.5 6A4.5 4.5 0 0 0 4 5M3.5 10a4.5 4.5 0 0 0 8.5 1" /><path d="M4 2v3h3M12 14v-3H9" /></svg>;
    case "curve":
      return <svg {...p}><path d="M2 14C7 14 8 2 14 2" /></svg>;
    case "wave":
      return <svg {...p}><path d="M1.5 8c2-3 4-3 6.5 0s4.5 3 6.5 0" /></svg>;
    case "image":
      return <svg {...p}><rect x="2" y="2.5" width="12" height="11" rx="2" /><path d="M2.5 11l3.5-3.5 3 3 2-2 2.5 2.5" /></svg>;
    case "video":
      return <svg {...p}><rect x="1.5" y="3.5" width="9" height="9" rx="2" /><path d="M10.5 7l4-2.5v7l-4-2.5" /></svg>;
    case "code":
      return <svg {...p}><path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" /></svg>;
    case "link":
      return <svg {...p}><path d="M6.5 9.5l3-3M7 4.5l1-1a3 3 0 0 1 4.2 4.2l-1 1M9 11.5l-1 1a3 3 0 0 1-4.2-4.2l1-1" /></svg>;
  }
}
