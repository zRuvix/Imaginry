import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";

const controls: Control[] = [
  { key: "deep", label: "Water", type: "color" },
  { key: "light", label: "Light", type: "color" },
  slider("scale", "Scale", 0.3, 4, 0.01),
  slider("brightness", "Brightness", 0, 2, 0.01),
  slider("sharpness", "Sharpness", 0, 1, 0.01),
  slider("dispersion", "Dispersion", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Sunlight through moving water, as it falls on a pool floor. */
export default defineEffect({
  key: "caustics",
  label: "Caustics",
  category: "Lab",
  blurb: "Sunlight through moving water.",
  controls,
  defaults: { deep: "#04304a", light: "#bff6ff", scale: 1.2, brightness: 1, sharpness: 0.5, dispersion: 0.35, speed: 0.6 },
  uniforms: (s) => ({
    uCauDeep: hexToRgb(String(s.caustics.deep)),
    uCauLight: hexToRgb(String(s.caustics.light)),
    uCauScale: n(s.caustics.scale),
    uCauBright: n(s.caustics.brightness),
    uCauSharp: n(s.caustics.sharpness),
    uCauDisp: n(s.caustics.dispersion),
    uCauSpeed: n(s.caustics.speed),
  }),
  glsl: /* glsl */ `
uniform vec3 uCauDeep;
uniform vec3 uCauLight;
uniform float uCauScale;
uniform float uCauBright;
uniform float uCauSharp;
uniform float uCauDisp;
uniform float uCauSpeed;

float caustic(vec2 uv, float t) {
  vec2 p = mod(uv * TAU, TAU) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int k = 0; k < 5; k++) {
    float tt = t * (1.0 - (3.5 / float(k + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 5.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), mix(5.0, 12.0, uCauSharp));
}

void main() {
  vec2 p = fragP();
  vec2 uv = p * uCauScale * 0.5 + uSeed * 0.37;
  float t = uTime * uCauSpeed * 0.5 + 23.0;
  float d = uCauDisp * 0.012;
  vec3 c = vec3(caustic(uv + d, t), caustic(uv, t), caustic(uv - d, t));
  vec3 water = mix(uCauDeep * 0.55, uCauDeep * 1.35 + 0.03, smoothstep(-0.6, 0.6, p.y));
  vec3 col = water + uCauLight * c * uCauBright;
  emit(col);
}
`,
});
