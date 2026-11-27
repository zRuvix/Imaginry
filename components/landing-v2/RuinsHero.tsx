"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import "./hero.css";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "#agents", label: "Agents" },
  { href: "#pricing", label: "Pricing" },
  { href: "/sponsor", label: "Sponsor" },
];

/* Entrance timeline, in ms. hero.css explains the order. */
const T = {
  nav: 1150,
  navStep: 70,
  headline: 1300,
  letterStep: 22,
  copy: 2200,
};

const LINES: { words: string[]; accent?: number }[] = [
  { words: ["Backgrounds", "that", "feel"] },
  { words: ["painted,", "not", "generated."], accent: 0 },
];
const HEADLINE = LINES.map((l) => l.words.join(" ")).join(" ");

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Label that rolls up on hover, with a copy rolling in under it. */
function Roll({ children }: { children: ReactNode }) {
  return (
    <span className="rh-roll">
      <span>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  );
}

/** Headline set letter by letter; each word keeps its letters together when the line wraps. */
function Headline() {
  let n = 0;

  return (
    <h1 className="font-figtree max-w-[17ch] text-[clamp(2.75rem,min(6.3vw,11svh),7rem)] font-medium leading-[0.98] tracking-[-0.05em]">
      <span className="sr-only">{HEADLINE}</span>
      {LINES.map((line, li) => (
        <span key={li} aria-hidden className="block">
          {line.words.map((word, wi) => {
            const letters = [...word].map((ch) => {
              const d = T.headline + n++ * T.letterStep;
              return (
                <span key={d} className="rh-letter" style={delay(d)}>
                  {ch}
                </span>
              );
            });
            const gap = wi < line.words.length - 1 ? " " : null;

            if (line.accent !== wi) {
              return (
                <span key={wi}>
                  <span className="rh-word">{letters}</span>
                  {gap}
                </span>
              );
            }

            const strokeAt = T.headline + n * T.letterStep + 250;
            return (
              <span key={wi}>
                <span className="relative inline-block text-[#1d4fbf]">
                  <span className="rh-word">{letters}</span>
                  {/* Brush stroke paints itself under the accent word */}
                  <svg
                    className="rh-stroke pointer-events-none absolute -bottom-[0.12em] left-[-0.02em] h-auto w-[96%] overflow-visible"
                    viewBox="0 0 200 16"
                    aria-hidden
                  >
                    <path
                      d="M3 11 C 45 5, 95 3, 140 7 S 190 10, 197 7"
                      pathLength={1}
                      fill="none"
                      stroke="#1d4fbf"
                      strokeOpacity={0.4}
                      strokeWidth={4.5}
                      strokeLinecap="round"
                      style={delay(strokeAt)}
                    />
                  </svg>
                </span>
                {gap}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/**
 * Full-screen painting of ruins under a summer sky. On load the painting
 * opens from a small framed canvas to the full screen, light crosses it,
 * the text navigation drops in and the headline rises letter by letter.
 * After that, scroll drifts the painting slower than the copy and the
 * pointer nudges it a few pixels.
 */
export default function RuinsHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 60, damping: 20, mass: 0.6 });

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * -14);
    py.set(((e.clientY - r.top) / r.height - 0.5) * -8);
  }

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className="rh relative isolate flex h-[100svh] min-h-[600px] flex-col overflow-clip font-outfit text-[#0e1a2b]"
    >
      {/* Painting: scroll layer › framed canvas that opens › pointer layer › settling image */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: imageY, scale: imageScale }}>
        <div className="rh-canvas absolute inset-0 overflow-hidden">
          <motion.div className="absolute -inset-4" style={{ x: sx, y: sy }}>
            <div className="rh-paint absolute inset-0">
              <Image
                src="/landing-v2/hero.webp"
                alt="Oil painting of Roman ruins, columns and an arch on a grassy hill under a bright cloudy sky, with figures in white robes"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[72%_100%] md:object-[60%_100%]"
              />
            </div>
          </motion.div>
          <div className="rh-sweep" />
          {/* A breath of light behind the copy so the ink type reads on the blue */}
          <div className="rh-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_18%_28%,rgba(236,242,250,0.55),transparent_70%)]" />
        </div>
      </motion.div>

      {/* Text navigation, straight on the sky */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <span className="rh-clip">
          <Link
            href="/"
            aria-label="Imaginry home"
            className="rh-drop font-figtree text-[22px] font-semibold leading-none tracking-[-0.04em]"
            style={delay(T.nav)}
          >
            imaginry
          </Link>
        </span>

        <nav aria-label="Main" className="hidden items-center gap-9 md:flex">
          {LINKS.map((l, i) => (
            <span key={l.href} className="rh-clip">
              <Link
                href={l.href}
                className="rh-drop py-1 text-[14px] text-[#0e1a2b]/70 transition-colors duration-300 hover:text-[#0e1a2b]"
                style={delay(T.nav + (i + 1) * T.navStep)}
              >
                <Roll>{l.label}</Roll>
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-7">
          <span className="rh-clip hidden sm:inline-block">
            <Link
              href="/studio"
              className="rh-drop py-1 text-[14px] text-[#0e1a2b]/70 transition-colors duration-300 hover:text-[#0e1a2b]"
              style={delay(T.nav + 5 * T.navStep)}
            >
              <Roll>Sign in</Roll>
            </Link>
          </span>
          <span className="rh-clip">
            <Link href="/studio" className="rh-drop py-1 text-[14px] font-medium" style={delay(T.nav + 6 * T.navStep)}>
              <Roll>Open studio →</Roll>
            </Link>
          </span>
        </div>
      </header>

      {/* Copy */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 pt-[clamp(2rem,11svh,8rem)] sm:px-10"
      >
        <Headline />

        <p
          className="rh-lift mt-[clamp(1.25rem,3.5svh,2.25rem)] max-w-[40ch] text-[clamp(1rem,1.25vw,1.15rem)] font-light leading-[1.55] text-[#0e1a2b]/80"
          style={delay(T.copy)}
        >
          An abstract background maker that runs live in your browser. Shape it, light it, export it in seconds.
        </p>

        <div className="mt-[clamp(1.5rem,4svh,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-4">
          <span className="rh-pop inline-block" style={delay(T.copy + 150)}>
            <Link href="/studio" className="blue-button blue-button-large">
              <Roll>Start creating</Roll>
            </Link>
          </span>
          <Link
            href="/explore"
            className="rh-lift group inline-flex items-center gap-1.5 text-[15px] text-[#0e1a2b]/80 transition-colors hover:text-[#0e1a2b]"
            style={delay(T.copy + 260)}
          >
            See what people made
            <span className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
