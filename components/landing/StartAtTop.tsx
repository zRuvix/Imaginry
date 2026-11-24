"use client";

import { useLayoutEffect } from "react";
import { useLenis } from "lenis/react";

/**
 * The landing always opens on its hero. Browsers restore the old scroll
 * position on reload, which here lands mid-way through the pinned features
 * with the hero already folded into a sky strip. Links to a section
 * (/#agents, /#pricing) still go to that section.
 */
export default function StartAtTop() {
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (window.location.hash) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  // Lenis keeps its own target; put it at the top too so it doesn't glide back.
  useLayoutEffect(() => {
    if (lenis && !window.location.hash) lenis.scrollTo(0, { immediate: true });
  }, [lenis]);

  return null;
}
