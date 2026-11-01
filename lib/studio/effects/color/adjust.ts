import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("exposure", "Exposure", -2, 2, 0.01),
  slider("brightness", "Brightness", -0.5, 0.5, 0.01),
  slider("contrast", "Contrast", 0, 2, 0.01),
  slider("saturation", "Saturation", 0, 2, 0.01),
  slider("hue", "Hue", -180, 180, 1),
  slider("temperature", "Temperature", -1, 1, 0.01),
];

/** Exposure, contrast, saturation and hue. */
export default defineEffect({
  key: "adjust",
  label: "Adjust",
  category: "Color",
  blurb: "Exposure, contrast, saturation and hue.",
  controls,
  defaults: { exposure: 0, brightness: 0, contrast: 1.1, saturation: 1.15, hue: 0, temperature: 0.2 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("ad-warm", {
        name: "Warm film",
        exposure: 0.1,
        brightness: 0,
        contrast: 1.1,
        saturation: 0.9,
        hue: 0,
        temperature: 0.6,
      }),
      p("ad-cool", {
        name: "Cool fade",
        exposure: 0,
        brightness: 0.06,
        contrast: 0.85,
        saturation: 0.8,
        hue: 0,
        temperature: -0.6,
      }),
      p("ad-punch", {
        name: "Punch",
        exposure: 0.1,
        brightness: 0,
        contrast: 1.4,
        saturation: 1.5,
        hue: 0,
        temperature: 0,
      }),
      p("ad-shift", {
        name: "Hue shift",
        exposure: 0,
        brightness: 0,
        contrast: 1.05,
        saturation: 1.1,
        hue: 120,
        temperature: 0,
      }),
    ],
  },
  uniforms: (s) => ({
    uAdjBright: n(s.adjust.brightness),
    uAdjContrast: n(s.adjust.contrast),
    uAdjSat: n(s.adjust.saturation),
    uAdjHue: n(s.adjust.hue),
    uAdjExposure: n(s.adjust.exposure),
    uAdjTemp: n(s.adjust.temperature),
  }),
  glsl: /* glsl */ `
uniform float uAdjBright;
uniform float uAdjContrast;
uniform float uAdjSat;
uniform float uAdjHue;
uniform float uAdjExposure;
uniform float uAdjTemp;

vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

void main() {
  vec3 c = inputFc(gl_FragCoord.xy);
  c *= exp2(uAdjExposure);
  c += uAdjBright;
  c = (c - 0.5) * uAdjContrast + 0.5;
  c = mix(vec3(luma(c)), c, uAdjSat);
  c = hueShift(c, radians(uAdjHue));
  c += vec3(uAdjTemp, uAdjTemp * 0.25, -uAdjTemp) * 0.08;
  emit(c);
}
`,
});
