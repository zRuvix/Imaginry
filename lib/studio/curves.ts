/**
 * Color curves: a master (RGB) curve and one per channel, each a list of
 * points on 0..255. Stored as one compact string so it survives saved designs
 * and share links untouched:
 *
 *   "0-0_64-40_192-215_255-255~~~"   master ~ red ~ green ~ blue
 *
 * Points are "x-y" joined by "_"; an empty channel is the straight line.
 */

export type CurvePoint = [x: number, y: number];
export const CHANNELS = ["rgb", "red", "green", "blue"] as const;
export type Channel = (typeof CHANNELS)[number];
export type Curves = Record<Channel, CurvePoint[]>;

export const IDENTITY: CurvePoint[] = [
  [0, 0],
  [255, 255],
];
export const MAX_POINTS = 12;
/** Samples in the lookup table the shader reads (vec3 each). */
export const LUT_SIZE = 64;

const clamp = (v: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, v));

/** Sorted, de-duplicated, clamped; always at least two points. */
export function cleanPoints(points: CurvePoint[]): CurvePoint[] {
  const sorted = points
    .map(([x, y]) => [clamp(Math.round(x)), clamp(Math.round(y))] as CurvePoint)
    .sort((a, b) => a[0] - b[0]);
  const out: CurvePoint[] = [];
  for (const p of sorted) if (!out.length || p[0] > out[out.length - 1][0]) out.push(p);
  return out.length >= 2 ? out.slice(0, MAX_POINTS) : IDENTITY.map((p) => [...p] as CurvePoint);
}

const isIdentity = (pts: CurvePoint[]) =>
  pts.length === 2 && pts[0][0] === 0 && pts[0][1] === 0 && pts[1][0] === 255 && pts[1][1] === 255;

export function parseCurves(value: unknown): Curves {
  const parts = String(value ?? "").split("~");
  const out = {} as Curves;
  CHANNELS.forEach((ch, i) => {
    const pts = (parts[i] ?? "")
      .split("_")
      .map((p) => p.split("-").map(Number))
      .filter((p) => p.length === 2 && p.every(Number.isFinite)) as CurvePoint[];
    out[ch] = cleanPoints(pts);
  });
  return out;
}

export function formatCurves(curves: Curves): string {
  return CHANNELS.map((ch) => {
    const pts = cleanPoints(curves[ch]);
    return isIdentity(pts) ? "" : pts.map(([x, y]) => `${x}-${y}`).join("_");
  }).join("~");
}

/** Shorthand for presets: master points, then optional channel points. */
export const curves = (rgb: CurvePoint[], red: CurvePoint[] = IDENTITY, green = IDENTITY, blue = IDENTITY) =>
  formatCurves({ rgb, red, green, blue });

/**
 * Monotone cubic (Fritsch–Carlson) through the points: smooth like a pen
 * curve, but it never overshoots between two points, so no surprise bands.
 * Returns a function from 0..1 to 0..1.
 */
export function spline(points: CurvePoint[]) {
  const pts = cleanPoints(points);
  const xs = pts.map((p) => p[0] / 255);
  const ys = pts.map((p) => p[1] / 255);
  const n = xs.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    // Flat beyond the end points, like every curves tool.
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const y =
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    return Math.min(1, Math.max(0, y));
  };
}

/**
 * The lookup table the shader samples: for each input level, the output of
 * that channel's curve followed by the master curve, as vec3s.
 */
export function bakeLut(value: unknown): number[] {
  const c = parseCurves(value);
  const master = spline(c.rgb);
  const ch = [spline(c.red), spline(c.green), spline(c.blue)];
  const out: number[] = [];
  for (let i = 0; i < LUT_SIZE; i++) {
    const x = i / (LUT_SIZE - 1);
    for (const f of ch) out.push(master(f(x)));
  }
  return out;
}

/** A gentle random grade, for the shuffle button: an S or fade plus a tint. */
export function randomCurves(): string {
  const r = (a: number, b: number) => Math.round(a + Math.random() * (b - a));
  const lift = Math.random() < 0.5 ? r(0, 40) : 0;
  const rgb: CurvePoint[] = [
    [0, lift],
    [64, r(30, 80)],
    [192, r(175, 225)],
    [255, r(215, 255)],
  ];
  const tint = (): CurvePoint[] => [
    [0, r(0, 30)],
    [128, r(105, 150)],
    [255, r(225, 255)],
  ];
  return curves(rgb, tint(), tint(), tint());
}
