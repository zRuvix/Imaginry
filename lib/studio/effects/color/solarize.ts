import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("threshold", "Threshold", 0, 1, 0.01), slider("softness", "Softness", 0, 0.5, 0.01)];

/** Flips tones past a threshold, like an overexposed darkroom print. */
export default defineEffect({
  key: "solarize",
  label: "Solarize",
  category: "Color",
  blurb: "Flips tones past a threshold, like an overexposed print.",
  controls,
  defaults: { threshold: 0.5, softness: 0.04 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("so-classic", { name: "Classic", threshold: 0.5, softness: 0.03 }),
      p("so-soft", { name: "Soft", threshold: 0.62, softness: 0.25 }),
      p("so-invert", { name: "Invert", threshold: 0, softness: 0 }),
    ],
  },
  uniforms: (s) => ({
    uSolThreshold: n(s.solarize.threshold),
    uSolSoft: n(s.solarize.softness),
  }),
  glsl: /* glsl */ `
uniform float uSolThreshold;
uniform float uSolSoft;

void main() {
  vec3 c = inputFc(gl_FragCoord.xy);
  vec3 k = smoothstep(uSolThreshold - uSolSoft, uSolThreshold + uSolSoft + 0.001, c);
  emit(mix(c, 1.0 - c, k));
}
`,
});
