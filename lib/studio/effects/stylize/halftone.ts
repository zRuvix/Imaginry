import { type Control, defineEffect, hexToRgb, magenta, mono, n, p, slider } from "../define";

const controls: Control[] = [
  slider("size", "Size", 3, 60, 0.5),
  slider("angle", "Angle", -90, 90, 1),
  { key: "mono", label: "Mono", type: "toggle" },
  { key: "ink", label: "Ink", type: "color" },
  { key: "paper", label: "Paper", type: "color" },
];

/** Print-style dot screens. */
export default defineEffect({
  key: "halftone",
  label: "Halftone",
  category: "Stylize",
  blurb: "Print-style dot screens.",
  controls,
  defaults: {
    size: 12,
    angle: 45,
    mono: true,
    ink: "#111111",
    paper: "#f2efe6",
  },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("h-news", { size: 10, angle: 45, mono: true, ink: "#111111", paper: "#f2efe6" }),
      p("h-coarse", { size: 24, angle: 15, mono: true, ink: "#1b1bb3", paper: "#f4f1ea" }),
      p("h-color", { size: 12, angle: 45, mono: false, ink: "#111111", paper: "#f2efe6" }),
      p("h-pop", { size: 20, angle: 0, mono: false, ink: "#111111", paper: "#f2efe6" }),
    ],
  },
  uniforms: (s) => ({
    uHalfSize: n(s.halftone.size),
    uHalfAngle: n(s.halftone.angle),
    uHalfMono: s.halftone.mono ? 1 : 0,
    uHalfInk: hexToRgb(String(s.halftone.ink)),
    uHalfPaper: hexToRgb(String(s.halftone.paper)),
  }),
  glsl: /* glsl */ `
uniform float uHalfSize;
uniform float uHalfAngle;
uniform float uHalfMono;
uniform vec3 uHalfInk;
uniform vec3 uHalfPaper;

void main() {
  vec2 fc = gl_FragCoord.xy;
  float cs = max(uHalfSize * unit(), 2.0);
  mat2 r = rot(radians(uHalfAngle));
  vec2 rf = r * fc;
  vec2 cell = floor(rf / cs);
  vec2 local = fract(rf / cs) - 0.5;
  vec3 c = inputFc(transpose(r) * ((cell + 0.5) * cs));
  float l = luma(c);
  float aa = 1.5 / cs;
  if (uHalfMono > 0.5) {
    float rad = sqrt(1.0 - l) * 0.7;
    emit(mix(uHalfPaper, uHalfInk, 1.0 - smoothstep(rad - aa, rad + aa, length(local))));
  } else {
    float rad = sqrt(l) * 0.7;
    emit(mix(vec3(0.03), c * 1.1, 1.0 - smoothstep(rad - aa, rad + aa, length(local))));
  }
}
`,
});
