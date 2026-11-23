import { type Control, defineEffect, n, slider } from "@/lib/studio/effects/define";
import { paletteGlsl, paletteUniforms } from "./common";

const controls: Control[] = [
  { key: "colors", label: "Reflections", type: "colors", max: 5 },
  slider("scale", "Scale", 0.2, 3, 0.01),
  slider("flow", "Flow", 0, 2, 0.01),
  slider("depth", "Depth", 0, 1, 0.01),
  slider("bands", "Bands", 0.5, 6, 0.01),
  slider("shine", "Shine", 0, 2, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Molten metal: a warped surface that reflects a studio of your colors. */
export default defineEffect({
  key: "chrome",
  label: "Liquid Chrome",
  category: "Lab",
  blurb: "Molten metal that mirrors your colors.",
  controls,
  defaults: {
    colors: ["#0b0b0f", "#3d4250", "#c9ced8", "#ffffff", "#7c8496"],
    scale: 1,
    flow: 1,
    depth: 0.55,
    bands: 1.1,
    shine: 1,
    speed: 0.6,
  },
  uniforms: (s) => ({
    ...paletteUniforms("uChrC", s.chrome.colors),
    uChrScale: n(s.chrome.scale),
    uChrFlow: n(s.chrome.flow),
    uChrDepth: n(s.chrome.depth),
    uChrBands: n(s.chrome.bands),
    uChrShine: n(s.chrome.shine),
    uChrSpeed: n(s.chrome.speed),
  }),
  glsl: /* glsl */ `
${paletteGlsl("uChrC")}
uniform float uChrScale;
uniform float uChrFlow;
uniform float uChrDepth;
uniform float uChrBands;
uniform float uChrShine;
uniform float uChrSpeed;

// Two soft octaves: big, smooth pools of metal rather than crumpled foil.
float soft(vec2 p) { return noise(p) * 0.7 + noise(p * 2.03 + 3.7) * 0.3; }

float surface(vec2 p) {
  float t = uTime * uChrSpeed * 0.1;
  vec2 q = vec2(soft(p + vec2(0.0, t) + uSeed), soft(p + vec2(5.2, 1.3) - t));
  return soft(p + uChrFlow * 1.3 * q + vec2(t * 0.4, -t * 0.25));
}

void main() {
  vec2 p = fragP() * uChrScale * 1.5;
  float e = 0.01;
  float h = surface(p);
  vec2 g = vec2(surface(p + vec2(e, 0.0)) - h, surface(p + vec2(0.0, e)) - h) / e;
  vec3 nrm = normalize(vec3(-g * mix(0.25, 1.4, uChrDepth), 1.0));
  vec3 view = vec3(0.0, 0.0, 1.0);
  vec3 r = reflect(-view, nrm);
  // A soft-box studio: bands of the palette across the reflected direction.
  float env = r.y * 0.5 + 0.5 + r.x * 0.18;
  float band = sin((env + h * 0.6) * uChrBands * TAU) * 0.5 + 0.5;
  vec3 col = pal(clamp(mix(env, band, 0.55), 0.0, 1.0));
  vec3 light = normalize(vec3(-0.45, 0.6, 0.65));
  float spec = pow(max(dot(reflect(-light, nrm), view), 0.0), 48.0) * uChrShine;
  float rim = pow(1.0 - max(nrm.z, 0.0), 2.0);
  col = col * (0.6 + 0.4 * nrm.z) + spec + rim * 0.35 * pal(1.0);
  emit(col);
}
`,
});
