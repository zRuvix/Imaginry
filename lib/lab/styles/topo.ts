import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";

const controls: Control[] = [
  { key: "background", label: "Ground", type: "color" },
  { key: "line", label: "Lines", type: "color" },
  { key: "accent", label: "Index lines", type: "color" },
  slider("density", "Density", 0.3, 3, 0.01),
  slider("width", "Width", 0.3, 4, 0.01),
  slider("relief", "Relief", 0, 1, 0.01),
  slider("glow", "Glow", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** A topographic map of a drifting terrain, with index contours. */
export default defineEffect({
  key: "topo",
  label: "Topography",
  category: "Lab",
  blurb: "Contour lines over a drifting terrain.",
  controls,
  defaults: { background: "#0a0f14", line: "#3e5566", accent: "#7ff0c8", density: 1, width: 1.2, relief: 0.5, glow: 0.35, speed: 0.4 },
  uniforms: (s) => ({
    uTopoBg: hexToRgb(String(s.topo.background)),
    uTopoLine: hexToRgb(String(s.topo.line)),
    uTopoAccent: hexToRgb(String(s.topo.accent)),
    uTopoDensity: n(s.topo.density),
    uTopoWidth: n(s.topo.width),
    uTopoRelief: n(s.topo.relief),
    uTopoGlow: n(s.topo.glow),
    uTopoSpeed: n(s.topo.speed),
  }),
  glsl: /* glsl */ `
uniform vec3 uTopoBg;
uniform vec3 uTopoLine;
uniform vec3 uTopoAccent;
uniform float uTopoDensity;
uniform float uTopoWidth;
uniform float uTopoRelief;
uniform float uTopoGlow;
uniform float uTopoSpeed;

float contour(float k, float w) {
  float d = abs(fract(k + 0.5) - 0.5);
  return 1.0 - smoothstep(w * 0.5, w * 1.5, d);
}

void main() {
  vec2 p = fragP() * mix(0.9, 3.0, uTopoRelief) + uSeed;
  float t = uTime * uTopoSpeed * 0.04;
  float h = fbm(p + vec2(t, -t * 0.6)) * 0.7 + fbm(p * 2.1 - t) * 0.3;
  float k = h * uTopoDensity * 14.0;
  float w = fwidth(k) * uTopoWidth * px();
  float minor = contour(k, w);
  float major = contour(k / 5.0, w / 5.0 * 1.6);
  vec3 col = mix(uTopoBg, uTopoBg * 1.6 + 0.015, smoothstep(0.2, 0.8, h));
  col = mix(col, uTopoLine, minor * 0.9);
  col = mix(col, uTopoAccent, major);
  float near = abs(fract(k / 5.0 + 0.5) - 0.5) * 5.0;
  col += uTopoAccent * exp(-near * 1.6) * uTopoGlow * 0.18;
  emit(col);
}
`,
});
