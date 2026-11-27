"use client";

import { motion, useInView, type Variants } from "motion/react";
import { useRef, type CSSProperties, type ReactNode } from "react";
import "./figs.css";

/*
 * Small isometric line drawings, one per feature. Each is built from boxes
 * projected at 30°, drawn back to front so the page-coloured fills hide the
 * lines behind them. Lines draw in when the figure enters the screen, a
 * quiet loop keeps it alive, and hovering the feature column moves it.
 */

const C = Math.cos(Math.PI / 6);
const S = 0.5;
type P3 = [number, number, number];

const pt = ([x, y, z]: P3) => `${((x - y) * C).toFixed(2)} ${((x + y) * S - z).toFixed(2)}`;
const poly = (pts: P3[], close = true) => `M${pts.map(pt).join("L")}${close ? "Z" : ""}`;

function faces(x: number, y: number, z: number, w: number, d: number, h: number) {
  return {
    top: poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]),
    right: poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]),
    left: poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]),
  };
}

/** Circle lying flat at height z. */
function flatCircle(cx: number, cy: number, z: number, r: number) {
  const pts: P3[] = Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
  });
  return poly(pts, false);
}

/** 2D polyline drawn on a card's front face (the plane y = fy), u along x, v up. */
function onFace(fx: number, fy: number, fz: number, uv: [number, number][], close = false) {
  return poly(uv.map(([u, v]) => [fx + u, fy, fz + v] as P3), close);
}

const INK = "#0e1a2b";
const ACCENT = "#1d4fbf";
const FILL = { top: "#f6f8fb", right: "#e7ecf2", left: "#dde4ed" };

const EASE = [0.16, 1, 0.3, 1] as const;
const REST = { x: 0, y: 0, transition: { type: "spring", stiffness: 170, damping: 18 } } as const;

/** Idle loop in CSS, paused while the figure is off screen. */
const loop = (live: boolean, anim: string, delay: number): CSSProperties => ({
  animation: `${anim} ease-in-out ${delay}s infinite`,
  animationPlayState: live ? "running" : "paused",
});
const draw: Variants = {
  hidden: { pathLength: 0, fillOpacity: 0 },
  shown: (i: number = 0) => ({
    pathLength: 1,
    fillOpacity: 1,
    transition: {
      pathLength: { duration: 1.3, ease: EASE, delay: i * 0.06 },
      fillOpacity: { duration: 0.6, ease: "easeOut", delay: 0.5 + i * 0.06 },
    },
  }),
};

function Line({ d, i = 0, accent = false, fill }: { d: string; i?: number; accent?: boolean; fill?: string }) {
  return (
    <motion.path
      d={d}
      custom={i}
      variants={draw}
      fill={fill ?? "none"}
      stroke={accent ? ACCENT : INK}
      strokeOpacity={accent ? 0.75 : 0.5}
      strokeWidth={1}
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Box({ x, y, z, w, d, h, i = 0 }: { x: number; y: number; z: number; w: number; d: number; h: number; i?: number }) {
  const f = faces(x, y, z, w, d, h);
  return (
    <>
      <Line d={f.left} i={i} fill={FILL.left} />
      <Line d={f.right} i={i} fill={FILL.right} />
      <Line d={f.top} i={i} fill={FILL.top} />
    </>
  );
}

/** Dashed footprint on the ground under a figure. */
function Footprint({ x, y, w, d }: { x: number; y: number; w: number; d: number }) {
  return (
    <motion.path
      d={poly([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]])}
      variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 1, delay: 0.2 } } }}
      fill="none"
      stroke={INK}
      strokeOpacity={0.22}
      strokeDasharray="2 4"
      vectorEffect="non-scaling-stroke"
    />
  );
}

/** Shared frame: one viewBox for every figure so they sit at the same scale. */
function Fig({ label, children }: { label: string; children: (live: boolean) => ReactNode }) {
  const ref = useRef<SVGSVGElement>(null);
  const live = useInView(ref, { margin: "0px 0px -10% 0px" });
  return (
    <motion.svg
      ref={ref}
      viewBox="-125 -165 250 235"
      role="img"
      aria-label={label}
      className="h-auto w-full max-w-[280px] overflow-visible"
      variants={{ hidden: {}, shown: {} }}
    >
      {children(live)}
    </motion.svg>
  );
}

/* FIG 0.1 — a stack of layers; the top one carries a gradient's rings. Hover fans them apart. */
export function LayersFig() {
  const n = 5;
  return (
    <Fig label="Five stacked layers, the top one marked with concentric rings">
      {() => (
        <g transform="translate(0 6)">
          <Footprint x={-55} y={-55} w={110} d={110} />
          {Array.from({ length: n }, (_, i) => (
            <motion.g
              key={i}
              variants={{ shown: REST, hover: { y: -i * 9, transition: { type: "spring", stiffness: 180, damping: 18 } } }}
            >
              <Box x={-55} y={-55} z={i * 14} w={110} d={110} h={8} i={i} />
              {i === n - 1 &&
                [34, 24, 14].map((r, k) => (
                  <Line key={r} d={flatCircle(0, 0, i * 14 + 8, r)} i={n + k} accent={k === 0} />
                ))}
            </motion.g>
          ))}
        </g>
      )}
    </Fig>
  );
}

