import { type Control, defineEffect, mono, n, p, slider } from "../define";

const controls: Control[] = [slider("amount", "Amount", 0, 0.6, 0.01), slider("size", "Size", 1, 6, 0.1)];

/** Film grain for the finishing tooth. */
export default defineEffect({
  key: "grain",
  label: "Grain",
  category: "Texture",
  blurb: "Film grain for the finishing tooth.",
  controls,
  defaults: { amount: 0.1, size: 1 },
  presets: {
    thumbBase: { gradient: mono },
    list: [
      p("gr-fine", { amount: 0.08, size: 1 }),
      p("gr-film", { amount: 0.18, size: 1.5 }),
      p("gr-heavy", { amount: 0.35, size: 2.5 }),
    ],
  },
  uniforms: (s) => ({
    uGrainAmount: n(s.grain.amount),
    uGrainSize: n(s.grain.size) || 1,
  }),
  glsl: /* glsl */ `
uniform float uGrainAmount;
uniform float uGrainSize;

void main() {
  float s = max(uGrainSize * max(unit(), 1.0), 1.0);
  float n = hash(floor(gl_FragCoord.xy / s) + fract(uTime * 7.13) * 91.7) - 0.5;
  emit(inputFc(gl_FragCoord.xy) + n * uGrainAmount);
}
`,
});
