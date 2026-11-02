import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("size", "Pitch", 3, 40, 0.5),
  slider("dot", "Dot", 0.2, 1, 0.01),
  slider("glow", "Glow", 0, 1.5, 0.01),
];

/** A dot-matrix LED wall: glowing round pixels on black. */
export default defineEffect({
  key: "led",
  label: "LED",
  category: "Stylize",
  blurb: "A dot-matrix wall of glowing round pixels.",
  controls,
  defaults: { size: 10, dot: 0.75, glow: 0.6 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("le-board", { name: "Billboard", size: 10, dot: 0.75, glow: 0.6 }),
      p("le-fine", { name: "Fine", size: 5, dot: 0.85, glow: 0.4 }),
      p("le-stadium", { name: "Stadium", size: 22, dot: 0.6, glow: 1.2 }),
    ],
  },
  uniforms: (s) => ({
    uLedSize: n(s.led.size) || 10,
    uLedDot: n(s.led.dot),
    uLedGlow: n(s.led.glow),
  }),
  glsl: /* glsl */ `
uniform float uLedSize;
uniform float uLedDot;
uniform float uLedGlow;

void main() {
  vec2 fc = gl_FragCoord.xy;
  float s = max(uLedSize * unit(), 3.0 * px());
  vec2 cell = floor(fc / s);
  vec2 f = fract(fc / s) - 0.5;
  vec3 c = inputFc((cell + 0.5) * s);
  float r = length(f);
  float dotm = smoothstep(uLedDot * 0.5, uLedDot * 0.5 - 0.08, r);
  float glow = exp(-r * r * 14.0) * uLedGlow;
  emit(c * (dotm * 1.15 + glow * 0.6) + 0.02);
}
`,
});
