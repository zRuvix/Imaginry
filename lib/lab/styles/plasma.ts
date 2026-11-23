import { type Control, defineEffect, n, slider } from "@/lib/studio/effects/define";
import { paletteGlsl, paletteUniforms } from "./common";

const controls: Control[] = [
  { key: "colors", label: "Colors", type: "colors", max: 5 },
  slider("scale", "Scale", 0.2, 3, 0.01),
  slider("swirl", "Swirl", -3, 3, 0.01),
  slider("bands", "Bands", 0.5, 4, 0.01),
  slider("contrast", "Contrast", 0.3, 2, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Interfering waves of color, smooth and endless. */
export default defineEffect({
  key: "plasma",
  label: "Plasma",
  category: "Lab",
  blurb: "Interfering waves of color, smooth and endless.",
  controls,
  defaults: { colors: ["#0c0420", "#5b21b6", "#ec4899", "#fde68a"], scale: 1.7, swirl: 0.6, bands: 1.4, contrast: 1, speed: 0.6 },
  uniforms: (s) => ({
    ...paletteUniforms("uPlC", s.plasma.colors),
    uPlScale: n(s.plasma.scale),
    uPlSwirl: n(s.plasma.swirl),
    uPlBands: n(s.plasma.bands),
    uPlContrast: n(s.plasma.contrast),
    uPlSpeed: n(s.plasma.speed),
  }),
  glsl: /* glsl */ `
${paletteGlsl("uPlC")}
uniform float uPlScale;
uniform float uPlSwirl;
uniform float uPlBands;
uniform float uPlContrast;
uniform float uPlSpeed;

void main() {
  vec2 p = fragP() * uPlScale * 3.0;
  float t = uTime * uPlSpeed * 0.4 + uSeed;
  p = rot(uPlSwirl * length(p) * 0.25) * p;
  float v = sin(p.x + t)
    + sin((p.y + t) * 0.8)
    + sin((p.x + p.y + t * 1.3) * 0.7)
    + sin(length(p + vec2(sin(t * 0.5), cos(t * 0.4)) * 2.0) * 1.5);
  float x = 0.5 + 0.5 * sin(v * 0.785 * uPlBands);
  x = clamp((x - 0.5) * uPlContrast + 0.5, 0.0, 1.0);
  emit(pal(x));
}
`,
});
