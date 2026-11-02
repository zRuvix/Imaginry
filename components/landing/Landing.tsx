"use client";

import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { ArrowUpRight, Hand } from "@/components/icons";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CURATED, type CuratedLook } from "@/lib/studio/looks";
import ExportStack from "./ExportStack";
import CurtainFooter from "./CurtainFooter";
import LaunchButton from "./LaunchButton";
import LayersStory, { randomStory } from "./LayersStory";
import LiveLook from "./LiveLook";
import { clamp01, EASE, Reveal, useScrollFx } from "./motion";
import Nav from "./Nav";
import Orbit from "./Orbit";
import StudioFrame from "./StudioFrame";
import { useLookImages } from "./useLookImages";

// Warm charcoal and bone, with one ember accent.
const THEME = {
  "--ink": "#0d0c0b",
  "--surface": "#171512",
  "--bone": "#ede7dc",
  "--dim": "#8f887d",
  "--ember": "#ff5a2c",
} as CSSProperties;

function Button({
  href,
  primary,
  onClick,
  children,
}: {
  href: string;
  primary?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14.5px] font-medium transition-colors duration-500 ${
        primary
          ? "bg-[var(--bone)] text-[var(--ink)] hover:bg-white"
          : "bg-white/[0.06] text-[var(--bone)] hover:bg-white/[0.12]"
      }`}
    >
      {children}
    </Link>
  );
}

/** Headline words rise one after another on load. */
function RisingTitle({ text, className }: { text: string; className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <h1 className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span
            className="inline-block"
            style={{
              transform: on ? "none" : "translate3d(0, 110%, 0)",
              transition: `transform 1.5s ${EASE} ${200 + i * 90}ms`,
            }}
          >
            {word}
            {" "}
          </span>
        </span>
      ))}
    </h1>
  );
}

function Hero({ looks, urls }: { looks: CuratedLook[]; urls: (string | null)[] }) {
  const lenis = useLenis();
  return (
    <section id="gallery" className="relative h-[100svh] overflow-hidden">
      <div className="pointer-events-none relative z-20 mx-auto flex max-w-[980px] flex-col items-center px-4 pt-[13svh] text-center md:pt-[12svh]">
        <RisingTitle
          text="Textures that didn’t exist a minute ago"
          className="font-display text-[clamp(34px,5.4vw,76px)] leading-[0.98] tracking-[-0.025em] text-[var(--bone)]"
        />
        <Reveal delay={700} y={20} className="mt-6 max-w-[520px]">
          <p className="text-[16px] leading-relaxed text-[var(--bone)]/60 md:text-[17px]">
            Stack gradients, glass, light and grain into one-off images and looping backgrounds, rendered live in your
            browser.
          </p>
          <div className="pointer-events-auto mt-7 flex flex-wrap justify-center gap-2.5">
            <LaunchButton />
            <Button
              href="#how"
              onClick={(e) => {
                if (!lenis) return;
                e.preventDefault();
                lenis.scrollTo("#how", { duration: 2 });
              }}
            >
              How it works
            </Button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={400} y={60} scale={0.9} className="absolute inset-x-0 bottom-[10svh] z-10 h-[40svh] md:h-[42svh]">
        <Orbit looks={looks} urls={urls} />
      </Reveal>

      <p className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2 font-condensed text-[14px] text-[var(--bone)]/40">
        <Hand size={14} /> Drag to spin · click a design to remix it
      </p>
    </section>
  );
}

function StudioPreview({ previewUrl }: { previewUrl: string | null }) {
  const frame = useRef<HTMLDivElement>(null);
  // The window grows into place as it scrolls up.
  useScrollFx(frame, (rect, vh) => {
    const p = clamp01((vh - rect.top) / (vh * 0.9));
    frame.current!.style.transform = `scale(${0.86 + p * 0.14})`;
    frame.current!.style.opacity = String(0.4 + p * 0.6);
  });

  return (
    <section className="relative mx-auto max-w-[1200px] px-4 pb-[18vh] pt-[8vh] md:px-6">
      <Reveal className="mb-12 text-center">
        <p className="font-condensed text-[15px] font-medium text-[var(--ember)]">Try it here</p>
        <h2 className="mt-3 font-display text-[clamp(30px,4vw,52px)] leading-[1.02] tracking-[-0.02em] text-[var(--bone)]">
          The whole studio, right in the page
        </h2>
      </Reveal>

      {/* Phones: the studio needs a wide screen, so show a preview instead */}
      <a
        href="/studio"
        className="relative block overflow-hidden rounded-[24px] md:hidden"
        style={{ aspectRatio: "4 / 5" }}
      >
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-16">
          <p className="font-condensed text-[17px] font-semibold text-[var(--bone)]">Best on a laptop or desktop</p>
          <p className="mt-1 text-[14px] text-[var(--dim)]">The studio wants a wide screen. Tap to open it anyway.</p>
        </div>
      </a>

      <div ref={frame} className="hidden origin-top will-change-transform md:block">
        <div className="overflow-hidden rounded-[24px] bg-black shadow-[0_60px_140px_-40px_rgba(255,90,44,0.28)]">
          <div className="flex h-10 items-center gap-1.5 bg-[var(--surface)] px-4">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="ml-3 font-condensed text-[13px] text-[var(--dim)]">imaginry.tech/studio</span>
          </div>
          <StudioFrame />
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 text-[15px] text-[var(--dim)] transition-colors hover:text-[var(--bone)]"
          >
            Open it full screen <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Gradient and film grain, drifting slowly behind the closing line. */
/** Deep, moody palettes so the bone headline always reads on top. */
const CLOSING_PALETTES = [
  ["#16100c", "#9c4a26", "#3a1f14", "#d99a6c", "#1f1510"], // copper
  ["#06141a", "#1d5c63", "#0b2a30", "#7fb8b0", "#0a1c20"], // deep teal
  ["#140a1c", "#5e2a7a", "#2a1238", "#c58adf", "#1a0e24"], // plum
  ["#0c1a10", "#3f6b3a", "#16301c", "#a7c48a", "#101c12"], // moss
  ["#080c1e", "#2a3f9e", "#121a44", "#8fa4f0", "#0c1028"], // indigo
  ["#1a080c", "#8a1f34", "#3a0f18", "#e08a96", "#200a10"], // wine
  ["#12100a", "#8a6a2a", "#2e2412", "#e0c27a", "#18140c"], // brass
];

function closingLook(colors = CLOSING_PALETTES[0], seed = 6.2): CuratedLook {
  return {
    name: "Closing",
    recipe: "",
    presets: ["g-ember", "gr-film"],
    tweaks: {
      gradient: { colors, warp: 1.1, scale: 1.1, speed: 0.5 },
      grain: { amount: 0.13, size: 1.3 },
    },
    seed,
    ratio: 16 / 9,
  };
}

function Closing() {
  const lenis = useLenis();
  const card = useRef<HTMLDivElement>(null);
  // A new palette each visit, picked after mount so the prerender stays stable.
  const [look, setLook] = useState(closingLook);
  useEffect(() => {
    const colors = CLOSING_PALETTES[Math.floor(Math.random() * CLOSING_PALETTES.length)];
    setLook(closingLook(colors, Math.random() * 20));
  }, []);
  // The card grows out of the page and its corners relax as it arrives.
  useScrollFx(card, (rect, vh) => {
    const p = clamp01((vh - rect.top) / (vh * 0.9));
    const eased = 1 - Math.pow(1 - p, 3);
    card.current!.style.transform = `scale(${0.9 + eased * 0.1})`;
    card.current!.style.borderRadius = `${56 - eased * 24}px`;
  });

  return (
    <section className="relative px-3 pb-[16vh] pt-[4vh] md:px-6">
      <div
        ref={card}
        className="relative mx-auto flex min-h-[52svh] max-w-[980px] items-center justify-center overflow-hidden px-5 py-16 text-center will-change-transform md:py-20"
        style={{ borderRadius: 56 }}
      >
        <LiveLook look={look} speed={0.45} className="absolute inset-0 h-full w-full" />
        {/* Keeps the type readable over the brightest parts of the gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(13,12,11,0.35),rgba(13,12,11,0)_75%)]" />
        <div className="relative">
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-display text-[clamp(28px,4.2vw,58px)] leading-[1] tracking-[-0.025em] text-[var(--bone)]">
              Your next background is one drag away
            </h2>
          </Reveal>
          <Reveal delay={200} y={24}>
            <p className="mx-auto mt-5 max-w-[440px] text-[16px] leading-relaxed text-[var(--bone)]/80">
              Open a blank canvas, or remix any design from the gallery.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <LaunchButton />
              <Link
                href="#gallery"
                onClick={(e) => {
                  if (!lenis) return;
                  e.preventDefault();
                  lenis.scrollTo(0, { duration: 2.4 });
                }}
                className="inline-flex h-11 items-center rounded-full bg-black/25 px-5 text-[14.5px] font-medium text-[var(--bone)] backdrop-blur-md transition-colors duration-500 hover:bg-black/40"
              >
                Back to the gallery
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- page

const STORY_PX = 1600;
const EMPTY: CuratedLook[] = [];

export default function Landing() {
  // One render queue for every still on the page, gallery first.
  // Fresh seeds every visit. Picked after mount so the prerendered page stays
  // stable; nothing is rendered until they exist.
  const [fresh, setFresh] = useState<{ gallery: CuratedLook[]; story: CuratedLook[] } | null>(null);
  useEffect(() => {
    setFresh({
      gallery: CURATED.map((l) => ({ ...l, seed: l.seed + Math.random() * 40 })),
      story: randomStory(),
    });
  }, []);
  const looks = fresh?.gallery ?? CURATED;
  const gallery = useLookImages(fresh?.gallery ?? EMPTY);
  // The layer plates fill the screen, so they get a much larger render.
  const story = useLookImages(fresh?.story ?? EMPTY, STORY_PX);

  const hero = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  // As the sheet slides over the hero, the hero sinks back and dims.
  useScrollFx(sheet, (rect, vh) => {
    const p = clamp01(1 - rect.top / vh);
    const h = hero.current;
    if (!h) return;
    h.style.transform = `translate3d(0, ${-p * 8}vh, 0) scale(${1 - p * 0.08})`;
    h.style.opacity = String(1 - p * 0.75);
    // Fully covered: hide it so the orbit stops animating and nothing peeks through corners.
    h.style.visibility = p >= 1 ? "hidden" : "visible";
    h.dataset.covered = p >= 1 ? "1" : "0";
  });

  return (
    <ReactLenis root options={{ lerp: 0.075, wheelMultiplier: 0.9 }}>
      <div style={THEME} className="bg-[var(--ink)] text-[var(--bone)] selection:bg-[var(--ember)]/40">
        <Nav />
        <CurtainFooter>
          <div className="sticky top-0 z-0 h-[100svh]">
            <div ref={hero} className="h-full origin-top will-change-transform">
              <Hero looks={looks} urls={gallery} />
            </div>
          </div>
          <div
            ref={sheet}
            className="relative z-10 rounded-[36px] bg-[var(--ink)] shadow-[0_-40px_100px_rgba(0,0,0,0.65)]"
          >
            <LayersStory looks={fresh?.story} urls={story} />
            <StudioPreview previewUrl={gallery[10]} />
            <ExportStack stills={[gallery[1], gallery[0], gallery[5], gallery[8], gallery[6]]} />
            <Closing />
          </div>
        </CurtainFooter>
      </div>
    </ReactLenis>
  );
}
