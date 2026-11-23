import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";

const controls: Control[] = [
  { key: "background", label: "Background", type: "color" },
  { key: "dot", label: "Dots", type: "color" },
  { key: "accent", label: "Crest", type: "color" },
  slider("density", "Density", 0.3, 3, 0.01),
  slider("size", "Size", 0.1, 1, 0.01),
  slider("wave", "Wave", 0, 2, 0.01),
  slider("perspective", "Perspective", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** A field of dots riding a slow swell, in perspective. Made for product heroes. */
export default defineEffect({
  key: "dotwave",
  label: "Dot Wave",
  category: "Lab",
  blurb: "A dot field riding a slow swell.",
  controls,
  defaults: { background: "#06070c", dot: "#4a5bff", accent: "#e6f0ff", density: 1, size: 0.45, wave: 1, perspective: 0.6, speed: 0.6 },
  uniforms: (s) => ({
    uDotBg: hexToRgb(String(s.dotwave.background)),
    uDotColor: hexToRgb(String(s.dotwave.dot)),
    uDotAccent: hexToRgb(String(s.dotwave.accent)),
    uDotDensity: n(s.dotwave.density),
    uDotSize: n(s.dotwave.size),
    uDotWave: n(s.dotwave.wave),
    uDotPersp: n(s.dotwave.perspective),
    uDotSpeed: n(s.dotwave.speed),
  }),
  glsl: /* glsl */ `
uniform vec3 uDotBg;
uniform vec3 uDotColor;
uniform vec3 uDotAccent;
uniform float uDotDensity;
uniform float uDotSize;
uniform float uDotWave;
uniform float uDotPersp;
uniform float uDotSpeed;

float swell(vec2 c, float t) {
  return sin(c.x * 1.7 + t) * 0.5 + sin(c.y * 2.3 - t * 0.8 + c.x * 0.6) * 0.35 + (fbm(c * 0.6 + t * 0.15 + uSeed) - 0.5) * 0.9;
}

void main() {
  vec2 p = fragP();
  // Tilt the plane back: rows toward the top are further away.
  float horizon = 0.62;
  float z = mix(1.0, 0.35 / max(horizon - p.y, 0.04), uDotPersp);
  vec2 plane = vec2(p.x * z, p.y * mix(1.0, z * 1.3, uDotPersp));
  float t = uTime * uDotSpeed * 0.6;
  float cells = uDotDensity * 14.0;
  vec2 g = plane * cells;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = swell((id + 0.5) / cells * 3.0, t) * uDotWave;
  float crest = smoothstep(0.1, 0.9, h * 0.5 + 0.5);
  float r = uDotSize * 0.5 * mix(0.35, 1.0, crest);
  float d = length(f);
  float aa = fwidth(d) * 1.2 + 1e-4;
  float dotMask = 1.0 - smoothstep(r - aa, r + aa, d);
  float fog = mix(1.0, smoothstep(horizon, horizon - 0.7, p.y), uDotPersp);
  vec3 dc = mix(uDotColor, uDotAccent, crest);
  vec3 col = mix(uDotBg, dc, dotMask * fog);
  col += dc * crest * 0.06 * fog;
  emit(col);
}
`,
});
