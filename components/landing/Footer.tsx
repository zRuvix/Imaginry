"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import LiveLook from "./LiveLook";
import { clamp01 } from "./motion";
import { Logo } from "@/components/Logo";
import { Credit } from "@/components/Credit";
import { LEGAL_PAGES } from "@/lib/legal";

const AMBIENT: CuratedLook = {
  name: "Ambient",
  recipe: "",
  presets: ["g-teal", "b-haze", "gr-fine"],
  tweaks: { gradient: { colors: ["#1b3a1f", "#6fa35a", "#2c4a1e", "#d0803c"], warp: 1.2, speed: 0.6 } },
  seed: 4.4,
  ratio: 16 / 9,
};

const WORD = "imaginry";

/** Launch sites that featured Imaginry, shown 40px tall in the footer marquee. */
const BADGES = [
  {
    href: "https://www.producthunt.com/products/imaginry?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-imaginry",
    src: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1300713&theme=dark",
    alt: "Imaginry on Product Hunt",
    width: 185,
  },
  {
    href: "https://nicklaunches.com/products/imaginry/",
    src: "https://nicklaunches.com/badges/featured.png",
    alt: "Imaginry on Nick Launches",
    width: 174,
  },
  { href: "https://twelve.tools", src: "https://twelve.tools/badge2-dark.svg", alt: "Featured on Twelve Tools", width: 148 },
  {
    href: "https://daniellaunches.com",
    src: "https://daniellaunches.com/badge-dark.svg",
    alt: "Featured on DanielLaunches",
    width: 183,
  },
  {
    href: "https://verifieddr.com/website/imaginry-tech",
    src: "https://verifieddr.com/badge/imaginry-tech.svg?metric=truedr",
    alt: "Verified DR - Verified Domain Rating for imaginry.tech",
    width: 137,
  },
  {
    href: "https://neeed.directory",
    src: "https://neeed.directory/badges/neeed-badge-light.svg",
    alt: "Featured on neeed.directory",
    width: 139,
  },
];
// Each half of the track repeats the badges enough to outlast a wide screen.
const HALF = Array.from({ length: 4 }, () => BADGES).flat();

/** Badges drift right to left in a loop; hovering pauses them. */
function BadgeMarquee() {
  return (
    <div
      className="marquee relative overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
    >
      <ul className="marquee-track flex items-center">
        {[0, 1].map((copy) =>
          HALF.map((b, i) => (
            // The second half only exists for the seamless loop, so it's hidden from screen readers and tabbing.
            <li key={`${copy}-${i}`} className="shrink-0 px-3" aria-hidden={copy === 1 || i >= BADGES.length || undefined}>
              <a
                href={b.href}
                target="_blank"
                rel="noopener"
                tabIndex={copy === 1 || i >= BADGES.length ? -1 : undefined}
                className="block opacity-80 transition-opacity hover:opacity-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} width={b.width} height={40} loading="lazy" className="block h-10 w-auto" />
              </a>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Explore", href: "/explore" },
      { label: "How it works", href: "/#how" },
      { label: "Export", href: "/#export" },
    ],
  },
  {
    title: "Make",
    links: [
      { label: "Open studio", href: "/studio" },
      { label: "Start from a photo", href: "/studio" },
      { label: "Sponsor", href: "/sponsor" },
    ],
  },
  { title: "Legal", links: LEGAL_PAGES },
];

/**
 * A fixed footer underneath the page. The content above lifts away like a
 * curtain to reveal it; a slow shader drifts behind and the wordmark rises
 * letter by letter as it opens.
 */
export default function Footer({ revealFrom }: { revealFrom: () => HTMLElement | null }) {
  const el = useRef<HTMLElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const [open, setOpen] = useState(false);

  useLenis(() => {
    const above = revealFrom();
    const footer = el.current;
    if (!above || !footer) return;
    const vh = window.innerHeight;
    // 0 while the page covers the footer, 1 once it's fully uncovered.
    const p = clamp01((vh - above.getBoundingClientRect().bottom) / footer.offsetHeight);
    if (p > 0 !== open) setOpen(p > 0);
    letters.current.forEach((l, i) => {
      if (!l) return;
      const t = clamp01(p * 1.6 - i * 0.07);
      l.style.transform = `translate3d(0, ${(1 - t) * 105}%, 0)`;
      l.style.opacity = String(t);
    });
  });

  return (
    <footer ref={el} className="relative overflow-hidden bg-[var(--ink)]">
      <div aria-hidden className="absolute inset-0">
        <LiveLook
          look={AMBIENT}
          running={open}
          speed={0.5}
          resolution={0.35}
          className="h-full w-full scale-110 opacity-90 blur-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)] via-[var(--ink)]/25 to-[var(--ink)]/55" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 pt-24 md:px-6 md:pt-32">
        <div className="grid gap-12 grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <p className="group text-[var(--bone)]">
              <Logo size={30} textClass="text-[20px]" />
            </p>
            <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-[var(--bone)]/70">
              Generative textures and looping backgrounds, made in your browser.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-condensed text-[14px] text-[var(--bone)]/50">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[15px] text-[var(--bone)]/85 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-[1200px] md:mt-20">
        <p className="mb-4 px-4 text-center font-condensed text-[14px] text-[var(--bone)]/50 md:px-6">Featured on</p>
        <BadgeMarquee />
      </div>

      <div className="relative mx-auto mt-12 max-w-[1400px] overflow-x-clip px-2 pb-[2vw] md:mt-16" aria-label={WORD}>
        <p className="flex justify-center font-display text-[clamp(64px,19vw,300px)] leading-[0.8] tracking-[-0.04em] text-[var(--bone)]/90">
          {WORD.split("").map((ch, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.2em] -mb-[0.14em]">
              <span
                ref={(s) => {
                  letters.current[i] = s;
                }}
                className="inline-block will-change-transform"
                style={{ transform: "translate3d(0, 105%, 0)", opacity: 0 }}
              >
                {ch}
              </span>
            </span>
          ))}
        </p>
      </div>
      <div className="relative mx-auto flex max-w-[1200px] justify-between px-4 pb-6 pt-4 font-condensed text-[13px] text-[var(--bone)]/45 md:px-6">
        <Credit />
        <span>Rendered live, on your device</span>
      </div>
    </footer>
  );
}
