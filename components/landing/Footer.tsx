"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "@/components/icons";
import type { CuratedLook } from "@/lib/studio/looks";
import { freshLooks } from "./fresh";
import { clamp01 } from "./motion";
import Pebbles from "./Pebbles";
import { useLookImages } from "./useLookImages";
import { Logo } from "@/components/Logo";
import { Credit } from "@/components/Credit";
import { LEGAL_PAGES } from "@/lib/legal";

const WORD = "imaginry";

/** How many pebbles drop into the pit. */
const PEBBLES = 12;
const NONE: CuratedLook[] = [];

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
  {
    href: "https://bestsky.tools?utm_source=badge",
    src: "https://assets.bestsky.tools/badges/featured-light.svg",
    alt: "Featured on BestskyTools",
    width: 150,
  },
  {
    href: "https://www.foundrlist.com/product/imaginry?utm_source=badge&utm_medium=embed",
    src: "https://www.foundrlist.com/api/badge/imaginry",
    alt: "Featured on FoundrList",
    width: 125,
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
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
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
                className="block opacity-70 transition-opacity hover:opacity-100"
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
 * A fixed footer underneath the page. As the page lifts away like a curtain,
 * the outlined wordmark fills from the bottom and a handful of round renders
 * rain into the pit below it, ready to be picked up and thrown.
 */
export default function Footer({ revealFrom }: { revealFrom: () => HTMLElement | null }) {
  const fill = useRef<HTMLSpanElement>(null);
  const el = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  // Small square renders of different designs every visit, only made once
  // the footer first opens.
  const [pebbleLooks, setPebbleLooks] = useState(NONE);
  useEffect(() => {
    if (open) setPebbleLooks(freshLooks(PEBBLES).map((l) => ({ ...l, name: `Pebble ${l.name}`, ratio: 1 })));
  }, [open]);
  const pebbles = useLookImages(pebbleLooks, 220);

  const lenis = useLenis(() => {
    const above = revealFrom();
    const footer = el.current;
    if (!above || !footer) return;
    const vh = window.innerHeight;
    // 0 while the page covers the footer, 1 once it's fully uncovered.
    const p = clamp01((vh - above.getBoundingClientRect().bottom) / footer.offsetHeight);
    // Opens once and stays open, so the pile isn't rebuilt on every pass.
    if (p > 0.3 && !open) setOpen(true);
    if (fill.current) fill.current.style.clipPath = `inset(${(1 - clamp01((p - 0.35) / 0.6)) * 100}% 0 0 0)`;
  });

  return (
    <footer ref={el} className="relative overflow-hidden bg-[var(--ink)]">
      <div aria-hidden className="pointer-events-none absolute -top-[30%] left-1/2 h-[60%] w-[80%] -translate-x-1/2 rounded-[50%] bg-[var(--ember)] opacity-[0.07] blur-[120px]" />

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-2 gap-x-6 gap-y-10 px-4 pt-20 md:grid-cols-12 md:px-8 md:pt-24">
        <div className="col-span-2 md:col-span-5">
          <p className="group text-[var(--bone)]">
            <Logo size={28} textClass="text-[19px]" />
          </p>
          <p className="mt-5 max-w-[360px] font-display text-[clamp(20px,1.8vw,26px)] leading-[1.15] tracking-[-0.02em] text-[var(--bone)]">
            Generative textures and looping backgrounds, made in your browser.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="md:col-span-2 last:md:col-span-3">
            <p className="font-condensed text-[14px] text-[var(--bone)]/45">{col.title}</p>
            <ul className="mt-4 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-[15px] text-[var(--bone)]/80 transition-colors hover:text-[var(--bone)]"
                  >
                    <span className="relative">
                      {l.label}
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
                    </span>
                    <ArrowUpRight
                      size={11}
                      className="-translate-x-1 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative mt-14 flex items-center gap-6 md:mt-16">
        <p className="shrink-0 pl-4 font-condensed text-[14px] text-[var(--bone)]/45 md:pl-8">Featured on</p>
        <div className="min-w-0 flex-1">
          <BadgeMarquee />
        </div>
      </div>

      {/* The pit: wordmark at the back, pebbles on top */}
      <div className="relative mx-auto mt-8 h-[clamp(220px,36vh,420px)] max-w-[1400px] md:mt-10">
        <p
          aria-label={WORD}
          className="pointer-events-none absolute inset-x-0 top-0 select-none text-center font-display text-[clamp(60px,17.5vw,280px)] leading-[0.85] tracking-[-0.05em]"
        >
          <span aria-hidden className="text-transparent [-webkit-text-stroke:1px_rgba(237,231,220,0.28)]">
            {WORD}
          </span>
          <span
            ref={fill}
            aria-hidden
            className="absolute inset-0 text-[var(--bone)]"
            style={{ clipPath: "inset(100% 0 0 0)" }}
          >
            {WORD}
          </span>
        </p>
        <Pebbles urls={pebbles} drop={open} />
        <p className="pointer-events-none absolute bottom-3 right-4 font-condensed text-[13px] text-[var(--bone)]/35 md:right-8">
          Go on, throw one
        </p>
      </div>

      <div className="relative mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-5 font-condensed text-[13px] text-[var(--bone)]/45 md:px-8">
        <Credit />
        <span className="hidden md:inline">Rendered live, on your device</span>
        <button
          type="button"
          onClick={() => (lenis ? lenis.scrollTo(0, { duration: 2.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }))}
          className="transition-colors hover:text-[var(--bone)]"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
