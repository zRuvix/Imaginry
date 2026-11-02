"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Footer from "./Footer";

/**
 * Wraps a page so it lifts away like a curtain to reveal the site footer
 * fixed underneath. Must sit inside a ReactLenis root, which drives the reveal.
 */
export default function CurtainFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  const page = useRef<HTMLDivElement>(null);
  const footerWrap = useRef<HTMLDivElement>(null);
  const [footerH, setFooterH] = useState(0);
  // The curtain reveal only works when the footer fits on screen.
  const [curtain, setCurtain] = useState(true);

  useEffect(() => {
    const el = footerWrap.current!;
    const measure = () => {
      setFooterH(el.offsetHeight);
      setCurtain(el.offsetHeight < window.innerHeight * 0.95);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <div
        ref={page}
        className={`relative z-10 rounded-b-[36px] bg-[var(--ink)] shadow-[0_50px_100px_rgba(0,0,0,0.6)] ${className}`}
        style={{ marginBottom: curtain ? footerH : 0 }}
      >
        {children}
      </div>
      <div ref={footerWrap} className={curtain ? "fixed inset-x-0 bottom-0 z-0" : "relative"}>
        <Footer revealFrom={() => page.current} />
      </div>
    </>
  );
}
