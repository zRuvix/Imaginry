"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Renderer } from "@/lib/studio/renderer";
import type { StudioState } from "@/lib/studio/schema";

export const ASPECTS = {
  fill: null,
  "1:1": 1,
  "6:5": 6 / 5,
  "5:4": 5 / 4,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
  "2:1": 2,
  "5:6": 5 / 6,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
  "2:3": 2 / 3,
  "9:16": 9 / 16,
  "1:2": 1 / 2,
} as const;

export const LANDSCAPE_ASPECTS: Aspect[] = ["6:5", "5:4", "4:3", "3:2", "16:9", "2:1"];
export const PORTRAIT_ASPECTS: Aspect[] = ["5:6", "4:5", "3:4", "2:3", "9:16", "1:2"];

export type Aspect = keyof typeof ASPECTS;

const PAD = 8;
const MAX_DPR = 1.5;

const renderers = new WeakMap<HTMLCanvasElement, Renderer>();

type Props = {
  state: StudioState;
  image: HTMLImageElement | null;
  aspect: Aspect;
  playing: boolean;
  speed: number;
  timeRef: RefObject<number>;
  sizeRef: RefObject<{ width: number; height: number }>;
  onDropImage: (file: File) => void;
  onResize?: (size: { width: number; height: number }) => void;
  /** Where the stage sits between the floating panels. */
  style?: CSSProperties;
  children?: ReactNode;
};

export default function Stage({
  state,
  image,
  aspect,
  playing,
  speed,
  timeRef,
  sizeRef,
  onDropImage,
  onResize,
  style,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const dirty = useRef(true);
  const live = useRef({ state, playing, speed });
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    live.current = { state, playing, speed };
    dirty.current = true;
  }, [state, playing, speed]);

  // Context loss (GPU reset, driver hiccup): stop drawing, rebuild on restore.
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const lost = (e: Event) => {
      e.preventDefault();
      renderers.delete(canvas);
      rendererRef.current = null;
      setError("The GPU reset the canvas. Restoring…");
    };
    const restored = () => {
      setError(null);
      setGeneration((g) => g + 1);
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, []);

  // Renderer + frame loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    try {
      // Reuse across Strict Mode re-runs so the shaders compile only once.
      let renderer = renderers.get(canvas);
      if (!renderer) {
        renderer = new Renderer(canvas);
        renderers.set(canvas, renderer);
      }
      rendererRef.current = renderer;
      renderer.ready.then(
        () => (dirty.current = true),
        (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const { state, playing, speed } = live.current;
      if (playing) timeRef.current += dt * speed;
      if (playing || dirty.current) {
        dirty.current = false;
        rendererRef.current?.render(state, timeRef.current);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      rendererRef.current = null;
    };
  }, [timeRef, generation]);

  useEffect(() => {
    rendererRef.current?.setImage(image);
    dirty.current = true;
  }, [image, generation]);

  // Fit the canvas into the stage for the chosen aspect ratio
  useEffect(() => {
    const el = containerRef.current!;
    const fit = () => {
      const w = el.clientWidth - PAD * 2;
      const h = el.clientHeight - PAD * 2;
      const ratio = ASPECTS[aspect];
      if (!ratio) return setBox({ width: w, height: h });
      const width = Math.min(w, h * ratio);
      setBox({ width, height: width / ratio });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    sizeRef.current = { width: canvas.width, height: canvas.height };
    dirty.current = true;
    onResize?.(box);
  }, [box, sizeRef, onResize]);

  return (
    <div
      ref={containerRef}
      className="absolute flex items-center justify-center transition-[top,left,right,bottom] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={style}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith("image/")) onDropImage(file);
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: box.width, height: box.height }}
        className="block rounded-[22px] bg-surface shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]"
      />
      {children}
      {dragging && (
        <div className="anim-pop pointer-events-none absolute inset-2 flex items-center justify-center rounded-[22px] bg-ember/15 backdrop-blur-sm">
          <span className="rounded-full bg-ink/80 px-4 py-2 text-[14px] text-bone">Drop to use as the base image</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-2 flex items-center justify-center whitespace-pre-wrap rounded-[22px] bg-surface p-6 text-center font-mono text-xs text-bone/60">
          {error}
        </div>
      )}
    </div>
  );
}
