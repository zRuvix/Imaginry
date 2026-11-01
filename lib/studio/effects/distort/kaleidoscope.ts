import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("segments", "Segments", 2, 16, 1),
  slider("rotate", "Rotate", -180, 180, 1),
  slider("zoom", "Zoom", 0.3, 3, 0.01),
  slider("speed", "Spin", -2, 2, 0.01),
];

/** Folds the image into mirrored wedges. */
export default defineEffect({
  key: "kaleido",
  label: "Kaleidoscope",
  category: "Distort",
  blurb: "Folds the image into mirrored wedges.",
  controls,
  defaults: { segments: 6, rotate: 0, zoom: 1, speed: 0 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("ka-6", { name: "Six fold", segments: 6, rotate: 0, zoom: 1, speed: 0 }),
      p("ka-8", { name: "Spinning", segments: 8, rotate: 20, zoom: 1.4, speed: 0.6 }),
      p("ka-12", { name: "Rosette", segments: 12, rotate: 0, zoom: 0.7, speed: 0 }),
    ],
  },
  uniforms: (s) => ({
    uKalSegments: n(s.kaleido.segments),
    uKalRotate: n(s.kaleido.rotate),
    uKalZoom: n(s.kaleido.zoom) || 1,
    uKalSpeed: n(s.kaleido.speed),
  }),
  glsl: /* glsl */ `
uniform float uKalSegments;
uniform float uKalRotate;
uniform float uKalZoom;
uniform float uKalSpeed;

void main() {
  vec2 p = fragP() / uKalZoom;
  float r = length(p);
  float a = atan(p.y, p.x) + radians(uKalRotate) + uTime * uKalSpeed * 0.25;
  float seg = TAU / max(uKalSegments, 1.0);
  a = mod(a, seg);
  a = abs(a - seg * 0.5);
  emit(inputAt(vec2(cos(a), sin(a)) * r));
}
`,
});
