import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("size", "Line size", 3, 30, 0.5),
  slider("angle", "Angle", -90, 90, 1),
  slider("wave", "Wave", 0, 1.5, 0.01),
  { key: "ink", label: "Ink", type: "color" },
  { key: "paper", label: "Paper", type: "color" },
];

/** Banknote-style line shading. */
export default defineEffect({
  key: "engrave",
  label: "Engrave",
  category: "Stylize",
  blurb: "Banknote-style line shading.",
  controls,
  defaults: { size: 7, angle: 30, wave: 0.3, ink: "#1a1410", paper: "#efe6d4" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("en-note", { name: "Banknote", size: 7, angle: 30, wave: 0.3, ink: "#1a1410", paper: "#efe6d4" }),
      p("en-fine", { name: "Fine", size: 4, angle: -20, wave: 0, ink: "#13233f", paper: "#f2efe6" }),
      p("en-wave", { name: "Wavy", size: 10, angle: 0, wave: 1.2, ink: "#2a0f1f", paper: "#ffd9c7" }),
    ],
  },
  uniforms: (s) => ({
    uEngSize: n(s.engrave.size),
    uEngAngle: n(s.engrave.angle),
    uEngWave: n(s.engrave.wave),
    uEngInk: hexToRgb(String(s.engrave.ink)),
    uEngPaper: hexToRgb(String(s.engrave.paper)),
  }),
  glsl: /* glsl */ `
uniform float uEngSize;
uniform float uEngAngle;
uniform float uEngWave;
uniform vec3 uEngInk;
uniform vec3 uEngPaper;

void main() {
  vec2 fc = gl_FragCoord.xy;
  float s = max(uEngSize * unit(), 2.0);
  vec2 q = rot(radians(uEngAngle)) * fc / s;
  q.y += sin(q.x * 0.35) * uEngWave;
  float l = luma(inputFc(fc));
  float w = (1.0 - l) * 0.5;
  float d = abs(fract(q.y) - 0.5);
  float aa = 1.2 / s;
  emit(mix(uEngPaper, uEngInk, 1.0 - smoothstep(w - aa, w + aa, d)));
}
`,
});
