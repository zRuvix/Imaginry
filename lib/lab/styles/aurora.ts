import { type Control, defineEffect, n, slider } from "@/lib/studio/effects/define";
import { paletteGlsl, paletteUniforms } from "./common";

const controls: Control[] = [
  { key: "colors", label: "Sky and bands", type: "colors", max: 5 },
  slider("bands", "Bands", 1, 4, 1),
  slider("height", "Height", 0, 1, 0.01),
  slider("sway", "Sway", 0, 1.5, 0.01),
  slider("softness", "Softness", 0, 1, 0.01),
  slider("rays", "Rays", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Curtains of light over a night sky. The first color is the sky. */
export default defineEffect({
  key: "aurora",
  label: "Aurora",
  category: "Lab",
  blurb: "Curtains of light over a night sky. The first color is the sky.",
  controls,
  defaults: { colors: ["#02040f", "#19e6a1", "#2fb4ff", "#9b5cff"], bands: 3, height: 0.45, sway: 0.7, softness: 0.5, rays: 0.6, speed: 0.6 },
  uniforms: (s) => ({
    ...paletteUniforms("uAuC", s.aurora.colors),
    uAuBands: n(s.aurora.bands),
    uAuHeight: n(s.aurora.height),
    uAuSway: n(s.aurora.sway),
    uAuSoft: n(s.aurora.softness),
    uAuRays: n(s.aurora.rays),
    uAuSpeed: n(s.aurora.speed),
  }),
  glsl: /* glsl */ `
${paletteGlsl("uAuC")}
uniform float uAuBands;
uniform float uAuHeight;
uniform float uAuSway;
uniform float uAuSoft;
uniform float uAuRays;
uniform float uAuSpeed;

void main() {
  vec2 p = fragP();
  float t = uTime * uAuSpeed * 0.15;
  vec3 sky = pal(0.0);
  vec3 col = mix(sky * 1.8 + 0.01, sky * 0.6, smoothstep(-0.5, 0.5, p.y));
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    if (fi >= uAuBands) break;
    float x = p.x * (0.8 + fi * 0.17) + fi * 3.1;
    float base = mix(-0.25, 0.2, uAuHeight) + fi * 0.07;
    float yc = base + (fbm(vec2(x * 0.8 + t * (0.6 + fi * 0.25), fi * 5.0 + uSeed)) - 0.5) * uAuSway;
    float d = p.y - yc;
    // Sharp at the lower hem, fading upward like a curtain.
    float hem = smoothstep(-0.015 - 0.06 * uAuSoft, 0.02, d);
    float curtain = hem * exp(-max(d, 0.0) * mix(9.0, 2.2, uAuSoft));
    float rays = mix(1.0, 0.45 + 0.55 * noise(vec2(x * 38.0 + t * 3.0, fi * 7.0)), uAuRays);
    float k = 0.3 + 0.7 * fi / max(uAuBands - 1.0, 1.0);
    col += pal(k) * curtain * rays * (1.0 - fi * 0.12);
  }
  emit(col);
}
`,
});
