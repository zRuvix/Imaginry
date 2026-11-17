"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LaunchButton from "@/components/landing/LaunchButton";
import { Logo } from "@/components/Logo";

const LINKS: NavLink[] = [
  { href: "/gallery", label: "Gallery" },
  { href: "/explore", label: "Explore" },
  { href: "#layers", label: "Layers" },
  { href: "#export", label: "Export" },
  { href: "#privacy", label: "Privacy" },
  { href: "/sponsor", label: "Sponsor" },
];

/** One fixed, opaque bar on the page's edge lines; a full-screen menu on small screens. */
type NavLink = { href: string; label: string; current?: boolean };

export default function HomeNav({ links = LINKS }: { links?: NavLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="nav home fixed inset-x-0 top-0 z-50">
      <nav aria-label="Main" className="wrap flex h-[var(--nav)] items-center justify-between gap-6">
        <Link href="/" aria-label="Imaginry home" className="group text-[var(--bone)]">
          <Logo size={26} />
        </Link>
        <div className="hidden items-center gap-8 text-[15px] text-[var(--bone)]/70 lg:flex">
          {links.map((l: NavLink) => (
            <a key={l.href} href={l.href} aria-current={l.current ? "page" : undefined} className="ulink transition-colors hover:text-[var(--bone)] aria-[current=page]:text-[var(--bone)]">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <LaunchButton className="btn h-10 pl-3.5 pr-4 text-[14.5px] bg-[var(--bone)] text-[var(--ink)] hover:bg-white" iconSize={14} />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="home-menu"
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost h-10 px-4 text-[14.5px] lg:hidden!"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {open && (
        <div id="home-menu" data-lenis-prevent className="fixed inset-x-0 bottom-0 top-[var(--nav)] overflow-y-auto bg-[var(--ink)] lg:hidden">
          <ul className="wrap flex flex-col pt-6">
            {links.map((l: NavLink) => (
              <li key={l.href} className="border-b border-white/10">
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-5 font-display text-[26px] tracking-[-0.03em] text-[var(--bone)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
