"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLenis } from "lenis/react";
import { LogoMark } from "@/components/Logo";
import { BTN_MOTION } from "./buttonMotion";

type NavLink = { href: string; label: string };

/**
 * Phone and small-tablet navigation: a menu button that slides a white
 * sidebar in from the right. Closes on Escape, on the backdrop, on the close
 * button, and whenever a link is followed.
 */
export default function MobileMenu({ links, isActive }: { links: NavLink[]; isActive: (href: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  // The header sits inside a scaled, clipped stage; the sidebar renders on <body> so fixed positioning holds.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const closeRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    lenis?.stop();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      toggleRef.current?.focus();
    };
  }, [open, lenis]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className={`grid size-10 place-items-center rounded-[10px] bg-white text-[#141414] shadow-[0_1px_2px_rgba(20,30,40,0.06),0_8px_24px_-12px_rgba(20,30,40,0.18)] md:hidden ${BTN_MOTION}`}
      >
        <span aria-hidden className="flex w-4 flex-col gap-[5px]">
          <span className="h-[1.5px] w-full rounded-full bg-current" />
          <span className="h-[1.5px] w-full rounded-full bg-current" />
        </span>
      </button>

      {mounted && createPortal(
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          onClick={close}
          className={`absolute inset-0 bg-[#0f1a24]/25 backdrop-blur-[3px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />

        {/* Panel */}
        <aside
          className={`absolute inset-y-2 right-2 flex w-[min(84vw,340px)] flex-col rounded-[22px] bg-white p-5 shadow-[0_30px_80px_-20px_rgba(10,20,30,0.45)] transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" onClick={close} className="inline-flex items-center gap-2 text-[#141414]">
              <LogoMark size={24} />
              <span className="font-outfit text-[17px] font-medium tracking-tight">imaginry</span>
            </Link>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close menu"
              onClick={close}
              className={`grid size-10 place-items-center rounded-[10px] bg-[#f3f4f5] text-[#141414] hover:bg-[#e9ebed] ${BTN_MOTION}`}
            >
              <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>

          <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
            {links.map(({ href, label }, i) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}
                  className={`font-lexend flex items-center justify-between rounded-[12px] px-3 py-3 text-[26px] font-light tracking-[-0.03em] transition-[opacity,transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
                  } ${active ? "bg-[#f3f4f5] text-[#121416]" : "text-[#3a3d40] hover:bg-[#f6f7f8] hover:text-[#121416]"}`}
                >
                  {label}
                  {active && <span aria-hidden className="size-1.5 rounded-full bg-[#141414]" />}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/studio"
            onClick={close}
            className={`font-outfit mt-auto rounded-[12px] bg-[#1b1b1b] px-5 py-3.5 text-center text-[15px] text-white hover:bg-[#2b2b2b] ${BTN_MOTION}`}
          >
            Open studio
          </Link>
        </aside>
      </div>,
      document.body,
      )}
    </>
  );
}
