import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("position", "Edge", -1, 1, 0.01),
  slider("angle", "Angle", -180, 180, 1),
  slider("amount", "Stretch", 0, 1, 0.01),
  slider("jitter", "Jitter", 0, 1, 0.01),
  slider("speed", "Speed", 0, 2, 0.01),
];

/** Slit-scan: everything past an edge is pulled out into long streaks. */
export default defineEffect({
  key: "stretch",
  label: "Stretch",
  category: "Distort",
  blurb: "Pulls everything past an edge out into long streaks.",
  controls,
  defaults: { position: 0, angle: 0, amount: 0.92, jitter: 0.2, speed: 0.3 },
  presets: {
    thumbBase: { gradient: magenta, pattern: { type: "dots", scale: 7, size: 0.45, angle: 0, softness: 0.05, background: "#0a0a0a" } },
    list: [
      p("str-slit", { name: "Slit scan", position: 0, angle: 0, amount: 1, jitter: 0, speed: 0 }),
      p("str-drip", { name: "Drip", position: 0.1, angle: -90, amount: 0.9, jitter: 0.6, speed: 0.4 }),
      p("str-pull", { name: "Pulled", position: -0.3, angle: 20, amount: 0.75, jitter: 0.25, speed: 0.2 }),
    ],
  },
  uniforms: (s) => ({
    uStrPos: n(s.stretch.position),
    uStrAngle: n(s.stretch.angle),
    uStrAmount: n(s.stretch.amount),
    uStrJitter: n(s.stretch.jitter),
    uStrSpeed: n(s.stretch.speed),
  }),
  glsl: /* glsl */ `
uniform float uStrPos;
uniform float uStrAngle;
uniform float uStrAmount;
uniform float uStrJitter;
uniform float uStrSpeed;

void main() {
  float a = radians(uStrAngle);
  // q.x runs along the stretch; the edge is a line across it.
  vec2 q = rot(-a) * fragP();
  float half_ = 0.5 * max(aspect(), 1.0 / aspect());
  float edge = uStrPos * half_;
  // Each streak's edge wobbles on its own, so the cut isn't a ruler line.
  edge += (noise(vec2(q.y * 38.0, uTime * uStrSpeed + uSeed)) - 0.5) * uStrJitter * 0.25;
  if (q.x > edge) q.x = edge + (q.x - edge) * (1.0 - uStrAmount);
  emit(inputAt(rot(a) * q));
}
`,
});
