import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("count", "Repeats", 1, 12, 0.1),
  slider("gap", "Gap", 0, 0.4, 0.01),
  slider("rotate", "Rotate", -180, 180, 1),
  { key: "mirror", label: "Mirror tiles", type: "toggle" },
  { key: "gapColor", label: "Gap color", type: "color" },
];

/** Repeats the image in a grid, optionally mirrored like wallpaper. */
export default defineEffect({
  key: "tile",
  label: "Tile",
  category: "Distort",
  blurb: "Repeats the image in a grid, like wallpaper.",
  controls,
  defaults: { count: 3, gap: 0.04, rotate: 0, mirror: true, gapColor: "#0d0c0b" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("ti-grid", { name: "Grid", count: 3, gap: 0.06, rotate: 0, mirror: false, gapColor: "#0d0c0b" }),
      p("ti-wall", { name: "Wallpaper", count: 4, gap: 0, rotate: 0, mirror: true, gapColor: "#0d0c0b" }),
      p("ti-diag", { name: "Diagonal", count: 3, gap: 0.03, rotate: 45, mirror: true, gapColor: "#f2ece0" }),
    ],
  },
  uniforms: (s) => ({
    uTlCount: n(s.tile.count) || 1,
    uTlGap: n(s.tile.gap),
    uTlRotate: n(s.tile.rotate),
    uTlMirror: s.tile.mirror ? 1 : 0,
    uTlGapColor: hexToRgb(String(s.tile.gapColor)),
  }),
  glsl: /* glsl */ `
uniform float uTlCount;
uniform float uTlGap;
uniform float uTlRotate;
uniform float uTlMirror;
uniform vec3 uTlGapColor;

void main() {
  vec2 q = rot(radians(uTlRotate)) * fragP() * uTlCount;
  vec2 id = floor(q + 0.5);
  vec2 f = q - id;
  if (uTlMirror > 0.5) {
    if (mod(id.x, 2.0) > 0.5) f.x = -f.x;
    if (mod(id.y, 2.0) > 0.5) f.y = -f.y;
  }
  float inside = step(max(abs(f.x), abs(f.y)), 0.5 - uTlGap * 0.5);
  emit(mix(uTlGapColor, inputAt(f / max(1.0 - uTlGap, 0.01)), inside));
}
`,
});
