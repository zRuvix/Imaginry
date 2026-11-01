import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("angle", "Twist", -720, 720, 1),
  slider("radius", "Radius", 0.05, 1.5, 0.01),
  slider("speed", "Spin", -3, 3, 0.01),
  slider("x", "Center X", -1, 1, 0.01),
  slider("y", "Center Y", -1, 1, 0.01),
];

/** Wrings the image around a point. */
export default defineEffect({
  key: "twirl",
  label: "Twirl",
  category: "Distort",
  blurb: "Wrings the image around a point.",
  controls,
  defaults: { angle: 240, radius: 0.6, speed: 0, x: 0, y: 0 },
  presets: {
    thumbBase: { gradient: magenta, pattern: { type: "stripes", scale: 9, size: 0.5, angle: 0, softness: 0.06, background: "#0a0a0a" } },
    list: [
      p("tw-whirl", { name: "Whirlpool", angle: 300, radius: 0.6, speed: 0, x: 0, y: 0 }),
      p("tw-gentle", { name: "Gentle", angle: 90, radius: 0.9, speed: 0, x: 0, y: 0 }),
      p("tw-spin", { name: "Spinning", angle: 180, radius: 0.5, speed: 1.5, x: -0.3, y: 0.2 }),
    ],
  },
  uniforms: (s) => ({
    uTwAngle: n(s.twirl.angle),
    uTwRadius: n(s.twirl.radius),
    uTwSpeed: n(s.twirl.speed),
    uTwCenter: [n(s.twirl.x), n(s.twirl.y)],
  }),
  glsl: /* glsl */ `
uniform float uTwAngle;
uniform float uTwRadius;
uniform float uTwSpeed;
uniform vec2 uTwCenter;

void main() {
  vec2 p = fragP();
  vec2 c = uTwCenter * vec2(aspect() * 0.5, 0.5);
  vec2 d = p - c;
  float falloff = max(1.0 - length(d) / max(uTwRadius, 0.01), 0.0);
  float a = radians(uTwAngle) * falloff * falloff + uTime * uTwSpeed * 0.3 * falloff;
  emit(inputAt(c + rot(a) * d));
}
`,
});
