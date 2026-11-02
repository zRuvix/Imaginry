import { type Control, defineEffect, magenta, mono, n, p, slider } from "../define";

const controls: Control[] = [
  slider("levels", "Levels", 2, 8, 1),
  slider("scale", "Scale", 1, 12, 0.5),
  { key: "mono", label: "Mono", type: "toggle" },
];

/** Ordered dithering, 1-bit or color. */
export default defineEffect({
  key: "dither",
  label: "Dither",
  category: "Stylize",
  blurb: "Ordered dithering, 1-bit or color.",
  controls,
  defaults: { levels: 2, scale: 2, mono: true },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("d-1bit", { levels: 2, scale: 2, mono: true }),
      p("d-1bit-coarse", { levels: 2, scale: 6, mono: true }),
      p("d-color", { levels: 2, scale: 3, mono: false }),
      p("d-color-4", { levels: 4, scale: 3, mono: false }),
    ],
  },
  uniforms: (s) => ({
    uDithLevels: n(s.dither.levels),
    uDithScale: n(s.dither.scale),
    uDithMono: s.dither.mono ? 1 : 0,
  }),
  glsl: /* glsl */ `
uniform float uDithLevels;
uniform float uDithScale;
uniform float uDithMono;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

void main() {
  vec3 col = inputFc(gl_FragCoord.xy);
  float s = max(uDithScale * unit(), px());
  float th = bayer4(gl_FragCoord.xy / s) + 0.03125 - 0.5;
  float lv = max(uDithLevels - 1.0, 1.0);
  if (uDithMono > 0.5) col = vec3(floor(luma(col) * lv + th + 0.5) / lv);
  else col = floor(col * lv + th + 0.5) / lv;
  emit(col);
}
`,
});
