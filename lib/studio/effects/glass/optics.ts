import { type Control, defineEffect, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("aberration", "Aberration", 0, 2, 0.01),
  slider("distortion", "Distortion", -1, 1, 0.01),
  slider("vignette", "Vignette", 0, 1.5, 0.01),
  slider("glow", "Glow", 0, 1.5, 0.01),
];

/** Lens distortion, fringing and glow. */
export default defineEffect({
  key: "optics",
  label: "Optics",
  category: "Glass & optics",
  blurb: "Lens distortion, fringing and glow.",
  controls,
  defaults: { aberration: 0.5, distortion: 0.15, vignette: 0.4, glow: 0.2 },
  presets: {
    thumbBase: { gradient: violet },
    list: [
      p("o-subtle", { aberration: 0.4, distortion: 0.1, vignette: 0.3, glow: 0.1 }),
      p("o-prism", { aberration: 1.6, distortion: 0.2, vignette: 0.2, glow: 0.2 }),
      p("o-fisheye", { aberration: 0.6, distortion: 0.8, vignette: 0.6, glow: 0 }),
      p("o-dream", { aberration: 0.3, distortion: -0.2, vignette: 0.9, glow: 0.9 }),
    ],
  },
  uniforms: (s) => ({
    uOptAberr: n(s.optics.aberration),
    uOptLens: n(s.optics.distortion),
    uOptVig: n(s.optics.vignette),
    uOptGlow: n(s.optics.glow),
  }),
  glsl: /* glsl */ `
uniform float uOptAberr;
uniform float uOptLens;
uniform float uOptVig;
uniform float uOptGlow;

void main() {
  vec2 p = fragP();
  p *= 1.0 + uOptLens * dot(p, p) * 0.6;
  vec3 col;
  if (uOptAberr > 0.0) {
    vec2 dir = p * (0.5 + length(p)) * uOptAberr * 0.02;
    col = vec3(inputAt(p + dir).r, inputAt(p).g, inputAt(p - dir).b);
  } else {
    col = inputAt(p);
  }
  col += col * smoothstep(0.45, 1.0, luma(col)) * uOptGlow;
  vec2 v = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - uOptVig * smoothstep(0.2, 0.9, length(v) * 1.2);
  emit(col);
}
`,
});
