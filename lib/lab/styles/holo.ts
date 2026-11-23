import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";

const controls: Control[] = [
  { key: "base", label: "Foil", type: "color" },
  slider("crinkle", "Crinkle", 0, 1, 0.01),
  slider("spread", "Rainbow", 0.1, 2, 0.01),
  slider("tiltX", "Tilt X", -1, 1, 0.01),
  slider("tiltY", "Tilt Y", -1, 1, 0.01),
  slider("metal", "Metal", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Holographic foil: thin-film color that shifts as the sheet tilts. */
export default defineEffect({
  key: "holo",
  label: "Holo Foil",
  category: "Lab",
  blurb: "Foil that shifts color as it tilts. Map tilt to the cursor.",
  controls,
  defaults: { base: "#c8c8d4", crinkle: 0.45, spread: 0.8, tiltX: 0, tiltY: 0, metal: 0.6, speed: 0.4 },
  uniforms: (s) => ({
    uHoloBase: hexToRgb(String(s.holo.base)),
    uHoloCrinkle: n(s.holo.crinkle),
    uHoloSpread: n(s.holo.spread),
    uHoloTiltX: n(s.holo.tiltX),
    uHoloTiltY: n(s.holo.tiltY),
    uHoloMetal: n(s.holo.metal),
    uHoloSpeed: n(s.holo.speed),
  }),
  glsl: /* glsl */ `
uniform vec3 uHoloBase;
uniform float uHoloCrinkle;
uniform float uHoloSpread;
uniform float uHoloTiltX;
uniform float uHoloTiltY;
uniform float uHoloMetal;
uniform float uHoloSpeed;

vec3 spectral(float x) { return 0.5 + 0.5 * cos(TAU * (x + vec3(0.0, 0.33, 0.67))); }

float sheet(vec2 p) {
  float t = uTime * uHoloSpeed * 0.08;
  vec2 q = p * mix(1.1, 4.5, uHoloCrinkle) + uSeed + vec2(t, -t * 0.7);
  return noise(q) * 0.75 + noise(q * 2.3 + 1.7) * 0.25;
}

void main() {
  vec2 p = fragP();
  float e = 0.003;
  float h = sheet(p);
  vec2 g = vec2(sheet(p + vec2(e, 0.0)) - h, sheet(p + vec2(0.0, e)) - h) / e;
  vec3 nrm = normalize(vec3(-g * mix(0.05, 0.3, uHoloCrinkle), 1.0));
  vec3 view = normalize(vec3(uHoloTiltX + p.x * 0.5, uHoloTiltY + p.y * 0.5, 1.0));
  float facing = dot(nrm, view);
  // Thin-film interference: the hue follows the angle between sheet and eye,
  // in broad pastel bands like real foil rather than a busy rainbow.
  float film = facing * uHoloSpread * 1.6 + h * 0.6 + (p.x * 0.45 + p.y * 0.7) * uHoloSpread * 0.7 + uTime * uHoloSpeed * 0.04;
  vec3 rainbow = mix(spectral(film), vec3(1.0), 0.22);
  vec3 col = mix(uHoloBase, rainbow * mix(vec3(1.0), uHoloBase * 1.25, 0.4), 0.68);
  vec3 light = normalize(vec3(uHoloTiltX * 0.8 - 0.3, uHoloTiltY * 0.8 + 0.5, 0.8));
  float spec = pow(max(dot(reflect(-light, nrm), view), 0.0), 36.0);
  col = col * (0.75 + 0.25 * nrm.z) + spec * uHoloMetal * 0.8;
  emit(col);
}
`,
});
