/**
 * Layer motion: a move any layer can have on top of its own animation.
 *
 * The layer's pattern (glass flutes, grain, bricks, a gradient, ...) is moved
 * while the picture underneath stays put: the shader header shifts the
 * layer's coordinates by the offset and rotation from `motionAt`, and samples
 * the layer below through the inverse (see effects/common.ts).
 *
 * `tempo` is separate: it speeds up or slows down the effect's own built-in
 * animation (the clock its shader sees).
 */

export const MOTIONS = ["off", "drift", "sway", "spin", "orbit", "random"] as const;
export type MotionType = (typeof MOTIONS)[number];

export type LayerMotion = {
  type: MotionType;
  /** Degrees, 0 = to the right, 90 = up. Used by drift and sway. */
  angle: number;
  /** Negative runs it the other way. */
  speed: number;
  /** How far sway, orbit and random travel, 0–1. */
  distance: number;
  /** Random only: how small the patches that wander on their own are (0 big swirls, 1 about one dot or character). */
  scatter: number;
  /** Multiplier for the effect's own animation clock. */
  tempo: number;
};

export const MOTION_DEFAULTS: LayerMotion = { type: "off", angle: 0, speed: 0.5, distance: 0.5, scatter: 0.6, tempo: 1 };

const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return v == null || v === "" || !Number.isFinite(n) ? fallback : n;
};

/** A section's motion, with defaults for designs saved before motion existed. */
export function motionOf(section: Record<string, unknown>): LayerMotion {
  const type = MOTIONS.includes(section.motion as MotionType) ? (section.motion as MotionType) : "off";
  return {
    type,
    angle: num(section.motionAngle, MOTION_DEFAULTS.angle),
    speed: num(section.motionSpeed, MOTION_DEFAULTS.speed),
    distance: num(section.motionDistance, MOTION_DEFAULTS.distance),
    scatter: Math.min(1, Math.max(0, num(section.motionScatter, MOTION_DEFAULTS.scatter))),
    tempo: Math.max(0, num(section.tempo, MOTION_DEFAULTS.tempo)),
  };
}

/** Default values to put on a fresh section. */
export function motionDefaults() {
  return {
    motion: MOTION_DEFAULTS.type,
    motionAngle: MOTION_DEFAULTS.angle,
    motionSpeed: MOTION_DEFAULTS.speed,
    motionDistance: MOTION_DEFAULTS.distance,
    motionScatter: MOTION_DEFAULTS.scatter,
    tempo: MOTION_DEFAULTS.tempo,
  };
}

/** Where a layer's pattern sits at one moment. */
export type MotionFrame = {
  /** Offset in units of the canvas's shorter side. */
  off: [number, number];
  /** Rotation about the centre, radians. */
  rot: number;
  /**
   * Random wander: [amplitude (shorter-side units), patches per shorter side,
   * clock]. Each patch of the pattern drifts around its home on its own.
   */
  wander: [number, number, number];
  /** Random for cell-based effects: [amplitude in cells, clock]. */
  cell: [number, number];
};

const STILL: MotionFrame["wander"] = [0, 0, 0];

/**
 * Patch wander for effects without cells. Each patch travels at most about a
 * third of its own size, so the pattern shimmers and flows instead of tearing.
 */
function wanderFor(distance: number, scatter: number, clock: number): MotionFrame["wander"] {
  const patches = 2 + 58 * scatter ** 1.5;
  return [(distance * 0.6) / patches, patches, clock];
}
const NO_CELL: MotionFrame["cell"] = [0, 0];

/**
 * The layer's motion at time `t` seconds; `cells` for effects drawn as cells.
 * Kept in step with MOTION_JS below, which the embeds run.
 */
export function motionAt(m: LayerMotion, t: number, cells = false): MotionFrame {
  const a = (m.angle * Math.PI) / 180;
  const dir: [number, number] = [Math.cos(a), Math.sin(a)];
  switch (m.type) {
    case "drift": {
      const d = m.speed * 0.08 * t;
      return { off: [dir[0] * d, dir[1] * d], rot: 0, wander: STILL, cell: NO_CELL };
    }
    case "sway": {
      const d = m.distance * 0.25 * Math.sin(t * m.speed * 1.5);
      return { off: [dir[0] * d, dir[1] * d], rot: 0, wander: STILL, cell: NO_CELL };
    }
    case "spin":
      return { off: [0, 0], rot: m.speed * 0.3 * t, wander: STILL, cell: NO_CELL };
    case "orbit": {
      const w = t * m.speed * 1.2;
      const r = m.distance * 0.15;
      return { off: [Math.cos(w) * r, Math.sin(w) * r], rot: 0, wander: STILL, cell: NO_CELL };
    }
    case "random": {
      const clock = t * m.speed * 0.8;
      // Cell effects move each cell on their own; everything else wanders in patches.
      return cells
        ? { off: [0, 0], rot: 0, wander: STILL, cell: [Math.min(0.8, m.distance * 0.9), clock] }
        : { off: [0, 0], rot: 0, wander: wanderFor(m.distance, m.scatter, clock), cell: NO_CELL };
    }
    default:
      return { off: [0, 0], rot: 0, wander: STILL, cell: NO_CELL };
  }
}

/**
 * Compact form for embeds: [type index, angle, speed, distance, scatter, cells?], or undefined
 * when the layer doesn't move.
 */
export function packMotion(m: LayerMotion, cells = false): number[] | undefined {
  if (m.type === "off") return undefined;
  const packed = [MOTIONS.indexOf(m.type), +m.angle.toFixed(2), +m.speed.toFixed(3), +m.distance.toFixed(3), +m.scatter.toFixed(3)];
  return cells ? [...packed, 1] : packed;
}

/** `motionAt` for the embed runtime (ES5, takes the packed form). */
export const MOTION_JS = `function motionAt(m, t) {
  var still = [0, 0, 0], none = [0, 0];
  if (!m) return { off: [0, 0], rot: 0, wander: still, cell: none };
  var a = m[1] * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), d;
  if (m[0] === 1) { d = m[2] * 0.08 * t; return { off: [dx * d, dy * d], rot: 0, wander: still, cell: none }; }
  if (m[0] === 2) { d = m[3] * 0.25 * Math.sin(t * m[2] * 1.5); return { off: [dx * d, dy * d], rot: 0, wander: still, cell: none }; }
  if (m[0] === 3) return { off: [0, 0], rot: m[2] * 0.3 * t, wander: still, cell: none };
  if (m[0] === 4) { var w = t * m[2] * 1.2, r = m[3] * 0.15; return { off: [Math.cos(w) * r, Math.sin(w) * r], rot: 0, wander: still, cell: none }; }
  if (m[0] === 5) {
    var clock = t * m[2] * 0.8, sc = m[4] == null ? 0.6 : m[4];
    if (m[5]) return { off: [0, 0], rot: 0, wander: still, cell: [Math.min(0.8, m[3] * 0.9), clock] };
    var f = 2 + 58 * Math.pow(sc, 1.5);
    return { off: [0, 0], rot: 0, wander: [m[3] * 0.6 / f, f, clock], cell: none };
  }
  return { off: [0, 0], rot: 0, wander: still, cell: none };
}`;
