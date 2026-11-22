"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Lenis on the window for the landing page: a low lerp so a flick of the
 * wheel keeps gliding for a distance and eases to a stop. Touch keeps the
 * device's own native momentum. The page still scrolls natively underneath,
 * so sticky pins and scroll-linked motion read the real scroll position.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  // Under reduced motion the wheel steps natively, with no glide.
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.075, wheelMultiplier: 1.15, smoothWheel: !calm, syncTouch: false }}>
      {children}
    </ReactLenis>
  );
}
