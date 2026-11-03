"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Rocket } from "@/components/icons";
import { prefersReducedMotion } from "./motion";

/** Size and colors of the default (landing) button. */
const LANDING = "h-11 pl-4 pr-5 text-[14.5px] bg-[var(--bone)] text-[var(--ink)] hover:bg-white";
/** The rocket clears the button before the page changes. */
const NAVIGATE_MS = 560;
/** Long enough for a fresh rocket to land back in place. */
const RESET_MS = 1300;

// Embers shaken loose on liftoff, drifting down-left from the nozzle.
const EMBERS = [
  { x: -11, y: 10, s: 1.5, d: 40 },
  { x: -17, y: 4, s: 1.1, d: 90 },
  { x: -6, y: 16, s: 1.3, d: 130 },
  { x: -19, y: 15, s: 0.9, d: 180 },
  { x: -13, y: 20, s: 0.7, d: 220 },
];

/**
 * The primary "Open studio" button. Hover: the rocket tilts skyward on a
 * flickering ember flame and the letters ripple. Click: the button rumbles,
 * the rocket blasts out the top right shedding embers, the label flips to
 * "Liftoff!", and a fresh rocket drops back onto the pad.
 */
export default function LaunchButton({
  href = "/studio",
  label = "Open studio",
  className = LANDING,
  iconSize = 16,
  variant = "pill",
}: {
  href?: string;
  label?: string;
  /** Size and colors; the shape and motion come with the button. */
  className?: string;
  iconSize?: number;
  /**
   * "pill": rocket beside the label. "orb": the rocket rides in a dark
   * porthole on the right; hovering floods the button with ember from it.
   */
  variant?: "pill" | "orb";
}) {
  const router = useRouter();
  const button = useRef<HTMLAnchorElement>(null);
  // Bumped per click so the flight animations restart from scratch.
  const [launch, setLaunch] = useState(0);
  const [liftoff, setLiftoff] = useState(false);

  useEffect(() => {
    if (!launch) return;
    const t = setTimeout(() => setLiftoff(false), RESET_MS);
    return () => clearTimeout(t);
  }, [launch]);

  // Coming back to this page (kept alive by Next, or restored from the
  // browser's back cache) should find the button idle, not mid-launch.
  useEffect(() => {
    const reset = () => {
      setLiftoff(false);
      setLaunch(0);
    };
    const onShow = (e: PageTransitionEvent) => e.persisted && reset();
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      reset();
    };
  }, []);

  const onClick = (e: React.MouseEvent) => {
    // New-tab clicks go straight through.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const reduced = prefersReducedMotion();
    setLaunch((n) => n + 1);
    setLiftoff(true);
    // Engines rumble the whole button just before liftoff.
    if (!reduced) {
      button.current?.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: "translate(-1.2px, 0.6px)" },
          { transform: "translate(1.2px, -0.4px)" },
          { transform: "translate(-0.8px, 0.4px)" },
          { transform: "translate(0.8px, 0)" },
          { transform: "translate(0, 0)" },
        ],
        { duration: 280, easing: "linear" },
      );
    }
    setTimeout(() => router.push(href), reduced ? 0 : NAVIGATE_MS);
  };

  if (variant === "orb") {
    return (
      <Link
        ref={button}
        href={href}
        data-liftoff={liftoff ? "1" : "0"}
        onClick={onClick}
        className={`launch-btn launch-orb group relative isolate inline-flex items-center overflow-hidden rounded-full pr-1.5 font-medium ${className}`}
      >
        {/* Ember floods out of the porthole on hover */}
        <span aria-hidden className="launch-orb-flood absolute right-1.5 top-1/2 -z-10 aspect-square h-[calc(100%-12px)] -translate-y-1/2 rounded-full bg-[var(--ember)]" />
        <span className="sr-only">{label}</span>
        <span aria-hidden className="relative grid overflow-hidden">
          <span className="launch-label col-start-1 row-start-1 inline-flex">
            {label.split("").map((ch, i) => (
              <span key={i} className="launch-letter inline-block whitespace-pre" style={{ animationDelay: `${i * 26}ms` }}>
                {ch}
              </span>
            ))}
          </span>
          <span className="launch-label-next col-start-1 row-start-1">Liftoff!</span>
        </span>
        <span aria-hidden className="launch-porthole relative ml-auto grid aspect-square h-[calc(100%-12px)] place-items-center overflow-hidden rounded-full bg-[var(--ink)] text-[var(--bone)]">
          {/* Hover: one rocket leaves out the top right as the next slides in from below */}
          <span className="launch-orb-out grid place-items-center">
            <Rocket size={iconSize} />
          </span>
          <span className="launch-orb-in absolute inset-0 grid place-items-center">
            <Rocket size={iconSize} />
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      ref={button}
      href={href}
      data-liftoff={liftoff ? "1" : "0"}
      onClick={onClick}
      className={`launch-btn group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-colors duration-500 ${className}`}
    >
      <span className="relative grid size-[18px] place-items-center">
        {/* Flame flickers at the nozzle on hover */}
        <span aria-hidden className="launch-flame pointer-events-none absolute -bottom-[2px] -left-[2px] size-[7px] rounded-full" />

        {launch > 0 &&
          EMBERS.map((p, i) => (
            <span
              key={`${launch}-${i}`}
              aria-hidden
              className="launch-ember pointer-events-none absolute bottom-0 left-0 size-[4px] rounded-full"
              style={
                {
                  "--x": `${p.x}px`,
                  "--y": `${p.y}px`,
                  "--s": p.s,
                  animationDelay: `${p.d}ms`,
                } as React.CSSProperties
              }
            />
          ))}

        <span key={`rocket-${launch}`} className={`inline-flex ${launch ? "launch-flight" : ""}`}>
          <span className="launch-rocket inline-flex">
            <Rocket size={iconSize} />
          </span>
        </span>
      </span>

      <span className="sr-only">{label}</span>
      <span aria-hidden className="relative grid overflow-hidden">
        <span className="launch-label col-start-1 row-start-1 inline-flex">
          {label.split("").map((ch, i) => (
            <span key={i} className="launch-letter inline-block whitespace-pre" style={{ animationDelay: `${i * 26}ms` }}>
              {ch}
            </span>
          ))}
        </span>
        <span className="launch-label-next col-start-1 row-start-1 text-center">Liftoff!</span>
      </span>
    </Link>
  );
}
