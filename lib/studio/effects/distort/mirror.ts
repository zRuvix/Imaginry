import { type Control, defineEffect, n, opt, p, slider, violet } from "../define";

const controls: Control[] = [
  { key: "mode", label: "Axis", type: "select", options: ["horizontal", "vertical", "quad", "diagonal"] },
  slider("offset", "Offset", -1, 1, 0.01),
];

/** Perfect symmetry, any axis. */
export default defineEffect({
  key: "mirror",
  label: "Mirror",
  category: "Distort",
  blurb: "Perfect symmetry, any axis.",
  controls,
  defaults: { mode: "horizontal", offset: 0 },
  presets: {
    thumbBase: { gradient: violet },
    list: [
      p("mi-h", { name: "Book", mode: "horizontal", offset: 0 }),
      p("mi-v", { name: "Lake", mode: "vertical", offset: 0 }),
      p("mi-q", { name: "Quad", mode: "quad", offset: 0 }),
      p("mi-d", { name: "Diagonal", mode: "diagonal", offset: 0 }),
    ],
  },
  uniforms: (s) => ({
    uMirrorMode: opt(controls, "mode", s.mirror.mode),
    uMirrorOffset: n(s.mirror.offset),
  }),
  glsl: /* glsl */ `
uniform float uMirrorMode;
uniform float uMirrorOffset;

void main() {
  vec2 p = fragP();
  float o = uMirrorOffset * 0.5;
  int m = int(uMirrorMode + 0.5);
  if (m == 0 || m == 2) p.x = o + abs(p.x - o);
  if (m == 1 || m == 2) p.y = o + abs(p.y - o);
  if (m == 3 && p.y > p.x) p = p.yx;
  emit(inputAt(p));
}
`,
});
