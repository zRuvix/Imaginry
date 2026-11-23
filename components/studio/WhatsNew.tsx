"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { X } from "@/components/icons";
import { useClickOutside } from "./controls";

const VIDEO = "https://cdn.imaginry.tech/imginry-motion-feature.mp4";
/** Bump the id when announcing a new feature, so everyone sees it once. */
const SEEN_KEY = "imaginry:whats-new:motion";

/** One easing and length for both directions, so open and close mirror each other. */
const MORPH_MS = 760;
const MORPH_EASE = "cubic-bezier(0.65, 0, 0.25, 1)";

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Storage blocked (private mode, sandboxed preview): don't nag on every visit.
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Nothing to remember it in; the card simply closes.
  }
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * pending: deciding (first visit, card about to show) · open: card showing ·
 * closing / opening: card morphing into / out of the ? button · docked: only
 * the ? button shows.
 */
type Phase = "pending" | "open" | "closing" | "opening" | "docked";

export type WhatsNewState = {
  phase: Phase;
  setPhase: (p: Phase) => void;
  /** The ? button the card docks into. */
  dockRef: RefObject<HTMLButtonElement | null>;
  /** True only for the card's very first appearance (it pops in rather than morphs). */
  first: boolean;
};

/** Shared by the card and its ? button, which live in different parts of the studio. */
export function useWhatsNew(): WhatsNewState {
  const [phase, setPhase] = useState<Phase>("pending");
  const [first, setFirst] = useState(false);
  const dockRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (seen()) {
      setPhase("docked");
      return;
    }
    setFirst(true);
    // Let the studio paint first so the card arrives over a live canvas.
    const t = setTimeout(() => setPhase("open"), 700);
    return () => clearTimeout(t);
  }, []);

  // Once the card has been closed it only ever morphs, never pops in again.
  const go = (p: Phase) => {
    if (p === "closing") setFirst(false);
    setPhase(p);
  };

  return { phase, setPhase: go, dockRef, first };
}

/** The ? button in the top bar. It holds its place while the card is out, so nothing shifts. */
export function WhatsNewDock({ news, compact = false }: { news: WhatsNewState; compact?: boolean }) {
  const shown = news.phase === "docked";
  return (
    <button
      ref={news.dockRef}
      type="button"
      aria-label="What's new: Motion"
      title="What's new"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      onClick={() => news.setPhase("opening")}
      className={`press grid shrink-0 place-items-center rounded-full font-display text-bone/85 hover:text-white ${
        compact ? "size-10 bg-white/[0.06] text-[17px]" : "glass-panel pointer-events-auto size-[52px] text-[19px]"
      } ${shown ? "" : "pointer-events-none opacity-0"}`}
    >
      ?
    </button>
  );
}

/**
 * Sits over the video box until the clip can play: a ring that fills as the
 * clip downloads (spinning while its size is unknown), or a retry if it failed.
 */
