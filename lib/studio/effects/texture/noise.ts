import { type Control, defineEffect, hexToRgb, magenta, n, opt, p, slider } from "../define";

const controls: Control[] = [
  { key: "type", label: "Type", type: "select", options: ["clouds", "ridged", "cells"] },
  slider("scale", "Scale", 0.5, 20, 0.1),
  slider("amount", "Amount", 0, 1, 0.01),
  slider("speed", "Drift", 0, 3, 0.01),
  { key: "color", label: "Color", type: "color" },
];

/** Procedural noise laid over the image: clouds, ridges or cells. */
export default defineEffect({
  key: "noise",
  label: "Noise",
  category: "Texture",
  blurb: "Procedural clouds, ridges or cells over the image.",
  controls,
  defaults: { type: "clouds", scale: 4, amount: 0.6, speed: 0.4, color: "#ffffff" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("nz-clouds", { name: "Clouds", type: "clouds", scale: 3, amount: 0.6, speed: 0.4, color: "#ffffff" }),
      p("nz-marble", { name: "Marble", type: "ridged", scale: 2.5, amount: 0.75, speed: 0.2, color: "#fff4e6" }),
      p("nz-cells", { name: "Cells", type: "cells", scale: 8, amount: 0.55, speed: 0.6, color: "#d6f2ff" }),
    ],
  },
  uniforms: (s) => ({
    uNzType: opt(controls, "type", s.noise.type),
    uNzScale: n(s.noise.scale) || 1,
    uNzAmount: n(s.noise.amount),
    uNzSpeed: n(s.noise.speed),
    uNzColor: hexToRgb(String(s.noise.color)),
  }),
  glsl: /* glsl */ `
uniform float uNzType;
uniform float uNzScale;
uniform float uNzAmount;
uniform float uNzSpeed;
uniform vec3 uNzColor;

void main() {
  vec2 p = fragP() * uNzScale;
  float t = uTime * uNzSpeed * 0.1;
  int ty = int(uNzType + 0.5);
  float v;
  if (ty == 0) {
    v = fbm(p + vec2(t, -t) + uSeed);
  } else if (ty == 1) {
    v = 1.0 - abs(fbm(p + t + uSeed) * 2.0 - 1.0);
    v *= v;
  } else {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    v = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = vec2(hash(ip + g + uSeed), hash(ip + g + 7.0 + uSeed));
        o = 0.5 + 0.5 * sin(t * 3.0 + o * TAU);
        v = min(v, length(g + o - fp));
      }
    }
  }
  // Overlay keeps the image underneath readable.
  emit(blendWith(inputFc(gl_FragCoord.xy), uNzColor * v * 1.4, 3.0, uNzAmount));
}
`,
});
