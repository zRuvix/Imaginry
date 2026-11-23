import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";
import { CURSOR_CONTROLS, CURSOR_DEFAULTS, cursorGlsl, cursorUniforms } from "./common";

const controls: Control[] = [
  { key: "background", label: "Background", type: "color" },
  { key: "dot", label: "Dots", type: "color" },
  { key: "glow", label: "Near the cursor", type: "color" },
  slider("cells", "Density", 0.3, 3, 0.01),
  slider("size", "Size", 0.05, 0.9, 0.01),
  slider("push", "Push", -1, 1, 0.01),
  slider("reach", "Reach", 0.05, 0.8, 0.01),
  slider("wave", "Idle wave", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
  ...CURSOR_CONTROLS,
];

/** A calm dot grid that swells, lights up and parts around the cursor. */
export default defineEffect({
  key: "dotfield",
  label: "Dot Field",
  category: "Lab",
  blurb: "A dot grid that swells and parts around the cursor.",
  controls,
  defaults: {
    background: "#0a0a0b",
    dot: "#3a3a40",
    glow: "#ff5a2c",
    cells: 1,
    size: 0.28,
    push: 0.6,
    reach: 0.22,
    wave: 0.4,
    speed: 0.8,
    ...CURSOR_DEFAULTS,
  },
  uniforms: (s) => ({
    uDfBg: hexToRgb(String(s.dotfield.background)),
    uDfDot: hexToRgb(String(s.dotfield.dot)),
    uDfGlow: hexToRgb(String(s.dotfield.glow)),
    uDfCells: n(s.dotfield.cells),
    uDfSize: n(s.dotfield.size),
    uDfPush: n(s.dotfield.push),
    uDfReach: n(s.dotfield.reach),
    uDfWave: n(s.dotfield.wave),
    uDfSpeed: n(s.dotfield.speed),
    ...cursorUniforms("uDf", s.dotfield),
  }),
  glsl: /* glsl */ `
${cursorGlsl("uDf")}
uniform vec3 uDfBg;
uniform vec3 uDfDot;
uniform vec3 uDfGlow;
uniform float uDfCells;
uniform float uDfSize;
uniform float uDfPush;
uniform float uDfReach;
uniform float uDfWave;
uniform float uDfSpeed;

void main() {
  vec2 p = fragP();
  float cells = uDfCells * 24.0;
  vec2 g = p * cells;
  vec2 id = floor(g) + 0.5;
  vec2 c = id / cells;
  float t = uTime * uDfSpeed;
  vec2 dm = c - cursorP();
  float dd = length(dm);
  float near = uDfHover * exp(-dd * dd / (uDfReach * uDfReach));
  float ring = clickRing(dd, 0.05);
  float idle = 0.5 + 0.5 * sin(length(c) * 7.0 - t * 1.6 + hash(id) * 0.6);
  float r = uDfSize * 0.5 * (1.0 + uDfWave * (idle - 0.5) * 0.6 + near * 0.9 + ring * 0.8);
  r = min(r, 0.48);
  // Dots lean away from (or toward) the cursor, within their own cell.
  vec2 shift = normalize(dm + 1e-5) * clamp(near * uDfPush, -0.45, 0.45) * (0.5 - r) * 2.0;
  vec2 f = fract(g) - 0.5 - shift;
  float d = length(f);
  float aa = fwidth(d) * 1.2 + 1e-4;
  float mask = 1.0 - smoothstep(r - aa, r + aa, d);
  vec3 dc = mix(uDfDot, uDfGlow, clamp(near * 1.2 + ring, 0.0, 1.0));
  vec3 col = mix(uDfBg, dc, mask);
  col += uDfGlow * (near * 0.06 + ring * 0.1);
  emit(col);
}
`,
});
