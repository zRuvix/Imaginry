import { type Control, defineEffect, hexToRgb, magenta, n, opt, p, slider } from "../define";

const controls: Control[] = [
  { key: "mode", label: "Style", type: "select", options: ["over", "ink", "bands"] },
  slider("levels", "Lines", 3, 48, 1),
  slider("thickness", "Thickness", 0.3, 4, 0.05),
  slider("smooth", "Smooth", 0, 1, 0.01),
  { key: "ink", label: "Ink", type: "color" },
  { key: "paper", label: "Paper", type: "color" },
];

/** Topographic lines traced along the brightness of everything below. */
export default defineEffect({
  key: "contours",
  label: "Contours",
  category: "Stylize",
  blurb: "Topographic lines traced along the brightness below.",
  controls,
  defaults: { mode: "over", levels: 14, thickness: 1.4, smooth: 0.4, ink: "#111111", paper: "#f2efe6" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("ctr-topo", { name: "Topo", mode: "ink", levels: 16, thickness: 1.4, smooth: 0.5, ink: "#1c2a1e", paper: "#efe9d8" }),
      p("ctr-over", { name: "Traced", mode: "over", levels: 12, thickness: 1.2, smooth: 0.4, ink: "#ffffff", paper: "#000000" }),
      p("ctr-bands", { name: "Terraces", mode: "bands", levels: 8, thickness: 0.8, smooth: 0.6, ink: "#1d2b64", paper: "#f8cdda" }),
      p("ctr-neon", { name: "Neon map", mode: "ink", levels: 24, thickness: 0.9, smooth: 0.3, ink: "#3dffb0", paper: "#070b12" }),
    ],
  },
  uniforms: (s) => ({
    uCtMode: opt(controls, "mode", s.contours.mode),
    uCtLevels: n(s.contours.levels),
    uCtThick: n(s.contours.thickness),
    uCtSmooth: n(s.contours.smooth),
    uCtInk: hexToRgb(String(s.contours.ink)),
    uCtPaper: hexToRgb(String(s.contours.paper)),
  }),
  glsl: /* glsl */ `
uniform float uCtMode;
uniform float uCtLevels;
uniform float uCtThick;
uniform float uCtSmooth;
uniform vec3 uCtInk;
uniform vec3 uCtPaper;

// Brightness, lightly smoothed so lines follow shapes rather than grain.
float field(vec2 fc) {
  float l = luma(inputFc(fc));
  float s = uCtSmooth * 6.0 * unit();
  if (s < 0.5) return l;
  return (l * 2.0
    + luma(inputFc(fc + vec2(s, 0.0))) + luma(inputFc(fc - vec2(s, 0.0)))
    + luma(inputFc(fc + vec2(0.0, s))) + luma(inputFc(fc - vec2(0.0, s)))) / 6.0;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float f = field(fc) * uCtLevels;
  // Distance to the nearest line, in levels; fwidth turns it into pixels.
  float d = abs(fract(f - 0.5) - 0.5);
  float w = max(fwidth(f), 1e-4);
  float line = 1.0 - smoothstep(0.0, w * uCtThick * px(), d);

  vec3 c;
  if (uCtMode < 0.5) {
    c = mix(inputFc(fc), uCtInk, line);
  } else if (uCtMode < 1.5) {
    c = mix(uCtPaper, uCtInk, line);
  } else {
    float band = floor(f) / max(uCtLevels - 1.0, 1.0);
    c = mix(mix(uCtPaper, uCtInk, band * 0.85), uCtInk, line);
  }
  emit(c);
}
`,
});
