"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import LiveLook from "./LiveLook";
import { clamp01 } from "./motion";

const AMBIENT: CuratedLook = {
  name: "Ambient",
  recipe: "",
  presets: ["g-teal", "b-haze", "gr-fine"],
  tweaks: { gradient: { colors: ["#1b3a1f", "#6fa35a", "#2c4a1e", "#d0803c"], warp: 1.2, speed: 0.6 } },
  seed: 4.4,
  ratio: 16 / 9,
};

const WORD = "imaginry";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Gallery", href: "/#gallery" },
      { label: "How it works", href: "/#how" },
      { label: "Export", href: "/#export" },
    ],
  },
  {
    title: "Make",
    links: [
      { label: "Open studio", href: "/studio" },
      { label: "Start from a photo", href: "/studio" },
    ],
  },
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
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-[20px] text-[var(--bone)]">imaginry</p>
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

      <div className="relative mx-auto mt-16 max-w-[1400px] overflow-x-clip px-2 pb-[2vw] md:mt-24" aria-label={WORD}>
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
        <span>© imaginry</span>
        <span>Rendered with WebGL, on your device</span>
      </div>
    </footer>
  );
}
