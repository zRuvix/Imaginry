"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import { stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { encodeShare } from "@/lib/studio/storage";
import { prefersReducedMotion } from "./motion";

/** Radians per second when left alone. */
const IDLE_SPEED = 0.07;
/** Below this many pixels of movement a press counts as a click. */
const CLICK_SLOP = 6;

/**
 * Designs riding a slow elliptical orbit. Drag or flick to spin it (with
 * inertia), scrolling nudges it along, and clicking a card opens that look in
 * the studio. Cards are placed in 2D every frame so they always face forward.
 */
export default function Orbit({ looks, urls }: { looks: CuratedLook[]; urls: (string | null)[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const motion = useRef({ rot: 0, vel: 0, boost: 0, dragging: false, lastX: 0, moved: 0, lastT: 0 });

  // Scrolling gives the ring a push in the scroll direction.
  useLenis(({ velocity }) => {
    motion.current.boost += velocity * 0.00025;
  });

  useEffect(() => {
    const el = wrap.current!;
    const m = motion.current;
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const layout = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const rx = Math.min(w * 0.44, 640);
      const ry = Math.min(h * 0.1, 56);
      const n = cards.current.length;
      // Caption only the single card nearest the front.
      const norm = (((m.rot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
      const frontIndex = Math.round((1 - norm) * n) % n;
      cards.current.forEach((card, i) => {
        if (!card) return;
        const a = (i / n) * Math.PI * 2 + m.rot;
        const depth = (Math.cos(a) + 1) / 2; // 1 = front, 0 = back
        const x = Math.sin(a) * rx;
        const y = Math.cos(a) * ry; // front of the ring sits lower
        const scale = 0.5 + 0.5 * depth;
        card.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) scale(${scale.toFixed(3)})`;
        card.style.zIndex = String(Math.round(depth * 100));
        card.style.opacity = (0.18 + 0.82 * depth ** 1.6).toFixed(3);
        // Blur is the costly part (the card re-rasterizes whenever it changes),
        // so it moves in half-pixel steps and is only written when it does.
        const b = depth < 0.5 ? Math.round((0.5 - depth) * 16) / 2 : 0;
        if (card.dataset.blur !== String(b)) {
          card.dataset.blur = String(b);
          card.style.filter = b ? `blur(${b}px)` : "none";
        }
        const front = i === frontIndex ? "1" : "0";
        if (card.dataset.front !== front) card.dataset.front = front;
      });
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!m.dragging) {
        m.rot += (reduced ? 0 : IDLE_SPEED) * dt + m.vel + m.boost;
        m.vel *= 0.95;
      }
      m.boost *= 0.9;
      if (visible && !el.closest('[data-covered="1"]')) layout();
      raf = requestAnimationFrame(frame);
    };
    layout();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const radiansPerPx = () => 1 / Math.max(260, (wrap.current?.clientWidth ?? 800) * 0.44);

  return (
    <div
      ref={wrap}
      className="relative h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerDown={(e) => {
        const m = motion.current;
        m.dragging = true;
        m.lastX = e.clientX;
        m.lastT = performance.now();
        m.moved = 0;
        m.vel = 0;
      }}
      onPointerMove={(e) => {
        const m = motion.current;
        if (!m.dragging) return;
        const dx = e.clientX - m.lastX;
        const now = performance.now();
        const step = dx * radiansPerPx();
        m.rot += step;
        // Velocity per frame (~16ms), so a flick keeps spinning.
        m.vel = (step / Math.max(1, now - m.lastT)) * 16;
        m.moved += Math.abs(dx);
        // Capture only once it's clearly a drag, so plain clicks still reach the card.
        if (m.moved > CLICK_SLOP && !e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        m.lastX = e.clientX;
        m.lastT = now;
      }}
      onPointerUp={() => (motion.current.dragging = false)}
      onPointerCancel={() => (motion.current.dragging = false)}
      onClickCapture={(e) => {
        // A drag shouldn't open the card it ended on.
        if (motion.current.moved > CLICK_SLOP) e.preventDefault();
      }}
    >
      {looks.map((look, i) => (
        <a
          key={look.name}
          ref={(el) => {
            cards.current[i] = el;
          }}
          href={`/studio#${encodeShare(stateForLook(look))}`}
          draggable={false}
          aria-label={`Open “${look.name}” in the studio`}
          className="group absolute left-1/2 top-1/2 block w-[clamp(132px,15vw,220px)] will-change-transform"
        >
          <div className="relative aspect-[4/5]">
            {urls[i] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urls[i]!}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute inset-[10%] h-[80%] w-[80%] scale-110 object-cover opacity-45 blur-2xl"
              />
            )}
            <div className="relative h-full overflow-hidden rounded-[16px] bg-[var(--surface)] ring-1 ring-white/10">
              {urls[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[i]!} alt={look.name} draggable={false} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full animate-pulse bg-[var(--surface)]" />
              )}
            </div>
          </div>
          {/* Only the card at the front shows its caption */}
          <div className="mt-3 text-center font-condensed leading-tight opacity-0 transition-opacity duration-700 group-data-[front=1]:opacity-100">
            <p className="text-[15px] font-semibold text-[var(--bone)]">{look.name}</p>
            <p className="text-[13px] text-[var(--dim)]">{look.recipe}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
