"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  CHANNELS,
  cleanPoints,
  formatCurves,
  IDENTITY,
  MAX_POINTS,
  parseCurves,
  spline,
  type Channel,
  type CurvePoint,
  type Curves,
} from "@/lib/studio/curves";
import { Segmented } from "./controls";

const COLOR: Record<Channel, string> = {
  rgb: "var(--bone)",
  red: "#ff6b5e",
  green: "#5be39a",
  blue: "#6aa8ff",
};
const SHORT: Record<Channel, string> = { rgb: "RGB", red: "R", green: "G", blue: "B" };

/** Plot size in SVG units; the plot itself stretches to the panel width. */
const S = 256;
/** Margin around the plot so edge points aren't clipped. */
const PAD = 6;
/** How close (in screen px) a press has to be to grab a point. */
const GRAB = 12;
/** Dragging a middle point this far (screen px) outside the plot removes it. */
const TEAR = 28;

function pathFor(points: CurvePoint[]) {
  const f = spline(points);
  let d = "";
  for (let i = 0; i <= 128; i++) {
    const x = i / 128;
    d += `${i ? "L" : "M"}${(x * S).toFixed(1)} ${((1 - f(x)) * S).toFixed(1)}`;
  }
  return d;
}

/**
 * Point curves like a photo editor's, built for play: pick RGB or a channel,
 * drag points, click anywhere to add one, double-click (or drag it off the
 * plot) to remove it. Arrow keys nudge the selected point, Delete removes it.
 */
