"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_ENTER, LINE_DUR, LINE_GAP } from "./enterTiming";

/**
 * The hero's one entrance on load. Timings follow tasteskill's motion spec:
 * headline lines rise out of masks (700ms, 80ms apart), what follows fades up
 * 12px (520ms, 60ms apart, starting as the last line is half way), and the
 * picture settles from .98 without ever being hidden. One settling curve, no
 * overshoot. Under reduced motion everything simply stands.
 */
export function EnterLines({ lines, className }: { lines: ReactNode[]; className?: string }) {
  const still = useReducedMotion();
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
          <motion.span
            className="block"
            initial={still ? false : { y: "105%" }}
            animate={{ y: "0%" }}
            transition={{ duration: LINE_DUR, delay: i * LINE_GAP, ease: EASE_ENTER }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export function EnterFade({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, delay, ease: EASE_ENTER }}
    >
      {children}
    </motion.div>
  );
}

/** A window or screenshot: never hidden, it only settles into place. */
export function EnterSettle({ children, className }: { children: ReactNode; className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={still ? false : { scale: 0.98 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.9, ease: EASE_ENTER }}
    >
      {children}
    </motion.div>
  );
}
