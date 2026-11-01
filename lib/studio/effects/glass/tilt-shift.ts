import { type Control, defineEffect, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("focus", "Focus", -1, 1, 0.01),
  slider("width", "Band", 0, 1, 0.01),
  slider("blur", "Blur", 0, 2, 0.01),
  slider("saturation", "Saturation", 0, 2, 0.01),
];

/** Sharp band, blurred above and below: the miniature look. */
export default defineEffect({
  key: "tiltshift",
  label: "Tilt-Shift",
  category: "Glass & optics",
  blurb: "A sharp band with blur above and below.",
  controls,
  defaults: { focus: 0, width: 0.25, blur: 1, saturation: 1.2 },
  presets: {
    thumbBase: { gradient: violet, pattern: { type: "dots", scale: 9, size: 0.7, angle: 0, softness: 0.04, background: "#0a0a0a" } },
    list: [
      p("ts-mini", { name: "Miniature", focus: 0, width: 0.25, blur: 1, saturation: 1.3 }),
      p("ts-low", { name: "Low band", focus: -0.5, width: 0.2, blur: 1.4, saturation: 1.1 }),
      p("ts-dream", { name: "Dreamy", focus: 0.2, width: 0.1, blur: 2, saturation: 0.9 }),
    ],
  },
  uniforms: (s) => ({
    uTsFocus: n(s.tiltshift.focus),
    uTsWidth: n(s.tiltshift.width),
    uTsBlur: n(s.tiltshift.blur),
    uTsSat: n(s.tiltshift.saturation),
  }),
  glsl: /* glsl */ `
uniform float uTsFocus;
uniform float uTsWidth;
uniform float uTsBlur;
uniform float uTsSat;

void main() {
  vec2 p = fragP();
  float k = smoothstep(uTsWidth * 0.5, uTsWidth * 0.5 + 0.25, abs(p.y - uTsFocus * 0.5));
  float r = k * uTsBlur * 0.03;
  float spin = hash(gl_FragCoord.xy) * TAU;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float d = sqrt((fi + 0.5) / 16.0) * r;
    acc += inputAt(p + vec2(cos(fi * 2.39996 + spin), sin(fi * 2.39996 + spin)) * d);
  }
  vec3 c = acc / 16.0;
  emit(mix(vec3(luma(c)), c, uTsSat));
}
`,
});
