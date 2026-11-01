"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { useState } from "react";
import { EASE } from "./motion";

const LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "#how", label: "How it works" },
  { href: "#export", label: "Export" },
];

/**
 * No bar: just a blur that fades out downward, so content dissolves under
 * the links. It slips away while scrolling down and returns on the way up.
 */
export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const lenis = useLenis(({ scroll, direction }) => {
    const next = direction === 1 && scroll > 240;
    if (direction !== 0) setHidden(next);
  });

  const go = (href: string) => (e: React.MouseEvent) => {
    // Page links navigate normally; in-page anchors glide there with Lenis.
    if (!lenis || !href.startsWith("#")) return;
    e.preventDefault();
    lenis.scrollTo(href, { duration: 1.8 });
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        transform: hidden ? "translateY(-110%)" : "none",
        transition: `transform 0.9s ${EASE}`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[150%] backdrop-blur-xl"
        style={{
          maskImage: "linear-gradient(to bottom, black 35%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent)",
        }}
      />
      <nav className="relative mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-[17px] tracking-tight text-[var(--bone)]">
            imaginry
          </Link>
          <div className="hidden items-center gap-6 text-[14px] text-[var(--bone)]/65 md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={go(l.href)} className="transition-colors hover:text-[var(--bone)]">
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <Link
          href="/studio"
          className="inline-flex h-9 items-center rounded-full bg-[var(--bone)] px-4 text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-white"
        >
          Open studio
        </Link>
      </nav>
    </header>
  );
}
