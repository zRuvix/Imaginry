import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("level", "Level", 0, 1, 0.01),
  slider("noise", "Noise", 0, 1, 0.01),
  { key: "dark", label: "Dark", type: "color" },
  { key: "light", label: "Light", type: "color" },
];

/** Two colors, hard cut: photocopies, stencils and posters. */
export default defineEffect({
  key: "threshold",
  label: "Threshold",
  category: "Stylize",
  blurb: "Two colors, hard cut: stencils and photocopies.",
  controls,
  defaults: { level: 0.5, noise: 0.15, dark: "#111111", light: "#f2efe6" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("th-copy", { name: "Photocopy", level: 0.5, noise: 0.25, dark: "#111111", light: "#f2efe6" }),
      p("th-stencil", { name: "Stencil", level: 0.45, noise: 0, dark: "#ff5a2c", light: "#0d0c0b" }),
      p("th-risograph", { name: "Riso", level: 0.55, noise: 0.4, dark: "#2b3fbf", light: "#ffd7e0" }),
    ],
  },
  uniforms: (s) => ({
    uThLevel: n(s.threshold.level),
    uThNoise: n(s.threshold.noise),
    uThDark: hexToRgb(String(s.threshold.dark)),
    uThLight: hexToRgb(String(s.threshold.light)),
  }),
  glsl: /* glsl */ `
uniform float uThLevel;
uniform float uThNoise;
uniform vec3 uThDark;
uniform vec3 uThLight;

void main() {
  float l = luma(inputFc(gl_FragCoord.xy));
  float jitter = (hash(gl_FragCoord.xy + fract(uTime) * 10.0) - 0.5) * uThNoise;
  emit(mix(uThDark, uThLight, step(uThLevel, l + jitter)));
}
`,
});
