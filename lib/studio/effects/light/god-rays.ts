import { type Control, defineEffect, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("intensity", "Intensity", 0, 2, 0.01),
  slider("length", "Length", 0.05, 1, 0.01),
  slider("threshold", "Threshold", 0, 1, 0.01),
  slider("x", "Source X", -1, 1, 0.01),
  slider("y", "Source Y", -1, 1, 0.01),
];

/** Volumetric shafts streaming from the bright parts toward a light source. */
export default defineEffect({
  key: "godrays",
  label: "God Rays",
  category: "Light",
  blurb: "Volumetric shafts streaming out of the highlights.",
  controls,
  defaults: { intensity: 1, length: 0.6, threshold: 0.5, x: 0, y: 0.8 },
  presets: {
    thumbBase: { gradient: violet, pattern: { type: "grid", scale: 6, size: 0.25, angle: 0, softness: 0.03, background: "#050505" } },
    list: [
      p("gr-over", { name: "Overhead", intensity: 1, length: 0.6, threshold: 0.45, x: 0, y: 0.8 }),
      p("gr-corner", { name: "Corner", intensity: 1.2, length: 0.8, threshold: 0.4, x: -0.8, y: 0.8 }),
      p("gr-behind", { name: "Behind", intensity: 0.9, length: 0.9, threshold: 0.55, x: 0, y: 0 }),
    ],
  },
  uniforms: (s) => ({
    uGodIntensity: n(s.godrays.intensity),
    uGodLength: n(s.godrays.length),
    uGodThreshold: n(s.godrays.threshold),
    uGodPos: [n(s.godrays.x), n(s.godrays.y)],
  }),
  glsl: /* glsl */ `
uniform float uGodIntensity;
uniform float uGodLength;
uniform float uGodThreshold;
uniform vec2 uGodPos;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 lp = uGodPos * 0.5 + 0.5;
  vec2 delta = (uv - lp) * uGodLength / 32.0;
  vec2 s = uv - delta * hash(gl_FragCoord.xy);
  float decay = 1.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    s -= delta;
    vec3 c = texture(uInput, s).rgb;
    acc += max(c - uGodThreshold, 0.0) / max(1.0 - uGodThreshold, 0.02) * decay;
    decay *= 0.96;
  }
  emit(inputFc(gl_FragCoord.xy) + acc / (32.0 * 0.55) * uGodIntensity * 1.6);
}
`,
});
