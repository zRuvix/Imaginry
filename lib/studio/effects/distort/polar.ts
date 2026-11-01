import { type Control, defineEffect, magenta, n, opt, p, slider } from "../define";

const controls: Control[] = [
  { key: "mode", label: "Mode", type: "select", options: ["to polar", "from polar"] },
  slider("zoom", "Zoom", 0.3, 3, 0.01),
  slider("rotate", "Rotate", -180, 180, 1),
];

/** Wraps the image into a circle, or unrolls a circle into a strip. */
export default defineEffect({
  key: "polar",
  label: "Polar",
  category: "Distort",
  blurb: "Wraps the image into a circle, or unrolls it.",
  controls,
  defaults: { mode: "to polar", zoom: 1, rotate: 0 },
  presets: {
    thumbBase: { gradient: magenta, pattern: { type: "stripes", scale: 8, size: 0.5, angle: 90, softness: 0.05, background: "#0a0a0a" } },
    list: [
      p("po-tunnel", { name: "Tunnel", mode: "to polar", zoom: 1, rotate: 0 }),
      p("po-planet", { name: "Planet", mode: "to polar", zoom: 0.6, rotate: 90 }),
      p("po-unroll", { name: "Unroll", mode: "from polar", zoom: 1, rotate: 0 }),
    ],
  },
  uniforms: (s) => ({
    uPolMode: opt(controls, "mode", s.polar.mode),
    uPolZoom: n(s.polar.zoom) || 1,
    uPolRotate: n(s.polar.rotate),
  }),
  glsl: /* glsl */ `
uniform float uPolMode;
uniform float uPolZoom;
uniform float uPolRotate;

void main() {
  if (uPolMode < 0.5) {
    vec2 p = fragP() / uPolZoom;
    float a = atan(p.y, p.x) / TAU + 0.5 + uPolRotate / 360.0;
    emit(texture(uInput, vec2(fract(a), clamp(length(p) * 2.0, 0.0, 1.0))).rgb);
  } else {
    vec2 uv = gl_FragCoord.xy / uRes;
    float a = (uv.x + uPolRotate / 360.0) * TAU;
    emit(inputAt(vec2(cos(a), sin(a)) * uv.y * 0.5 / uPolZoom));
  }
}
`,
});