/* FIG 0.2 — a row of plates whose heights trace a wave that keeps travelling. */
export function MotionFig() {
  const count = 13;
  return (
    <Fig label="A row of thin plates rising and falling in a travelling wave">
      {(live) => (
        <g transform="translate(-4 12)">
          <Footprint x={-80} y={-40} w={164} d={80} />
          {Array.from({ length: count }, (_, i) => {
            const h = 34 + 44 * (0.5 + 0.5 * Math.sin(i * 0.55 - 0.6));
            return (
              <motion.g
                key={i}
                variants={{ shown: REST, hover: { y: -6 - i * 0.6, transition: { type: "spring", stiffness: 200, damping: 16, delay: i * 0.02 } } }}
              >
                <g className="fig-loop" style={loop(live, "fig-wave 1.8s", i * 0.11)}>
                  <Box x={-80 + i * 13} y={-40} z={0} w={3} d={80} h={h} i={i * 0.5} />
                </g>
              </motion.g>
            );
          })}
        </g>
      )}
    </Fig>
  );
}

/* FIG 0.3 — three standing cards: a still, a loop, and code. Hover spreads them. */
export function ExportFig() {
  const cards = [
    { h: 100, glyph: "still" },
    { h: 86, glyph: "loop" },
    { h: 72, glyph: "code" },
  ] as const;
  // Moving one unit along +y in screen space
  const step = (k: number) => ({ x: -k * C, y: k * S });

  return (
    <Fig label="Three standing cards fanned out: an image, a video loop and code">
      {(live) => (
        <g transform="translate(-4 6)">
          <Footprint x={-44} y={-58} w={88} d={100} />
          {cards.map((c, i) => {
            const y = -52 + i * 34;
            const fy = y + 3;
            const fx = -40;
            const spread = (i - 1) * 16;
            let glyph: ReactNode = null;
            if (c.glyph === "still") {
              const ring = (r: number): [number, number][] =>
                Array.from({ length: 41 }, (_, k) => {
                  const a = (k / 40) * Math.PI * 2;
                  return [40 + Math.cos(a) * r, 54 + Math.sin(a) * r];
                });
              glyph = [26, 16].map((r, k) => <Line key={r} d={onFace(fx, fy, 0, ring(r))} i={4 + k} accent={k === 0} />);
            } else if (c.glyph === "loop") {
              glyph = (
                <Line d={onFace(fx, fy, 0, [[32, 30], [32, 56], [54, 43], [32, 30]])} i={5} accent />
              );
            } else {
              glyph = (
                <>
                  <Line d={onFace(fx, fy, 0, [[28, 46], [20, 36], [28, 26]])} i={6} accent />
                  <Line d={onFace(fx, fy, 0, [[52, 46], [60, 36], [52, 26]])} i={6} accent />
                  <Line d={onFace(fx, fy, 0, [[44, 48], [36, 24]])} i={6} accent />
                </>
              );
            }
            return (
              <motion.g
                key={i}
                variants={{ shown: REST, hover: { ...step(spread), transition: { type: "spring", stiffness: 170, damping: 17 } } }}
              >
                <g className="fig-loop" style={loop(live, "fig-float 3.2s", i * 0.4)}>
                  <Box x={fx} y={y} z={0} w={80} d={3} h={c.h} i={i} />
                  {glyph}
                </g>
              </motion.g>
            );
          })}
        </g>
      )}
    </Fig>
  );
}

/* FIG 0.4 — a cluster of blocks, each with a small marker; they lift in turn as if at work. */
export function AgentsFig() {
  const s = 46;
  // Back to front; the raised block sits on the back one.
  const blocks: P3[] = [
    [-50, -50, 0],
    [-50, -50, s + 4],
    [0, -50, 0],
    [-50, 0, 0],
    [0, 0, 0],
  ];
  return (
    <Fig label="A cluster of five cubes, each marked with a small square, lifting in turn">
      {(live) => (
        <g transform="translate(0 20)">
          <Footprint x={-54} y={-54} w={104} d={104} />
          {blocks.map(([x, y, z], i) => (
            <motion.g
              key={i}
              variants={{ shown: REST, hover: { y: -10, transition: { type: "spring", stiffness: 200, damping: 15, delay: i * 0.04 } } }}
            >
              <g className="fig-loop" style={loop(live, "fig-work 4s", i * 0.8)}>
                <Box x={x} y={y} z={z} w={s} d={s} h={s} i={i} />
                <Line
                  d={poly([
                    [x + 17, y + 17, z + s],
                    [x + 29, y + 17, z + s],
                    [x + 29, y + 29, z + s],
                    [x + 17, y + 29, z + s],
                  ])}
                  i={i + 3}
                  accent
                />
              </g>
            </motion.g>
          ))}
        </g>
      )}
    </Fig>
  );
}
