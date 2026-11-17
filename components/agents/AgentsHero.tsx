"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, Check, Compare } from "@/components/icons";
import { Words } from "@/components/home/scene";
import { prefersReducedMotion } from "@/components/landing/motion";
import { useLookImages } from "@/components/landing/useLookImages";
import { GALLERY, stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { encodeShare } from "@/lib/studio/storage";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Five gallery looks fanned out under the headline, the centre one "made" by the agent. */
const FAN_NAMES = ["Cobalt Bloom", "Oil Slick", "Ember Reeds", "Corrupted", "Planetoid"];
const FAN: CuratedLook[] = FAN_NAMES.map((n) => GALLERY.find((l) => l.name === n)).filter((l): l is CuratedLook => !!l);
const LINKS = FAN.map((look) => `/studio#${encodeShare(stateForLook(look))}`);

/** Slot geometry: offset in card widths from centre, rise, tilt and parallax depth. */
const SLOTS = [
  { x: -2.05, y: 10, r: -13, depth: 0.5 },
  { x: -1.03, y: 2, r: -6, depth: 0.8 },
  { x: 0, y: 0, r: -1.5, depth: 1.2 },
  { x: 1.03, y: 3, r: 6, depth: 0.8 },
  { x: 2.05, y: 11, r: 13, depth: 0.5 },
];

/** Ember specks that drift up through the hero. Fixed so the markup is the same on server and client. */
const SPECKS = [
  [6, 14, 3, 0], [14, 62, 2, 4], [21, 30, 4, 9], [29, 78, 2, 2], [37, 18, 3, 12],
  [46, 54, 2, 6], [55, 24, 3, 1], [63, 70, 2, 10], [71, 36, 4, 5], [79, 82, 2, 13],
  [86, 20, 3, 7], [93, 58, 2, 3], [10, 88, 3, 11], [50, 90, 2, 8], [90, 40, 3, 14],
] as const;

/** A pill button with its arrow in a round badge, like the studio's own buttons. */
export function PillButton({
  href,
  onClick,
  primary,
  icon,
  children,
}: {
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const cls = `pill-cta group ${primary ? "pill-cta--primary" : ""}`;
  const inner = (
    <>
      <span>{children}</span>
      <span aria-hidden className="pill-cta__badge">
        {icon ?? <ArrowRight size={14} />}
      </span>
    </>
  );
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Eases the fan toward the pointer, a little more for the cards in front. */
function usePointerDrift(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

export default function AgentsHero({ endpoint, copied, onCopy }: { endpoint: string; copied: boolean; onCopy: () => void }) {
  const images = useLookImages(FAN, 760);
  const fan = useRef<HTMLDivElement>(null);
  usePointerDrift(fan);

  return (
    <section id="top" className="agents-hero" style={{ "--h": 1 } as CSSProperties} aria-labelledby="agents-h">
      <div aria-hidden className="agents-hero__glow" />
      <div aria-hidden className="agents-specks">
        {SPECKS.map(([left, top, size, delay], i) => (
          <span
            key={i}
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, animationDelay: `-${delay}s`, "--sway": `${(i % 3) - 1}` } as CSSProperties}
          />
        ))}
      </div>

      <div className="wrap relative z-10 flex flex-col items-center text-center">
        <p data-rise className="inline-flex h-8 items-center gap-2 rounded-full bg-[var(--ember)]/[0.12] px-4 font-condensed text-[13.5px] font-semibold tracking-[0.06em] text-[var(--ember)] uppercase">
          Imaginry MCP · Live now
        </p>
        <h1 id="agents-h" className="h1 mt-5 max-w-[19ch] text-[var(--bone)]">
          <Words text="Your agent can now" delay={100} />{" "}
          <span className="text-[var(--bone)]/40">
            <Words text="paint the background." delay={340} />
          </span>
        </h1>
        <p data-rise style={d(560)} className="lead mt-5 max-w-[54ch]">
          Connect Claude, Cursor, ChatGPT or VS Code to Imaginry. Your agent picks from 51 live effects and hands back a
          studio link or embed code. Free, no API key.
        </p>
        <div data-rise style={d(700)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <PillButton primary onClick={onCopy} icon={copied ? <Check size={14} /> : <Compare size={14} />}>
            <span aria-live="polite">{copied ? "Copied the URL" : "Copy server URL"}</span>
          </PillButton>
          <PillButton href="#setup">Set it up</PillButton>
        </div>
        <p data-rise style={d(800)} className="mt-4 font-mono text-[13px] text-[var(--bone)]/45">
          {endpoint.replace(/^https?:\/\//, "")}
        </p>
      </div>

      {/* The fan: rises in once, then floats; leans toward the pointer. */}
      <div ref={fan} className="agents-fan" aria-label="Designs made with Imaginry">
        {FAN.map((look, i) => {
          const s = SLOTS[i];
          return (
            <div
              key={look.name}
              className="agents-fan__slot"
              style={{ "--i": s.x, "--y": `${s.y}%`, "--r": `${s.r}deg`, "--depth": s.depth, "--n": Math.abs(i - 2), zIndex: 10 - Math.abs(i - 2) } as CSSProperties}
            >
              <div className="agents-fan__para">
                <div className="agents-fan__float">
                  <Link href={LINKS[i]} className="agents-fan__card still-ground" aria-label={`Open ${look.name} in the studio`}>
                    {images[i] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={images[i]!} alt="" className="anim-pop" />
                    )}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
