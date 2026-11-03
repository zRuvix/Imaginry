"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";

type Body = { x: number; y: number; vx: number; vy: number; r: number; spin: number; held: boolean };

const GRAVITY = 2400;
const BOUNCE = 0.34;
/** Relative sizes; the pit width sets the base radius. */
const SIZES = [1, 0.78, 1.18, 0.66, 0.92, 1.3, 0.72, 1.05, 0.86, 1.12, 0.7, 0.96];

/** One step of a small circle-only world: gravity, walls, then pairwise pushes. */
function step(bodies: Body[], w: number, h: number, dt: number) {
  for (const b of bodies) {
    if (b.held) continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y + b.r > h) {
      b.y = h - b.r;
      b.vy = Math.abs(b.vy) < 60 ? 0 : -b.vy * BOUNCE;
      b.vx *= 0.94;
    }
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx) * 0.5;
    } else if (b.x + b.r > w) {
      b.x = w - b.r;
      b.vx = -Math.abs(b.vx) * 0.5;
    }
    b.spin += (b.vx * dt) / b.r;
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const c = bodies[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const min = a.r + c.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        // Held pebbles are immovable; otherwise heavier ones give less.
        const ia = a.held ? 0 : 1 / (a.r * a.r);
        const ic = c.held ? 0 : 1 / (c.r * c.r);
        const sum = ia + ic;
        if (!sum) continue;
        const push = (min - d) / sum;
        a.x -= nx * push * ia;
        a.y -= ny * push * ia;
        c.x += nx * push * ic;
        c.y += ny * push * ic;
        const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        if (rel < 0) {
          const imp = (-(1 + BOUNCE) * rel) / sum;
          a.vx -= imp * nx * ia;
          a.vy -= imp * ny * ia;
          c.vx += imp * nx * ic;
          c.vy += imp * ny * ic;
        }
      }
    }
  }
}

/**
 * Round swatches of fresh renders that drop into the pit once `drop` turns
 * true, pile up on the floor, and can be grabbed and thrown.
 */
export default function Pebbles({ urls, drop }: { urls: (string | null)[]; drop: boolean }) {
  const pit = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    if (!drop) return;
    const box = pit.current!;
    let w = box.clientWidth;
    let h = box.clientHeight;
    const base = Math.min(64, Math.max(26, w / 22));
    bodies.current = SIZES.map((s, i) => ({
      x: base * 1.5 + Math.random() * (w - base * 3),
      // Staggered above the pit so they rain in one after another.
      y: -base * 2 - i * base * 1.1 - Math.random() * base,
      vx: (Math.random() - 0.5) * 300,
      vy: 0,
      r: base * s,
      spin: Math.random() * 6,
      held: false,
    }));

    const paint = () => {
      bodies.current.forEach((b, i) => {
        const el = els.current[i];
        if (!el) return;
        el.style.width = el.style.height = `${b.r * 2}px`;
        el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0) rotate(${b.spin}rad)`;
        el.style.opacity = "1";
      });
    };

    if (prefersReducedMotion()) {
      for (let i = 0; i < 900; i++) step(bodies.current, w, h, 1 / 60);
      paint();
    }

    let raf = 0;
    let last = 0;
    let still = 0;
    let visible = true;
    const frame = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
      last = now;
      // Two substeps keep fast throws from tunnelling through the pile.
      step(bodies.current, w, h, dt / 2);
      step(bodies.current, w, h, dt / 2);
      paint();
      // Resting pebbles still pick up a sliver of gravity each step, so "still" is a loose threshold.
      const moving = bodies.current.some((b) => b.held || Math.abs(b.vx) + Math.abs(b.vy) > 45);
      still = moving ? 0 : still + 1;
      raf = visible && still < 30 ? requestAnimationFrame(frame) : 0;
    };
    const start = () => {
      still = 0;
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wake.current = start;
    if (!prefersReducedMotion()) start();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(box);
    const ro = new ResizeObserver(() => {
      w = box.clientWidth;
      h = box.clientHeight;
      start();
    });
    ro.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      wake.current = () => {};
    };
  }, [drop]);

  const grab = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bodies.current[i];
    if (!b) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = pit.current!.getBoundingClientRect();
    const off = { x: e.clientX - box.left - b.x, y: e.clientY - box.top - b.y };
    let lastT = performance.now();
    b.held = true;
    b.vx = b.vy = 0;
    wake.current();
    const el = e.currentTarget;
    const move = (ev: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT) / 1000;
      lastT = now;
      const nx = ev.clientX - box.left - off.x;
      const ny = ev.clientY - box.top - off.y;
      // Keep a smoothed velocity so letting go throws it.
      b.vx = b.vx * 0.5 + ((nx - b.x) / dt) * 0.5;
      b.vy = b.vy * 0.5 + ((ny - b.y) / dt) * 0.5;
      b.x = nx;
      b.y = ny;
    };
    const up = () => {
      b.held = false;
      const cap = 4000;
      b.vx = Math.max(-cap, Math.min(cap, b.vx));
      b.vy = Math.max(-cap, Math.min(cap, b.vy));
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      wake.current();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  return (
    <div ref={pit} aria-hidden className="absolute inset-0">
      {SIZES.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            els.current[i] = el;
          }}
          onPointerDown={grab(i)}
          className="absolute left-0 top-0 cursor-grab touch-none select-none overflow-hidden rounded-full bg-[var(--surface)] shadow-[0_16px_30px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10 will-change-transform active:cursor-grabbing"
          style={{ opacity: 0 }}
        >
          {urls[i % urls.length] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urls[i % urls.length]!} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}
