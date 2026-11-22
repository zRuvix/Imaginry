"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LEGAL_PAGES } from "@/lib/legal";

/** Session key for the legal tab that was open last, so the next page's pill can glide over from it. */
const LAST_KEY = "legal-tab";
const readLast = () => {
  try {
    return sessionStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
};
const writeLast = (href: string) => {
  try {
    sessionStorage.setItem(LAST_KEY, href);
  } catch {
    // Storage blocked: the pill just appears in place.
  }
};

/**
 * Pills to move between the three legal pages. Each page is a fresh load, so
 * on arrival the dark pill starts under the tab you came from and slides to
 * the current one. Nothing else on the page animates.
 */
export function LegalSwitch() {
  // The path this page mounted with. During a route change the outgoing page
  // re-renders with the new path before it unmounts; ignoring that keeps the
  // "came from" tab and its highlight correct.
  const live = usePathname();
  const pathname = useRef(live).current;
  const nav = useRef<HTMLElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<{ x: number; w: number; animate: boolean } | null>(null);
  // Read once per page: React runs effects twice in development, and the first
  // run has already stored this page as the last tab.
  const cameFrom = useRef<string | null | undefined>(undefined);

  useLayoutEffect(() => {
    const box = nav.current?.getBoundingClientRect();
    const at = (href: string | null) => {
      const i = LEGAL_PAGES.findIndex((p) => p.href === href);
      const r = i >= 0 ? links.current[i]?.getBoundingClientRect() : undefined;
      return r && box ? { x: r.left - box.left, w: r.width } : null;
    };
    const to = at(pathname);
    if (cameFrom.current === undefined) cameFrom.current = readLast();
    const last = cameFrom.current;
    const from = last && last !== pathname ? at(last) : null;
    writeLast(pathname);
    if (!to) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Next keeps visited pages mounted but hidden and re-runs this when one is
    // shown again, so forget "came from" on the way out. The reset waits a tick
    // because React's development double run re-runs this straight away.
    const forget = () => setTimeout(() => (cameFrom.current = undefined), 0);
    if (!from || still) {
      setPill({ ...to, animate: false });
      return forget;
    }
    setPill({ ...from, animate: false });
    // Once the start position has painted, glide to the current tab.
    const t = setTimeout(() => setPill({ ...to, animate: true }), 30);
    return () => {
      clearTimeout(t);
      forget();
    };
  }, [pathname]); // runs once: `pathname` is fixed for this page

  return (
    <nav
      ref={nav}
      aria-label="Legal pages"
      className="relative inline-flex flex-wrap gap-1 rounded-[14px] bg-white p-1 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_8px_24px_-12px_rgba(20,30,40,0.18)]"
    >
      {pill && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-[10px] bg-[#141414]"
          style={{
            top: 4,
            bottom: 4,
            left: 0,
            width: pill.w,
            transform: `translateX(${pill.x}px)`,
            transition: pill.animate ? "transform 450ms cubic-bezier(0.22,1,0.36,1), width 450ms cubic-bezier(0.22,1,0.36,1)" : "none",
          }}
        />
      )}
      {LEGAL_PAGES.map((p, i) => {
        const active = pathname === p.href;
        return (
          <Link
            key={p.href}
            ref={(el) => {
              links.current[i] = el;
            }}
            href={p.href}
            aria-current={active ? "page" : undefined}
            className={`font-outfit relative flex min-h-10 items-center rounded-[10px] px-4 text-[14px] transition-colors duration-300 ${
              active ? "text-white" : "text-[#3a3d40] hover:text-[#141414]"
            } ${!pill && active ? "bg-[#141414]" : ""}`}
          >
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The sticky "On this page" list: the section you're reading is marked, a bar
 * shows how far through the page you are, and a click glides there with Lenis.
 */
export function LegalToc({ sections }: { sections: { id: string; title: string }[] }) {
  const lenis = useLenis();
  const [active, setActive] = useState(sections[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const update = () => {
      // The current section is the last one whose top has passed a third of the way down the screen.
      const line = window.innerHeight / 3;
      let current = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
      const first = els[0]?.getBoundingClientRect().top ?? 0;
      const last = els[els.length - 1]?.getBoundingClientRect().bottom ?? 1;
      const span = last - first - window.innerHeight / 2;
      setProgress(span > 0 ? Math.min(1, Math.max(0, (line - first) / span)) : 1);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  const go = (id: string) => (e: React.MouseEvent) => {
    if (!lenis) return;
    e.preventDefault();
    lenis.scrollTo(`#${id}`, { offset: -16, duration: 1.2 });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav aria-label="On this page">
      <div className="flex items-center justify-between">
        <p className="font-outfit text-[13px] text-[#7b8188]">On this page</p>
        <p className="font-outfit text-[13px] tabular-nums text-[#7b8188]">{Math.round(progress * 100)}%</p>
      </div>
      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[#eef0f2]">
        <div className="h-full origin-left rounded-full bg-[#141414] transition-transform duration-200" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <ol className="mt-5 space-y-0.5">
        {sections.map((s, i) => {
          const on = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={go(s.id)}
                aria-current={on ? "location" : undefined}
                className={`font-outfit flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-[14.5px] transition-colors duration-200 ${
                  on ? "bg-[#f3f4f5] text-[#141414]" : "text-[#6b7075] hover:text-[#141414]"
                }`}
              >
                <span className={`w-6 shrink-0 tabular-nums text-[12.5px] ${on ? "text-[#141414]" : "text-[#b4b8bc]"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
