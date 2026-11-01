import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("amount", "Amount", 0, 1, 0.01),
  slider("angle", "Angle", -180, 180, 1),
  slider("jitter", "Glitch", 0, 1, 0.01),
];

/** Pulls the color channels apart. */
export default defineEffect({
  key: "rgbshift",
  label: "RGB Split",
  category: "Glass & optics",
  blurb: "Pulls the color channels apart.",
  controls,
  defaults: { amount: 0.3, angle: 0, jitter: 0 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("rg-subtle", { name: "Subtle", amount: 0.2, angle: 0, jitter: 0 }),
      p("rg-glitch", { name: "Glitch", amount: 0.45, angle: 0, jitter: 0.7 }),
      p("rg-wide", { name: "Wide", amount: 0.8, angle: 90, jitter: 0 }),
    ],
  },
  uniforms: (s) => ({
    uRgbAmount: n(s.rgbshift.amount),
    uRgbAngle: n(s.rgbshift.angle),
    uRgbJitter: n(s.rgbshift.jitter),
  }),
  glsl: /* glsl */ `
uniform float uRgbAmount;
uniform float uRgbAngle;
uniform float uRgbJitter;

void main() {
  vec2 p = fragP();
  float a = radians(uRgbAngle);
  vec2 d = vec2(cos(a), sin(a)) * uRgbAmount * 0.04;
  if (uRgbJitter > 0.0) {
    float band = hash(vec2(floor(uTime * 10.0), floor(p.y * 36.0)));
    d *= 1.0 + (band - 0.5) * uRgbJitter * 4.0;
    p.x += step(0.93, band) * (band - 0.95) * uRgbJitter * 0.6;
  }
  emit(vec3(inputAt(p + d).r, inputAt(p).g, inputAt(p - d).b));
}
`,
});
