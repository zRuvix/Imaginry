import { type Control, defineEffect, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("threshold", "Threshold", 0, 1, 0.01),
  slider("intensity", "Intensity", 0, 2, 0.01),
  slider("radius", "Radius", 0.05, 1, 0.01),
];

/** Highlights that bleed soft light. */
export default defineEffect({
  key: "bloom",
  label: "Bloom",
  category: "Light",
  blurb: "Highlights that bleed soft light.",
  controls,
  defaults: { threshold: 0.55, intensity: 0.9, radius: 0.4 },
  presets: {
    thumbBase: { gradient: violet },
    list: [
      p("bl-soft", { name: "Soft", threshold: 0.6, intensity: 0.7, radius: 0.35 }),
      p("bl-dream", { name: "Dreamy", threshold: 0.35, intensity: 1.1, radius: 0.8 }),
      p("bl-hot", { name: "Hot spots", threshold: 0.75, intensity: 1.8, radius: 0.25 }),
    ],
  },
  uniforms: (s) => ({
    uBloomThreshold: n(s.bloom.threshold),
    uBloomIntensity: n(s.bloom.intensity),
    uBloomRadius: n(s.bloom.radius),
  }),
  glsl: /* glsl */ `
uniform float uBloomThreshold;
uniform float uBloomIntensity;
uniform float uBloomRadius;

void main() {
  vec2 p = fragP();
  vec3 c = inputAt(p);
  float r = uBloomRadius * 0.12;
  float spin = hash(gl_FragCoord.xy) * TAU;
  vec3 acc = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    float d = sqrt((fi + 0.5) / 24.0) * r;
    vec2 o = vec2(cos(fi * 2.39996 + spin), sin(fi * 2.39996 + spin)) * d;
    vec3 s = inputAt(p + o);
    float w = 1.0 - 0.6 * d / max(r, 1e-4);
    acc += max(s - uBloomThreshold, 0.0) / max(1.0 - uBloomThreshold, 0.02) * w;
    total += w;
  }
  emit(c + acc / total * uBloomIntensity * 1.4);
}
`,
});
