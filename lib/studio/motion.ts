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

// Saved designs, share links and embeds store a motion by its index here:
// only ever add to the end.
export const MOTIONS = ["off", "drift", "sway", "spin", "orbit", "random", "rock", "breathe", "bounce", "float", "weave", "shake"] as const;

/** Motions that go somewhere: they use the direction. */
export const DIRECTIONAL: readonly MotionType[] = ["drift", "sway", "bounce"];
/** Motions with a size: they use the distance. */
export const RANGED: readonly MotionType[] = ["sway", "orbit", "random", "rock", "breathe", "bounce", "float", "weave", "shake"];
export type MotionType = (typeof MOTIONS)[number];

export type LayerMotion = {
  type: MotionType;
  /** Degrees, 0 = to the right, 90 = up. Used by drift, sway and bounce. */
  angle: number;
  /** Negative runs it the other way. */
  speed: number;
  /** How far the ranged motions travel (swing, zoom, shake…), 0–1. */
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
  /** Zoom about the centre, as a natural log: 0 is none, so embeds that predate it stay still. */
  zoom: number;
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
      return { off: [dir[0] * d, dir[1] * d], rot: 0, zoom: 0, wander: STILL, cell: NO_CELL };
    }
    case "sway": {
      const d = m.distance * 0.25 * Math.sin(t * m.speed * 1.5);
      return { off: [dir[0] * d, dir[1] * d], rot: 0, zoom: 0, wander: STILL, cell: NO_CELL };
    }
    case "spin":
      return { off: [0, 0], rot: m.speed * 0.3 * t, zoom: 0, wander: STILL, cell: NO_CELL };
    case "orbit": {
      const w = t * m.speed * 1.2;
      const r = m.distance * 0.15;
      return { off: [Math.cos(w) * r, Math.sin(w) * r], rot: 0, zoom: 0, wander: STILL, cell: NO_CELL };
    }
    case "random": {
      const clock = t * m.speed * 0.8;
      // Cell effects move each cell on their own; everything else wanders in patches.
      return cells
        ? { off: [0, 0], rot: 0, zoom: 0, wander: STILL, cell: [Math.min(0.8, m.distance * 0.9), clock] }
        : { off: [0, 0], rot: 0, zoom: 0, wander: wanderFor(m.distance, m.scatter, clock), cell: NO_CELL };
    }
    case "rock":
      // A pendulum about the centre: up to about 35° either way.
      return { off: [0, 0], rot: m.distance * 0.6 * Math.sin(t * m.speed * 1.5), zoom: 0, wander: STILL, cell: NO_CELL };
    case "breathe":
      // Slow zoom in and out, up to about a third bigger or smaller.
      return { off: [0, 0], rot: 0, zoom: m.distance * 0.3 * Math.sin(t * m.speed * 1.2), wander: STILL, cell: NO_CELL };
    case "bounce": {
      // Hops along the direction and drops back, touching down sharply like a ball.
      const d = m.distance * 0.2 * Math.abs(Math.sin(t * m.speed * 1.6));
      return { off: [dir[0] * d, dir[1] * d], rot: 0, zoom: 0, wander: STILL, cell: NO_CELL };
    }
    case "float": {
      // Bobbing on water: up and down, a slower side drift and a slight tilt.
      const w = t * m.speed * 1.2;
      const r = m.distance * 0.09;
      return { off: [Math.sin(w * 0.63) * r * 0.45, Math.sin(w) * r], rot: Math.sin(w * 0.8 + 1) * m.distance * 0.07, zoom: 0, wander: STILL, cell: NO_CELL };
    }
    case "weave": {
      // A figure 8 around the spot.
      const w = t * m.speed;
      const r = m.distance * 0.18;
      return { off: [Math.sin(w) * r, Math.sin(2 * w) * r * 0.5], rot: 0, zoom: 0, wander: STILL, cell: NO_CELL };
    }
    case "shake": {
      // Stop-motion jitter: a new nudge on every step; speed sets steps per second.
      const k = Math.floor(t * (4 + 10 * Math.abs(m.speed)));
      const amp = m.distance * 0.025;
      return {
        off: [(shakeHash(k) - 0.5) * amp, (shakeHash(k + 17) - 0.5) * amp],
        rot: (shakeHash(k + 5) - 0.5) * m.distance * 0.05,
        zoom: 0,
        wander: STILL,
        cell: NO_CELL,
      };
    }
    default:
      return { off: [0, 0], rot: 0, zoom: 0, wander: STILL, cell: NO_CELL };
  }
}

/** Repeatable 0–1 noise for shake's steps (the embed runtime uses the same formula). */
function shakeHash(k: number) {
  const x = Math.sin(k * 12.9898) * 43758.5453;
  return x - Math.floor(x);
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
  function f(off, rot, zoom) { return { off: off, rot: rot, zoom: zoom || 0, wander: still, cell: none }; }
  function h(k) { var x = Math.sin(k * 12.9898) * 43758.5453; return x - Math.floor(x); }
  if (!m) return f([0, 0], 0);
  var a = m[1] * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), d;
  if (m[0] === 1) { d = m[2] * 0.08 * t; return f([dx * d, dy * d], 0); }
  if (m[0] === 2) { d = m[3] * 0.25 * Math.sin(t * m[2] * 1.5); return f([dx * d, dy * d], 0); }
  if (m[0] === 3) return f([0, 0], m[2] * 0.3 * t);
  if (m[0] === 4) { var w = t * m[2] * 1.2, r = m[3] * 0.15; return f([Math.cos(w) * r, Math.sin(w) * r], 0); }
  if (m[0] === 5) {
    var clock = t * m[2] * 0.8, sc = m[4] == null ? 0.6 : m[4];
    if (m[5]) return { off: [0, 0], rot: 0, zoom: 0, wander: still, cell: [Math.min(0.8, m[3] * 0.9), clock] };
    var fp = 2 + 58 * Math.pow(sc, 1.5);
    return { off: [0, 0], rot: 0, zoom: 0, wander: [m[3] * 0.6 / fp, fp, clock], cell: none };
  }
  if (m[0] === 6) return f([0, 0], m[3] * 0.6 * Math.sin(t * m[2] * 1.5));
  if (m[0] === 7) return f([0, 0], 0, m[3] * 0.3 * Math.sin(t * m[2] * 1.2));
  if (m[0] === 8) { d = m[3] * 0.2 * Math.abs(Math.sin(t * m[2] * 1.6)); return f([dx * d, dy * d], 0); }
  if (m[0] === 9) { var fw = t * m[2] * 1.2, fr = m[3] * 0.09; return f([Math.sin(fw * 0.63) * fr * 0.45, Math.sin(fw) * fr], Math.sin(fw * 0.8 + 1) * m[3] * 0.07); }
  if (m[0] === 10) { var ww = t * m[2], wr = m[3] * 0.18; return f([Math.sin(ww) * wr, Math.sin(2 * ww) * wr * 0.5], 0); }
  if (m[0] === 11) { var k = Math.floor(t * (4 + 10 * Math.abs(m[2]))), sa = m[3] * 0.025; return f([(h(k) - 0.5) * sa, (h(k + 17) - 0.5) * sa], (h(k + 5) - 0.5) * m[3] * 0.05); }
  return f([0, 0], 0);
}`;
