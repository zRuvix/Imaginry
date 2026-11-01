"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

/** Slow, settling ease used by every reveal on the page. */
export const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Calls `fn` with the element's rect on every Lenis scroll frame (and once on
 * mount / resize). Style elements directly in `fn`; it must not set state on
 * every call.
 */
export function useScrollFx<T extends HTMLElement>(ref: RefObject<T | null>, fn: (rect: DOMRect, vh: number) => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = () => {
    const el = ref.current;
    if (el) fnRef.current(el.getBoundingClientRect(), window.innerHeight);
  };
  useLenis(run);
  useEffect(() => {
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Scroll-linked progress with its own easing: `target` maps the element's
 * position to a value, and `apply` receives a value that glides toward it
 * (instead of tracking every scroll tick), so pinned scenes move like film.
 */
export function useSmoothProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  target: (rect: DOMRect, vh: number) => number,
  apply: (value: number) => void,
  smoothing = 0.085,
) {
  const state = useRef({ goal: 0, value: -1, raf: 0 });
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const tick = () => {
    const s = state.current;
    const reduced = prefersReducedMotion();
    s.value = s.value < 0 || reduced ? s.goal : s.value + (s.goal - s.value) * smoothing;
    if (Math.abs(s.goal - s.value) < 0.0004) s.value = s.goal;
    applyRef.current(s.value);
    s.raf = s.value === s.goal ? 0 : requestAnimationFrame(tick);
  };

  useScrollFx(ref, (rect, vh) => {
    const s = state.current;
    s.goal = target(rect, vh);
    if (!s.raf) s.raf = requestAnimationFrame(tick);
  });

  useEffect(() => {
    const s = state.current;
    return () => {
      cancelAnimationFrame(s.raf);
      // Reset, or a remount (Strict Mode) would think a frame is still queued.
      s.raf = 0;
    };
  }, []);
}

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 40,
  scale = 0.97,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  scale?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return setShown(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : `translate3d(0, ${y}px, 0) scale(${scale})`,
    transition: `opacity 1.1s ${EASE} ${delay}ms, transform 1.4s ${EASE} ${delay}ms`,
  };
  // Every allowed tag is a plain block element, so treat them all as a div for typing.
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as RefObject<HTMLDivElement>} className={className} style={style}>
      {children}
    </Comp>
  );
}
