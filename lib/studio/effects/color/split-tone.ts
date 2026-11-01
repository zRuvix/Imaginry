import { type Control, defineEffect, hexToRgb, mono, n, p, slider } from "../define";

const controls: Control[] = [
  { key: "shadows", label: "Shadows", type: "color" },
  { key: "highlights", label: "Highlights", type: "color" },
  slider("balance", "Balance", -1, 1, 0.01),
  slider("amount", "Amount", 0, 1, 0.01),
];

/** Tints shadows one color and highlights another. */
export default defineEffect({
  key: "splittone",
  label: "Split Tone",
  category: "Color",
  blurb: "Tints shadows one color and highlights another.",
  controls,
  defaults: { shadows: "#1a6b7a", highlights: "#ffb066", balance: 0, amount: 0.7 },
  presets: {
    thumbBase: { gradient: mono },
    list: [
      p("st-teal", { name: "Teal & orange", shadows: "#1a6b7a", highlights: "#ffb066", balance: 0, amount: 0.75 }),
      p("st-dusk", { name: "Dusk", shadows: "#4a3a8a", highlights: "#ffc2a8", balance: 0.1, amount: 0.8 }),
      p("st-mint", { name: "Mint rose", shadows: "#2f7a5a", highlights: "#ff9ab0", balance: -0.1, amount: 0.7 }),
    ],
  },
  uniforms: (s) => ({
    uStShadow: hexToRgb(String(s.splittone.shadows)),
    uStHigh: hexToRgb(String(s.splittone.highlights)),
    uStBalance: n(s.splittone.balance),
    uStAmount: n(s.splittone.amount),
  }),
  glsl: /* glsl */ `
uniform vec3 uStShadow;
uniform vec3 uStHigh;
uniform float uStBalance;
uniform float uStAmount;

void main() {
  vec3 c = inputFc(gl_FragCoord.xy);
  float w = smoothstep(0.0, 1.0, luma(c) + uStBalance * 0.5);
  vec3 tint = mix(uStShadow, uStHigh, w);
  // Soft light keeps the image's own contrast while pushing its color.
  emit(blendWith(c, tint, 4.0, uStAmount));
}
`,
});
