import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("size", "Spacing", 3, 24, 0.5),
  slider("angle", "Angle", -90, 90, 1),
  { key: "ink", label: "Ink", type: "color" },
  { key: "paper", label: "Paper", type: "color" },
];

/** Pen-and-ink shading: more crossing strokes in the darks. */
export default defineEffect({
  key: "crosshatch",
  label: "Cross-Hatch",
  category: "Stylize",
  blurb: "Pen-and-ink shading, denser in the darks.",
  controls,
  defaults: { size: 8, angle: 45, ink: "#1b1612", paper: "#f3ecdf" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("ch-ink", { name: "Ink", size: 8, angle: 45, ink: "#1b1612", paper: "#f3ecdf" }),
      p("ch-blue", { name: "Blueprint", size: 6, angle: 30, ink: "#e8f1ff", paper: "#1c3f7a" }),
      p("ch-sepia", { name: "Sepia", size: 11, angle: 60, ink: "#4a2a12", paper: "#f0dcb8" }),
    ],
  },
  uniforms: (s) => ({
    uChSize: n(s.crosshatch.size),
    uChAngle: n(s.crosshatch.angle),
    uChInk: hexToRgb(String(s.crosshatch.ink)),
    uChPaper: hexToRgb(String(s.crosshatch.paper)),
  }),
  glsl: /* glsl */ `
uniform float uChSize;
uniform float uChAngle;
uniform vec3 uChInk;
uniform vec3 uChPaper;

float hatch(vec2 fc, float a, float s) {
  vec2 q = rot(a) * fc / s;
  float d = abs(fract(q.y) - 0.5);
  return 1.0 - smoothstep(0.06, 0.06 + 1.2 / s, d);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float s = max(uChSize * unit(), 2.0);
  float a = radians(uChAngle);
  float l = luma(inputFc(fc));
  float ink = 0.0;
  if (l < 0.8) ink = max(ink, hatch(fc, a, s));
  if (l < 0.6) ink = max(ink, hatch(fc, a + 1.5708, s));
  if (l < 0.4) ink = max(ink, hatch(fc, a + 0.785, s));
  if (l < 0.2) ink = max(ink, hatch(fc, a - 0.785, s * 0.7));
  emit(mix(uChPaper, uChInk, ink));
}
`,
});
