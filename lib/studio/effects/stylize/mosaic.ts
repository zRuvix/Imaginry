import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("scale", "Cells", 3, 60, 1),
  slider("edge", "Edge", 0, 0.4, 0.01),
  slider("jitter", "Jitter", 0, 1, 0.01),
  { key: "edgeColor", label: "Edge color", type: "color" },
];

/** Stained-glass cells with leaded edges. */
export default defineEffect({
  key: "mosaic",
  label: "Mosaic",
  category: "Stylize",
  blurb: "Stained-glass cells with leaded edges.",
  controls,
  defaults: { scale: 14, edge: 0.08, jitter: 0.9, edgeColor: "#0d0c0b" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("mo-stained", { name: "Stained glass", scale: 12, edge: 0.1, jitter: 0.9, edgeColor: "#0d0c0b" }),
      p("mo-tiles", { name: "Tiles", scale: 24, edge: 0.03, jitter: 0.2, edgeColor: "#0d0c0b" }),
      p("mo-crystal", { name: "Crystal", scale: 6, edge: 0.02, jitter: 1, edgeColor: "#f4ecdf" }),
    ],
  },
  uniforms: (s) => ({
    uMosScale: n(s.mosaic.scale),
    uMosEdge: n(s.mosaic.edge),
    uMosJitter: n(s.mosaic.jitter),
    uMosEdgeColor: hexToRgb(String(s.mosaic.edgeColor)),
  }),
  glsl: /* glsl */ `
uniform float uMosScale;
uniform float uMosEdge;
uniform float uMosJitter;
uniform vec3 uMosEdgeColor;

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
  vec2 p = fragP() * uMosScale;
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 best = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = 0.5 + (hash2(ip + g + uSeed) - 0.5) * uMosJitter;
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        best = ip + g + o;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  vec3 c = inputAt(best / uMosScale);
  float edge = sqrt(d2) - sqrt(d1);
  float e = (1.0 - smoothstep(uMosEdge * 0.5, uMosEdge * 0.5 + 0.04, edge)) * step(0.001, uMosEdge);
  emit(mix(c, uMosEdgeColor, e));
}
`,
});