export default function CurveEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const curves = useMemo(() => parseCurves(value), [value]);
  const [channel, setChannel] = useState<Channel>("rgb");
  const [active, setActive] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ index: number; tearing: boolean } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  // Pointer events can arrive faster than React renders, so the live curve and
  // drag sit in refs; state only drives what's drawn.
  const live = useRef(curves);
  // Re-sync from props on every render (undo, presets, another channel).
  live.current = curves;
  const dragRef = useRef<{ index: number; tearing: boolean } | null>(null);
  const points = curves[channel];
  const commit = (next: Partial<Curves>) => {
    live.current = { ...live.current, ...next };
    onChange(formatCurves(live.current));
  };
  const startDrag = (d: { index: number; tearing: boolean } | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  /** Pointer position on the plot as 0..255 levels, plus how far outside it is (px). */
  const locate = (e: { clientX: number; clientY: number }) => {
    const r = svg.current!.getBoundingClientRect();
    // The viewBox has PAD units of margin around the S-unit plot.
    const unit = r.width / (S + PAD * 2);
    const fx = ((e.clientX - r.left) / unit - PAD) / S;
    const fy = ((e.clientY - r.top) / unit - PAD) / S;
    const outside = Math.max(-(e.clientY - r.top), e.clientY - r.bottom, -(e.clientX - r.left), e.clientX - r.right, 0);
    return { x: fx * 255, y: (1 - fy) * 255, outside, scale: unit };
  };

  /** Moves point `i` to (x, y), kept between its neighbours so the order never flips. */
  const moveTo = (pts: CurvePoint[], i: number, x: number, y: number) => {
    const lo = i === 0 ? 0 : pts[i - 1][0] + 1;
    const hi = i === pts.length - 1 ? 255 : pts[i + 1][0] - 1;
    const next = pts.map((p) => [...p] as CurvePoint);
    next[i] = [Math.round(Math.min(hi, Math.max(lo, x))), Math.round(Math.min(255, Math.max(0, y)))];
    return next;
  };

  const remove = (i: number) => {
    const pts = live.current[channel];
    if (i === 0 || i === pts.length - 1) return;
    commit({ [channel]: pts.filter((_, j) => j !== i) });
    setActive(null);
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const at = locate(e);
    const pts = live.current[channel];
    // Nearest point within grabbing distance, measured on screen.
    let hit = -1;
    let best = GRAB / at.scale;
    pts.forEach(([px, py], i) => {
      const d = Math.hypot(px - at.x, py - at.y) * (S / 255);
      if (d < best) {
        best = d;
        hit = i;
      }
    });
    if (hit === -1) {
      if (pts.length >= MAX_POINTS) return;
      const x = Math.round(at.x);
      if (pts.some((p) => p[0] === x)) return;
      const next = cleanPoints([...pts, [x, Math.round(at.y)]]);
      hit = next.findIndex((p) => p[0] === x);
      commit({ [channel]: next });
    }
    svg.current!.setPointerCapture(e.pointerId);
    setActive(hit);
    startDrag({ index: hit, tearing: false });
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const pts = live.current[channel];
    const at = locate(e);
    const tearing = d.index > 0 && d.index < pts.length - 1 && at.outside > TEAR;
    if (tearing !== d.tearing) startDrag({ ...d, tearing });
    if (!tearing) commit({ [channel]: moveTo(pts, d.index, at.x, at.y) });
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    if (d?.tearing) remove(d.index);
    startDrag(null);
  };

  const onDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const at = locate(e);
    const i = points.findIndex(([px, py]) => Math.hypot(px - at.x, py - at.y) * (S / 255) < GRAB / at.scale);
    if (i > 0) remove(i);
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (active == null || !points[active]) return;
    const step = e.shiftKey ? 10 : 1;
    const [x, y] = points[active];
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [x - step, y],
      ArrowRight: [x + step, y],
      ArrowUp: [x, y + step],
      ArrowDown: [x, y - step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      commit({ [channel]: moveTo(points, active, ...moves[e.key]) });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove(active);
    } else if (e.key === "Tab" && !e.altKey) {
      // Tab walks through the points before leaving the plot.
      const next = active + (e.shiftKey ? -1 : 1);
      if (next >= 0 && next < points.length) {
        e.preventDefault();
        setActive(next);
      }
    }
  };

  const shown = active != null ? points[active] : null;
  const color = COLOR[channel];
  const changed = (ch: Channel) => formatCurves({ ...parseCurves(""), [ch]: curves[ch] }) !== formatCurves(parseCurves(""));

  return (
    <div className="space-y-2.5">
      <Segmented
        label="Curve channel"
        size="sm"
        value={channel}
        options={CHANNELS}
        onChange={(ch) => {
          setChannel(ch);
          setActive(null);
        }}
        render={(ch) => (
          <span className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full transition-transform duration-300 ${changed(ch) ? "scale-100" : "scale-0"}`}
              style={{ background: ch === "rgb" ? "currentColor" : COLOR[ch] }}
            />
            {SHORT[ch]}
          </span>
        )}
      />

      <div className="relative">
        <svg
          ref={svg}
          viewBox={`${-PAD} ${-PAD} ${S + PAD * 2} ${S + PAD * 2}`}
          role="application"
          aria-label={`${SHORT[channel]} curve. Click to add a point, drag to move, double-click to remove. Arrow keys move the selected point.`}
          tabIndex={0}
          className={`block aspect-square w-full touch-none select-none rounded-[14px] bg-white/[0.035] outline-none focus-visible:ring-2 focus-visible:ring-bone/40 ${
            drag ? "cursor-grabbing" : "cursor-crosshair"
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          onKeyDown={onKeyDown}
          onFocus={() => active == null && setActive(0)}
        >
          <defs>
            <linearGradient id="cv-in" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#000" />
              <stop offset="1" stopColor={channel === "rgb" ? "#fff" : color} />
            </linearGradient>
            <linearGradient id="cv-out" x1="0" x2="0" y1="1" y2="0">
              <stop offset="0" stopColor="#000" />
              <stop offset="1" stopColor={channel === "rgb" ? "#fff" : color} />
            </linearGradient>
            <filter id="cv-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Quarter grid and the untouched diagonal. */}
          {[64, 128, 192].map((v) => (
            <g key={v} stroke="rgba(237,231,220,0.07)" strokeWidth={1}>
              <line x1={v} y1={0} x2={v} y2={S} />
              <line x1={0} y1={v} x2={S} y2={v} />
            </g>
          ))}
          <line x1={0} y1={S} x2={S} y2={0} stroke="rgba(237,231,220,0.14)" strokeWidth={1} strokeDasharray="3 4" />

          {/* Input and output ramps along the edges. */}
          <rect x={0} y={S + 2} width={S} height={3} rx={1.5} fill="url(#cv-in)" />
          <rect x={-5} y={0} width={3} height={S} rx={1.5} fill="url(#cv-out)" />

          {/* The other curves, faint, so a grade reads as a whole. */}
          {CHANNELS.filter((ch) => ch !== channel && changed(ch)).map((ch) => (
            <path key={ch} d={pathFor(curves[ch])} fill="none" stroke={COLOR[ch]} strokeOpacity={0.3} strokeWidth={1.25} />
          ))}

          <path d={pathFor(points)} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={5} filter="url(#cv-glow)" />
          <path d={pathFor(points)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />

          {points.map(([px, py], i) => {
            const on = i === active;
            const tearing = drag?.index === i && drag.tearing;
            return (
              <circle
                key={i}
                cx={(px / 255) * S}
                cy={(1 - py / 255) * S}
                r={on ? 6 : 4.5}
                fill={on ? color : "var(--ink)"}
                stroke={color}
                strokeWidth={2}
                opacity={tearing ? 0.25 : 1}
                className="transition-[r,opacity] duration-200"
              />
            );
          })}
        </svg>

        {shown && (
          <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 font-outfit text-[11.5px] tabular-nums text-bone/80 backdrop-blur-md">
            {drag?.tearing ? "Release to remove" : `In ${shown[0]} · Out ${shown[1]}`}
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => commit({ [channel]: points.map(([x, y]) => [x, 255 - y] as CurvePoint) })}
          className="press h-8 flex-1 rounded-[10px] bg-white/[0.05] text-[12.5px] text-bone/70 hover:bg-white/[0.09] hover:text-bone"
        >
          Flip
        </button>
        <button
          type="button"
          disabled={!changed(channel)}
          onClick={() => {
            commit({ [channel]: IDENTITY });
            setActive(null);
          }}
          className="press h-8 flex-1 rounded-[10px] bg-white/[0.05] text-[12.5px] text-bone/70 hover:bg-white/[0.09] hover:text-bone disabled:pointer-events-none disabled:opacity-35"
        >
          Reset {SHORT[channel]}
        </button>
      </div>
    </div>
  );
}
