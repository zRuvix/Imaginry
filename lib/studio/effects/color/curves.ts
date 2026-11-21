import { bakeLut, curves, IDENTITY, LUT_SIZE } from "../../curves";
import { type Control, defineEffect, mono, n, opt, p, slider } from "../define";

const controls: Control[] = [
  { key: "curves", label: "Curves", type: "curves" },
  { key: "mode", label: "Apply to", type: "select", options: ["color", "luminance"] },
  slider("amount", "Amount", 0, 1, 0.01),
  slider("flow", "Flow", 0, 1, 0.01),
];

/** Bends tones and channels with point curves, and can set them flowing. */
export default defineEffect({
  key: "curves",
  label: "Curves",
  category: "Color",
  blurb: "Bend tones and channels with point curves.",
  info: "Drag points to bend the RGB curve or a single channel; click the grid to add a point, double-click one to remove it. Luminance keeps the colors and only reshapes light and dark. Flow makes the levels drift through the curve over time.",
  controls,
  defaults: { curves: curves([[0, 0], [64, 46], [192, 212], [255, 255]]), mode: "color", amount: 1, flow: 0 },
  presets: {
    thumbBase: { gradient: mono },
    list: [
      p("cv-punch", { name: "Punchy S", curves: curves([[0, 0], [64, 40], [192, 216], [255, 255]]), mode: "color", amount: 1, flow: 0 }),
      p("cv-matte", { name: "Matte fade", curves: curves([[0, 40], [72, 74], [190, 198], [255, 232]]), mode: "luminance", amount: 1, flow: 0 }),
      p("cv-teal", {
        name: "Teal & orange",
        curves: curves(
          [[0, 0], [64, 52], [192, 206], [255, 255]],
          [[0, 0], [128, 146], [255, 255]],
          [[0, 10], [128, 128], [255, 245]],
          [[0, 36], [128, 112], [255, 205]],
        ),
        mode: "color",
        amount: 1,
        flow: 0,
      }),
      p("cv-cross", {
        name: "Cross process",
        curves: curves(
          IDENTITY,
          [[0, 0], [70, 48], [190, 218], [255, 255]],
          [[0, 0], [64, 54], [192, 210], [255, 255]],
          [[0, 56], [255, 196]],
        ),
        mode: "color",
        amount: 1,
        flow: 0,
      }),
      p("cv-infra", {
        name: "Infrared",
        curves: curves(
          IDENTITY,
          [[0, 40], [128, 205], [255, 255]],
          [[0, 0], [128, 86], [255, 228]],
          [[0, 96], [128, 60], [255, 160]],
        ),
        mode: "color",
        amount: 1,
        flow: 0,
      }),
      p("cv-neon", {
        name: "Neon drift",
        curves: curves(
          [[0, 0], [96, 70], [255, 255]],
          [[0, 0], [100, 30], [190, 255], [255, 255]],
          [[0, 20], [140, 40], [255, 230]],
          [[0, 120], [128, 255], [255, 120]],
        ),
        mode: "color",
        amount: 1,
        flow: 0.35,
      }),
      p("cv-solar", {
        name: "Solar wave",
        curves: curves([[0, 0], [64, 255], [128, 20], [192, 255], [255, 0]]),
        mode: "luminance",
        amount: 0.85,
        flow: 0.25,
      }),
      p("cv-negative", { name: "Negative", curves: curves([[0, 255], [255, 0]]), mode: "color", amount: 1, flow: 0 }),
    ],
  },
  uniforms: (s) => ({
    uCvLut: bakeLut(s.curves.curves),
    uCvMode: opt(controls, "mode", s.curves.mode),
    uCvAmount: s.curves.amount == null ? 1 : n(s.curves.amount),
    uCvFlow: n(s.curves.flow),
  }),
  glsl: /* glsl */ `
uniform vec3 uCvLut[${LUT_SIZE}];
uniform float uCvMode;
uniform float uCvAmount;
uniform float uCvFlow;

// One channel of the baked curve, read between its two nearest samples.
float curve(float x, int ch) {
  float t = clamp(x, 0.0, 1.0) * ${LUT_SIZE - 1}.0;
  int i = int(floor(t));
  int j = min(i + 1, ${LUT_SIZE - 1});
  return mix(uCvLut[i][ch], uCvLut[j][ch], t - float(i));
}

// Flow nudges where each level reads the curve, a slow wave per channel.
float drift(float x, float phase) {
  return x + uCvFlow * 0.22 * sin(uTime * 0.9 + x * 6.2832 + phase);
}

void main() {
  vec3 c = inputFc(gl_FragCoord.xy);
  vec3 graded;
  if (uCvMode > 0.5) {
    // Luminance: reshape light and dark, keep each pixel's own color.
    float y = luma(c);
    vec3 mapped = vec3(curve(drift(y, 0.0), 0), curve(drift(y, 2.1), 1), curve(drift(y, 4.2), 2));
    graded = c + (mapped - y);
  } else {
    graded = vec3(curve(drift(c.r, 0.0), 0), curve(drift(c.g, 2.1), 1), curve(drift(c.b, 4.2), 2));
  }
  emit(mix(c, graded, uCvAmount));
}
`,
});
