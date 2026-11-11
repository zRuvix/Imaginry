"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fragment, useEffect, type CSSProperties, type DependencyList, type RefObject } from "react";

export { gsap, ScrollTrigger };

/** Scroll scenes: tablets and up, and only when motion is welcome (matches the `live:` variant). */
export const LIVE = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
/** Lighter scroll motion that is fine on phones too. */
export const MOTION = "(prefers-reduced-motion: no-preference)";

let registered = false;

/**
 * Runs `setup` (GSAP tweens and ScrollTriggers, selectors scoped to `scope`)
 * while `query` matches, and reverts everything when it stops matching or the
 * component unmounts. The markup's resting CSS is always the finished state.
 */
export function useScene<T extends HTMLElement>(
  scope: RefObject<T | null>,
  query: string,
  setup: (el: T) => void | (() => void),
  deps: DependencyList = [],
) {
  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }
    const mm = gsap.matchMedia();
    mm.add(query, () => setup(el), el);
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * A heading's words, each in its own mask. They rise one after another the
 * first time the heading is seen (see `useReveals`); with `scrub`, a scene's
 * timeline moves the `.rv-i` spans itself instead.
 */
export function Words({ text, delay = 0, scrub }: { text: string; delay?: number; scrub?: boolean }) {
  const words = text.split(" ");
  return (
    <span className={scrub ? undefined : "rv"} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="rv-w">
            <span className="rv-i" style={{ "--i": i } as CSSProperties}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Marks every `.rv` heading and `[data-rise]` block as seen the first time
 * it scrolls into view (one ScrollTrigger each, fired once). Until the page
 * says motion is on (`html.rv-on`), all of them simply show.
 */
export function useReveals() {
  useEffect(() => {
    const root = document.documentElement;
    (window as unknown as { __imaginryHome?: boolean }).__imaginryHome = true;
    const els = [...document.querySelectorAll<HTMLElement>(".home .rv, .home [data-rise]")];
    if (!window.matchMedia(MOTION).matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }
    root.classList.add("rv-on");
    const triggers = els.map((el) =>
      ScrollTrigger.create({
        // A heading inside a held stage is measured by the stage's section, which is what scrolls.
        trigger: el,
        start: "top 94%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      root.classList.remove("rv-on");
    };
  }, []);
}
