"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { Credit } from "@/components/Credit";
import { BadgeMarquee } from "@/components/landing/Footer";
import LaunchButton from "@/components/landing/LaunchButton";
import { LEGAL_PAGES } from "@/lib/legal";
import { gsap, MOTION, useScene, Words } from "./scene";

const COLUMNS = [
  {
    title: "Look around",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Explore", href: "/explore" },
      { label: "Sponsor", href: "/sponsor" },
    ],
  },
  {
    title: "On this page",
    links: [
      { label: "Layers", href: "#layers" },
      { label: "Export", href: "#export" },
      { label: "Privacy", href: "#privacy" },
    ],
  },
  {
    title: "Legal",
    links: LEGAL_PAGES.map((l) => (l.href === "/privacy" ? { ...l, label: "Privacy policy" } : l)),
  },
];

/**
 * The close and the footer as one screen: the offer and the one action, the
 * name set across the page and cut out of a fresh render that drifts behind
 * the letters as the page arrives, then the links.
 */
export default function Closing({ fill }: { fill: string | null }) {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, MOTION, (el) => {
    gsap.fromTo(
      ".close-word",
      { backgroundPosition: "0% 20%" },
      {
        backgroundPosition: "100% 80%",
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: 0.6 },
      },
    );
  });

  return (
    <footer ref={ref} className="closing home relative flex min-h-[100svh] flex-col pb-6 pt-[var(--padt)] lg:h-[100svh]">
      <div className="wrap flex min-h-0 flex-1 flex-col justify-between gap-10">
        <div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="h2 max-w-[20ch] text-[var(--bone)]">
                <Words text="A free studio, open in your browser" />
              </h2>
              <p data-rise className="lead mt-4 max-w-[44ch]">
                It costs $0, needs no account and installs nothing. Start from a blank canvas or remix any design
                in the gallery.
              </p>
            </div>
            <div data-rise className="shrink-0">
              <LaunchButton
                className="btn cta-live h-[52px] pl-5 pr-6 text-[16px] bg-[var(--bone)] text-[var(--ink)] hover:bg-white"
                iconSize={17}
              />
            </div>
          </div>

          <p
            aria-hidden
            className={`close-word mt-8 select-none whitespace-nowrap pb-[0.08em] text-center font-display text-[clamp(44px,18.4vw,266px)] leading-[0.86] tracking-[-0.05em] ${
              fill ? "bg-clip-text text-transparent" : "text-[var(--bone)]"
            }`}
            style={
              fill
                ? ({
                    // A bone wash over the render keeps the name readable when a dark design is drawn.
                    backgroundImage: `linear-gradient(rgba(237,231,220,0.28), rgba(237,231,220,0.28)), url(${fill})`,
                    backgroundSize: "170% auto",
                    backgroundPosition: "100% 80%",
                  } as CSSProperties)
                : undefined
            }
          >
            imaginry
          </p>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-12">
            <p className="col-span-2 max-w-[30ch] text-[15px] leading-[1.6] text-[var(--bone)]/65 md:col-span-6">
              Abstract backgrounds and looping textures, drawn live on your own device.
            </p>
            {COLUMNS.map((col) => (
              <div key={col.title} className="md:col-span-2">
                <p className="text-[14px] text-[var(--bone)]/60">{col.title}</p>
                <ul className="mt-3 space-y-1.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="ulink text-[15px] text-[var(--bone)]/85 transition-colors hover:text-[var(--bone)]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-6">
            <p className="shrink-0 text-[14px] text-[var(--bone)]/60">Featured on</p>
            <div className="min-w-0 flex-1">
              <BadgeMarquee />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[14px] text-[var(--bone)]/60">
            <Credit />
            <span>Rendered live, on your device</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