function VideoLoader({ progress, failed, onRetry }: { progress: number | null; failed: boolean; onRetry: () => void }) {
  const r = 20;
  const length = 2 * Math.PI * r;
  const known = progress !== null;
  const pct = Math.round((progress ?? 0) * 100);

  return (
    <div className="absolute inset-0 grid place-items-center bg-white/[0.03]" role="status" aria-live="polite">
      {failed ? (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <p className="text-[13.5px] text-bone/70">The preview couldn&apos;t load.</p>
          <button
            type="button"
            onClick={onRetry}
            className="press rounded-full bg-white/[0.08] px-4 py-1.5 text-[13px] text-bone hover:bg-white/[0.14]"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative grid size-14 place-items-center">
            <span aria-hidden className="studio-loader-ring absolute inset-1 rounded-full" />
            <svg
              viewBox="0 0 48 48"
              className={`absolute inset-0 size-full -rotate-90 ${known ? "" : "animate-spin"}`}
              aria-hidden
            >
              <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-white/[0.08]" />
              <circle
                cx="24"
                cy="24"
                r={r}
                fill="none"
                stroke="var(--ember)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={length}
                strokeDashoffset={known ? length * (1 - Math.max(0.04, progress ?? 0)) : length * 0.75}
                style={{ transition: "stroke-dashoffset 400ms cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
            </svg>
            <span className="font-outfit text-[12px] tabular-nums text-bone/80">{known ? `${pct}%` : ""}</span>
          </div>
          <p className="loader-dots text-[12.5px] text-bone/55">Loading preview</p>
        </div>
      )}
    </div>
  );
}

/**
 * The card announcing layer Motion. It shows on someone's first studio visit;
 * closing it flies it into the ? button in the top bar, and the ? button
 * flies it back out. The clip loops silently with no controls.
 */
export default function WhatsNew({ news }: { news: WhatsNewState }) {
  const { phase, setPhase, dockRef, first } = news;
  const [ready, setReady] = useState(false);
  /** Share of the clip downloaded, 0–1; null until the browser knows its length. */
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  /** Bumped by Retry to remount the video and fetch it again. */
  const [attempt, setAttempt] = useState(0);
  const retry = () => {
    setFailed(false);
    setProgress(null);
    setAttempt((n) => n + 1);
  };
  const [still, setStill] = useState(false);
  const backdrop = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const glyph = useRef<HTMLSpanElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const mounted = phase === "open" || phase === "closing" || phase === "opening";
  // Entrance flourishes only on the first appearance; a reopen is just the morph.
  const rise = first ? "anim-rise" : "";

  useEffect(() => setStill(reducedMotion()), []);

  // The video unmounts when the card docks; start the loader fresh for the next open.
  useEffect(() => {
    if (phase !== "docked") return;
    setReady(false);
    setProgress(null);
    setFailed(false);
  }, [phase]);

  /**
   * Pins the card at its current box and morphs it to `to` (or from `to` when
   * opening). Contents keep their width so nothing reflows mid-flight.
   */
  const morph = (direction: "in" | "out", done: () => void) => {
    const el = card.current;
    const inner = content.current;
    const dock = dockRef.current?.getBoundingClientRect();
    if (!el || !inner || !dock || dock.width === 0 || reducedMotion()) {
      done();
      return;
    }
    const box = el.getBoundingClientRect();
    inner.style.width = `${inner.offsetWidth}px`;
    Object.assign(el.style, { position: "fixed", margin: "0", left: "0", top: "0", maxWidth: "none" });

    const big = { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: "28px" };
    const small = { left: `${dock.left}px`, top: `${dock.top}px`, width: `${dock.width}px`, height: `${dock.height}px`, borderRadius: `${dock.height / 2}px` };
    const out = direction === "out";
    const timing = { duration: MORPH_MS, easing: MORPH_EASE, fill: "both" as const };

    const shell = el.animate(out ? [big, small] : [small, big], timing);
    // Contents leave in the first third (or arrive in the last), so the shape does the travelling.
    const shown = { opacity: 1, transform: "none" };
    const gone = { opacity: 0, transform: "scale(0.94)" };
    inner.animate(out ? [shown, { ...gone, offset: 0.35 }, gone] : [gone, { ...gone, offset: 0.6 }, shown], { ...timing, easing: "ease-out" });
    const q0 = { opacity: 0, transform: "scale(0.5)" };
    const q1 = { opacity: 1, transform: "scale(1)" };
    glyph.current?.animate(out ? [q0, { ...q0, offset: 0.55 }, q1] : [q1, { ...q0, offset: 0.4 }, q0], timing);
    backdrop.current?.animate([{ opacity: out ? 1 : 0 }, { opacity: out ? 0 : 1 }], { ...timing, duration: MORPH_MS * 0.85 });

    shell.finished.then(() => {
      if (out) {
        done();
        return;
      }
      // Back into normal layout, exactly where the morph ended.
      el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      backdrop.current?.getAnimations().forEach((a) => a.cancel());
      el.removeAttribute("style");
      el.style.maxWidth = "760px";
      inner.style.width = "";
      done();
    }, done);
  };

  // Opening: the card renders in place (invisible), then grows out of the ? button.
  useLayoutEffect(() => {
    if (phase !== "opening") return;
    morph("in", () => setPhase("open"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const close = () => {
    if (phase !== "open") return;
    markSeen();
    setPhase("closing");
    morph("out", () => setPhase("docked"));
  };

  useClickOutside(card, phase === "open", close);

  useEffect(() => {
    if (phase !== "open") return;
    closeBtn.current?.focus({ preventScroll: true });
    // Captured first, so studio shortcuts (Space, R, ...) don't act behind the
    // card; buttons still work since nothing is prevented.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!mounted) return null;

  return (
    <div
      ref={backdrop}
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px] ${
        phase === "open" ? "" : "pointer-events-none"
      }`}
    >
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        className={`glass-panel relative w-full overflow-hidden rounded-[28px] ${first && phase === "open" ? "anim-pop" : ""}`}
        style={{ maxWidth: 760 }}
      >
        <div ref={content} className="p-2" style={{ transformOrigin: "top right" }}>
          {/* The clip's own shape (1920×912), so nothing is cropped. */}
          <div className="relative overflow-hidden rounded-[22px] bg-white/[0.04]" style={{ aspectRatio: "1920 / 912" }}>
            {!ready && <VideoLoader progress={progress} failed={failed} onRetry={retry} />}
            <video
              key={attempt}
              src={VIDEO}
              autoPlay={!still}
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              controls={false}
              onCanPlay={() => setReady(true)}
              onProgress={(e) => {
                const v = e.currentTarget;
                if (v.duration > 0 && v.buffered.length) {
                  setProgress(Math.min(1, v.buffered.end(v.buffered.length - 1) / v.duration));
                }
              }}
              onError={() => setFailed(true)}
              onContextMenu={(e) => e.preventDefault()}
              aria-label="Glass, ASCII and bricks layers moving with the new Motion settings"
              className={`size-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
            />
            <button
              ref={closeBtn}
              type="button"
              aria-label="Close"
              onClick={close}
              className="press absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-black/45 text-bone/85 backdrop-blur-md hover:bg-black/65 hover:text-bone"
            >
              <X size={17} />
            </button>
          </div>

          <div className="px-2 pb-2 pt-4 sm:px-3 sm:pb-3">
            <span className={`${rise} inline-flex rounded-full bg-ember/15 px-2.5 py-1 text-[11.5px] font-medium text-ember`}>
              New in the studio
            </span>
            <h2
              id="whats-new-title"
              className={`${rise} mt-3 font-display text-[24px] leading-[1.05] tracking-[-0.02em] text-bone sm:text-[30px]`}
              style={{ animationDelay: "60ms" }}
            >
              Every layer can move
            </h2>
            <p
              className={`${rise} mt-2 max-w-[560px] text-[13.5px] leading-relaxed text-bone/60 sm:text-[14.5px]`}
              style={{ animationDelay: "120ms" }}
            >
              Pick a layer, open Motion and choose Drift, Sway, Spin, Orbit or Random. Press Animate and the effect moves
              while your picture stays put.
            </p>
            <button
              type="button"
              onClick={close}
              className={`blue-button ${rise} mt-4 h-10 w-full rounded-full text-[13.5px] font-semibold`}
              style={{ animationDelay: "180ms" }}
            >
              Got it
            </button>
          </div>
        </div>

        {/* The ? the card becomes as it lands in the top bar. */}
        <span
          ref={glyph}
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center font-display text-[19px] text-bone/85 opacity-0"
        >
          ?
        </span>
      </div>
    </div>
  );
}
