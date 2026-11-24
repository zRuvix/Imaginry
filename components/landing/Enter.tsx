import type { CSSProperties, ReactNode } from "react";
import { LINE_GAP } from "./enterTiming";

/**
 * The hero's one entrance on load. Timings follow tasteskill's motion spec:
 * headline lines rise out of masks (700ms, 80ms apart), what follows fades up
 * 12px (520ms, 60ms apart, starting as the last line is half way), and the
 * picture settles from .98 without ever being hidden. One settling curve, no
 * overshoot.
 *
 * Plain CSS keyframes (globals.css, .enter-*), not JS: they play on first
 * paint, so the hero never waits on hydration and can't stay hidden if the
 * client bundle is slow or fails. Under reduced motion everything simply stands.
 */
const delay = (s: number) => ({ "--enter-delay": `${Math.round(s * 1000)}ms` }) as CSSProperties;

export function EnterLines({ lines, className }: { lines: ReactNode[]; className?: string }) {
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
          <span className="enter-rise block" style={delay(i * LINE_GAP)}>
            {line}
          </span>
        </span>
      ))}
    </h1>
  );
}

export function EnterFade({ children, delay: d = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`enter-fade ${className}`} style={delay(d)}>
      {children}
    </div>
  );
}

/** A window or screenshot: never hidden, it only settles into place. */
export function EnterSettle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`enter-settle ${className}`}>{children}</div>;
}
