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
  // Built from cells: Random motion moves each cell on its own.
  cells: true,
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
  float cs = max(uHalfSize * unit(), 2.0 * px());
  mat2 r = rot(radians(uHalfAngle));
  vec2 rf = r * fc;
  vec2 home = floor(rf / cs);
  vec2 lf = fract(rf / cs);
  float aa = 1.5 / cs;
  int reach = cellReach();
  float cover = 0.0;
  vec3 dotColor = vec3(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      if (abs(i) > reach || abs(j) > reach) continue;
      vec2 g = vec2(float(i), float(j));
      vec2 cell = home + g;
      vec2 local = lf - g - 0.5 - cellWander(cell);
      vec3 c = inputFc(transpose(r) * ((cell + 0.5) * cs));
      float l = luma(c);
      float rad = (uHalfMono > 0.5 ? sqrt(1.0 - l) : sqrt(l)) * 0.7;
      float k = 1.0 - smoothstep(rad - aa, rad + aa, length(local));
      if (k > cover || (i == 0 && j == 0 && cover == 0.0)) {
        cover = max(cover, k);
        dotColor = c;
      }
    }
  }
  if (uHalfMono > 0.5) emit(mix(uHalfPaper, uHalfInk, cover));
  else emit(mix(vec3(0.03), dotColor * 1.1, cover));
}
`,
});
