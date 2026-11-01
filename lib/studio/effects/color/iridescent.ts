import { type Control, defineEffect, mono, n, p, slider } from "../define";

const controls: Control[] = [
  slider("amount", "Amount", 0, 1, 0.01),
  slider("frequency", "Bands", 0.5, 8, 0.01),
  slider("shift", "Shift", 0, 1, 0.01),
  slider("speed", "Drift", 0, 3, 0.01),
];

/** Thin-film rainbow that follows the image's tones, like oil on water. */
export default defineEffect({
  key: "iridescent",
  label: "Iridescent",
  category: "Color",
  blurb: "Thin-film rainbow, like oil on water or opal.",
  controls,
  defaults: { amount: 0.6, frequency: 2, shift: 0, speed: 0.5 },
  presets: {
    thumbBase: { gradient: mono },
    list: [
      p("ir-opal", { name: "Opal", amount: 0.6, frequency: 2, shift: 0, speed: 0.5 }),
      p("ir-oil", { name: "Oil slick", amount: 0.9, frequency: 5, shift: 0.3, speed: 1 }),
      p("ir-pearl", { name: "Pearl", amount: 0.35, frequency: 1.2, shift: 0.6, speed: 0.3 }),
    ],
  },
  uniforms: (s) => ({
    uIriAmount: n(s.iridescent.amount),
    uIriFreq: n(s.iridescent.frequency),
    uIriShift: n(s.iridescent.shift),
    uIriSpeed: n(s.iridescent.speed),
  }),
  glsl: /* glsl */ `
uniform float uIriAmount;
uniform float uIriFreq;
uniform float uIriShift;
uniform float uIriSpeed;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec2 p = fragP();
  vec3 c = inputFc(gl_FragCoord.xy);
  float t = luma(c) * uIriFreq + dot(p, vec2(0.6, 0.8)) * 0.8 + uTime * uIriSpeed * 0.1 + uIriShift;
  vec3 film = spectrum(t);
  emit(mix(c, c * film * 1.6 + film * 0.12, uIriAmount));
}
`,
});
