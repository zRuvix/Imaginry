"use client";

import { useEffect, useRef } from "react";
import { stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { Renderer } from "@/lib/studio/renderer";

const renderers = new WeakMap<HTMLCanvasElement, Renderer>();

/**
 * An animated look on its own canvas. It only draws while on screen and
 * `running`; `resolution` < 1 renders fewer pixels (fine under a blur).
 */
export default function LiveLook({
  look,
  className,
  running = true,
  speed = 1,
  resolution = 1,
}: {
  look: CuratedLook;
  className?: string;
  running?: boolean;
  speed?: number;
  resolution?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(running);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    runningRef.current = running;
    wake.current();
  }, [running]);

  useEffect(() => {
    const canvas = ref.current!;
    // Reused across Strict Mode re-runs: losing the context would leave the
    // canvas with a dead one.
    let renderer = renderers.get(canvas);
    if (!renderer) {
      try {
        renderer = new Renderer(canvas);
      } catch {
        return;
      }
      renderers.set(canvas, renderer);
    }
    const r = renderer;
    const state = stateForLook(look);
    let raf = 0;
    let visible = false;
    let time = look.time ?? 0;
    let last = performance.now();

    const frame = (now: number) => {
      time += Math.min((now - last) / 1000, 0.1) * speed;
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * resolution;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      r.render(state, time, 900 / Math.max(1, Math.min(w, h) / resolution));
      raf = visible && runningRef.current ? requestAnimationFrame(frame) : 0;
    };
    const start = () => {
      if (raf || !visible || !runningRef.current) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wake.current = start;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
      wake.current = () => {};
    };
  }, [look, speed, resolution]);

  return <canvas ref={ref} className={className} />;
}
