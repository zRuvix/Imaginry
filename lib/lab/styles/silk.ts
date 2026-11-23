import { type Control, defineEffect, n, slider } from "@/lib/studio/effects/define";
import { paletteGlsl, paletteUniforms } from "./common";

const controls: Control[] = [
  { key: "colors", label: "Colors", type: "colors", max: 5 },
  slider("folds", "Folds", 1, 12, 0.1),
  slider("drape", "Drape", 0, 1.5, 0.01),
  slider("softness", "Softness", 0, 1, 0.01),
  slider("sheen", "Sheen", 0, 1.5, 0.01),
  slider("angle", "Angle", -180, 180, 1),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Lit fabric: folds that catch the light like satin. */
export default defineEffect({
  key: "silk",
  label: "Silk",
  category: "Lab",
  blurb: "Satin folds that catch the light.",
  controls,
  defaults: {
    colors: ["#12091f", "#4b1d6e", "#c2408f", "#ffb38a"],
    folds: 4.5,
    drape: 0.7,
    softness: 0.5,
    sheen: 0.8,
    angle: -25,
    speed: 0.5,
  },
  uniforms: (s) => ({
    ...paletteUniforms("uSlkC", s.silk.colors),
    uSlkFolds: n(s.silk.folds),
    uSlkDrape: n(s.silk.drape),
    uSlkSoft: n(s.silk.softness),
    uSlkSheen: n(s.silk.sheen),
    uSlkAngle: (n(s.silk.angle) * Math.PI) / 180,
    uSlkSpeed: n(s.silk.speed),
  }),
  glsl: /* glsl */ `
${paletteGlsl("uSlkC")}
uniform float uSlkFolds;
uniform float uSlkDrape;
uniform float uSlkSoft;
uniform float uSlkSheen;
uniform float uSlkAngle;
uniform float uSlkSpeed;

float cloth(vec2 p) {
  float t = uTime * uSlkSpeed * 0.35;
  float w = (fbm(p * 0.7 + vec2(t * 0.3, -t * 0.2) + uSeed) - 0.5) * uSlkDrape * 6.0;
  float a = sin(p.x * uSlkFolds + w + sin(p.y * 1.1 + t) * 1.3 + t);
  float b = sin(p.x * uSlkFolds * 0.47 - p.y * 0.8 + w * 0.6 - t * 0.6);
  return a * 0.6 + b * 0.4;
}

void main() {
  vec2 p = rot(uSlkAngle) * fragP() * 2.0;
  float e = 0.004;
  float h = cloth(p);
  vec2 g = vec2(cloth(p + vec2(e, 0.0)) - h, cloth(p + vec2(0.0, e)) - h) / e;
  vec3 nrm = normalize(vec3(-g * mix(0.35, 0.08, uSlkSoft), 1.0));
  vec3 light = normalize(vec3(0.5, 0.45, 0.75));
  float diff = max(dot(nrm, light), 0.0);
  float spec = pow(max(dot(reflect(-light, nrm), vec3(0.0, 0.0, 1.0)), 0.0), mix(10.0, 60.0, uSlkSheen * 0.6)) * uSlkSheen;
  vec3 col = pal(clamp(0.5 + h * 0.3 + p.y * 0.12, 0.0, 1.0));
  col = col * (0.3 + 0.85 * diff) + spec * 0.55 * mix(vec3(1.0), pal(1.0), 0.4);
  emit(col);
}
`,
});
