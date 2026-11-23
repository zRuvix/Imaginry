import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";
import { CURSOR_CONTROLS, CURSOR_DEFAULTS, cursorGlsl, cursorUniforms } from "./common";

const controls: Control[] = [
  { key: "background", label: "Background", type: "color" },
  { key: "line", label: "Lines", type: "color" },
  { key: "glow", label: "Glow", type: "color" },
  slider("cells", "Cells", 0.3, 3, 0.01),
  slider("width", "Line width", 0.3, 4, 0.01),
  slider("ripple", "Ripple", 0, 2, 0.01),
  slider("pull", "Lens", -1, 1, 0.01),
  slider("reach", "Reach", 0.05, 0.8, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
  ...CURSOR_CONTROLS,
];

/** A glowing grid that ripples from the middle and bends like a lens under the cursor. */
export default defineEffect({
  key: "ripplegrid",
  label: "Ripple Grid",
  category: "Lab",
  blurb: "A grid that ripples, bends under the cursor and rings on click.",
  controls,
  defaults: {
    background: "#05060a",
    line: "#2b3550",
    glow: "#6ee7ff",
    cells: 1,
    width: 1.1,
    ripple: 1,
    pull: 0.45,
    reach: 0.28,
    speed: 0.8,
    ...CURSOR_DEFAULTS,
  },
  uniforms: (s) => ({
    uRgBg: hexToRgb(String(s.ripplegrid.background)),
    uRgLine: hexToRgb(String(s.ripplegrid.line)),
    uRgGlow: hexToRgb(String(s.ripplegrid.glow)),
    uRgCells: n(s.ripplegrid.cells),
    uRgWidth: n(s.ripplegrid.width),
    uRgRipple: n(s.ripplegrid.ripple),
    uRgPull: n(s.ripplegrid.pull),
    uRgReach: n(s.ripplegrid.reach),
    uRgSpeed: n(s.ripplegrid.speed),
    ...cursorUniforms("uRg", s.ripplegrid),
  }),
  glsl: /* glsl */ `
${cursorGlsl("uRg")}
uniform vec3 uRgBg;
uniform vec3 uRgLine;
uniform vec3 uRgGlow;
uniform float uRgCells;
uniform float uRgWidth;
uniform float uRgRipple;
uniform float uRgPull;
uniform float uRgReach;
uniform float uRgSpeed;

void main() {
  vec2 p = fragP();
  float t = uTime * uRgSpeed;
  float r = length(p);
  vec2 q = p + normalize(p + 1e-5) * sin(r * 11.0 - t * 2.0) * 0.012 * uRgRipple * exp(-r * 1.3);
  vec2 dm = p - cursorP();
  float dd = length(dm);
  float lens = uRgHover * exp(-dd * dd / (uRgReach * uRgReach));
  q -= dm * lens * uRgPull;
  float ring = clickRing(dd, 0.05);
  q += normalize(dm + 1e-5) * ring * 0.03;
  vec2 g = q * uRgCells * 12.0;
  vec2 f = abs(fract(g - 0.5) - 0.5);
  vec2 w = fwidth(g) * uRgWidth * px();
  float line = max(1.0 - smoothstep(w.x * 0.5, w.x * 1.5, f.x), 1.0 - smoothstep(w.y * 0.5, w.y * 1.5, f.y));
  float fade = exp(-r * 0.9);
  vec3 col = uRgBg + uRgLine * line * (0.35 + 0.65 * fade);
  col += uRgGlow * (lens * 0.25 + ring * 0.7) * (0.3 + line * 1.2);
  col += uRgGlow * line * exp(-r * 3.0) * 0.15 * uRgRipple;
  emit(col);
}
`,
});
