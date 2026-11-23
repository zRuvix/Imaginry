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

export const MOTIONS = ["off", "drift", "sway", "spin", "orbit"] as const;
export type MotionType = (typeof MOTIONS)[number];

export type LayerMotion = {
  type: MotionType;
  /** Degrees, 0 = to the right, 90 = up. Used by drift and sway. */
  angle: number;
  /** Negative runs it the other way. */
  speed: number;
  /** How far sway and orbit travel, 0–1. */
  distance: number;
  /** Multiplier for the effect's own animation clock. */
  tempo: number;
};

export const MOTION_DEFAULTS: LayerMotion = { type: "off", angle: 0, speed: 0.5, distance: 0.5, tempo: 1 };

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
    tempo: MOTION_DEFAULTS.tempo,
  };
}

/**
 * Offset (in units of the canvas's shorter side) and rotation (radians) at
 * time `t` seconds. Kept in step with MOTION_JS below, which the embeds run.
 */
export function motionAt(m: LayerMotion, t: number): { off: [number, number]; rot: number } {
  const a = (m.angle * Math.PI) / 180;
  const dir: [number, number] = [Math.cos(a), Math.sin(a)];
  switch (m.type) {
    case "drift": {
      const d = m.speed * 0.08 * t;
      return { off: [dir[0] * d, dir[1] * d], rot: 0 };
    }
    case "sway": {
      const d = m.distance * 0.25 * Math.sin(t * m.speed * 1.5);
      return { off: [dir[0] * d, dir[1] * d], rot: 0 };
    }
    case "spin":
      return { off: [0, 0], rot: m.speed * 0.3 * t };
    case "orbit": {
      const w = t * m.speed * 1.2;
      const r = m.distance * 0.15;
      return { off: [Math.cos(w) * r, Math.sin(w) * r], rot: 0 };
    }
    default:
      return { off: [0, 0], rot: 0 };
  }
}

/**
 * Compact form for embeds: [type index, angle, speed, distance], or undefined
 * when the layer doesn't move.
 */
export function packMotion(m: LayerMotion): [number, number, number, number] | undefined {
  if (m.type === "off") return undefined;
  return [MOTIONS.indexOf(m.type), +m.angle.toFixed(2), +m.speed.toFixed(3), +m.distance.toFixed(3)];
}

/** `motionAt` for the embed runtime (ES5, takes the packed form). */
export const MOTION_JS = `function motionAt(m, t) {
  if (!m) return { off: [0, 0], rot: 0 };
  var a = m[1] * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), d;
  if (m[0] === 1) { d = m[2] * 0.08 * t; return { off: [dx * d, dy * d], rot: 0 }; }
  if (m[0] === 2) { d = m[3] * 0.25 * Math.sin(t * m[2] * 1.5); return { off: [dx * d, dy * d], rot: 0 }; }
  if (m[0] === 3) return { off: [0, 0], rot: m[2] * 0.3 * t };
  if (m[0] === 4) { var w = t * m[2] * 1.2, r = m[3] * 0.15; return { off: [Math.cos(w) * r, Math.sin(w) * r], rot: 0 }; }
  return { off: [0, 0], rot: 0 };
}`;
