import { type Control, defineEffect, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("lines", "Scanlines", 0, 1, 0.01),
  slider("curve", "Curvature", 0, 1, 0.01),
  slider("mask", "Phosphor", 0, 1, 0.01),
  slider("flicker", "Flicker", 0, 1, 0.01),
];

/** Scanlines, phosphor mask and a curved tube. */
export default defineEffect({
  key: "crt",
  label: "CRT",
  category: "Stylize",
  blurb: "Scanlines, phosphor mask and a curved tube.",
  controls,
  defaults: { lines: 0.6, curve: 0.4, mask: 0.4, flicker: 0.3 },
  presets: {
    thumbBase: { gradient: violet },
    list: [
      p("crt-classic", { name: "Classic", lines: 0.6, curve: 0.4, mask: 0.4, flicker: 0.3 }),
      p("crt-tube", { name: "Old tube", lines: 0.8, curve: 1, mask: 0.6, flicker: 0.6 }),
      p("crt-clean", { name: "Scanlines", lines: 0.5, curve: 0, mask: 0, flicker: 0 }),
    ],
  },
  uniforms: (s) => ({
    uCrtLines: n(s.crt.lines),
    uCrtCurve: n(s.crt.curve),
    uCrtMask: n(s.crt.mask),
    uCrtFlicker: n(s.crt.flicker),
  }),
  glsl: /* glsl */ `
uniform float uCrtLines;
uniform float uCrtCurve;
uniform float uCrtMask;
uniform float uCrtFlicker;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 cc = uv - 0.5;
  cc *= 1.0 + uCrtCurve * 0.35 * dot(cc, cc);
  uv = cc + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
    emit(vec3(0.0));
    return;
  }
  vec3 c = texture(uInput, uv).rgb;
  float lines = 0.5 + 0.5 * sin(uv.y * uRes.y / max(unit() * 2.5, px()) * 3.14159);
  c *= mix(1.0, 0.55 + 0.45 * lines, uCrtLines);
  float m = mod(gl_FragCoord.x / px(), 3.0);
  vec3 mask = vec3(m < 1.0 ? 1.0 : 0.7, m >= 1.0 && m < 2.0 ? 1.0 : 0.7, m >= 2.0 ? 1.0 : 0.7);
  c *= mix(vec3(1.0), mask * 1.18, uCrtMask);
  c *= 1.0 - uCrtFlicker * 0.12 * hash(vec2(floor(uTime * 24.0), 1.0));
  c *= 1.0 - dot(cc, cc) * (0.4 + uCrtCurve);
  emit(c);
}
`,
});
