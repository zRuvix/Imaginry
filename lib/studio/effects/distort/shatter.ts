import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("pieces", "Pieces", 2, 30, 1),
  slider("offset", "Scatter", 0, 2, 0.01),
  slider("rotate", "Twist", 0, 2, 0.01),
  slider("gap", "Cracks", 0, 0.4, 0.01),
  { key: "gapColor", label: "Crack color", type: "color" },
];

/** Breaks the image into shards that slip and turn. */
export default defineEffect({
  key: "shatter",
  label: "Shatter",
  category: "Distort",
  blurb: "Breaks the image into shards that slip and turn.",
  controls,
  defaults: { pieces: 8, offset: 0.6, rotate: 0.4, gap: 0.05, gapColor: "#08070a" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("sh-glass", { name: "Broken glass", pieces: 8, offset: 0.6, rotate: 0.4, gap: 0.05, gapColor: "#08070a" }),
      p("sh-shards", { name: "Shards", pieces: 16, offset: 1.2, rotate: 0.8, gap: 0.08, gapColor: "#08070a" }),
      p("sh-crack", { name: "Hairline", pieces: 5, offset: 0.15, rotate: 0.05, gap: 0.02, gapColor: "#f4ecdf" }),
    ],
  },
  uniforms: (s) => ({
    uShPieces: n(s.shatter.pieces) || 8,
    uShOffset: n(s.shatter.offset),
    uShRotate: n(s.shatter.rotate),
    uShGap: n(s.shatter.gap),
    uShGapColor: hexToRgb(String(s.shatter.gapColor)),
  }),
  glsl: /* glsl */ `
uniform float uShPieces;
uniform float uShOffset;
uniform float uShRotate;
uniform float uShGap;
uniform vec3 uShGapColor;

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
  vec2 p = fragP() * uShPieces;
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 best = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(ip + g + uSeed);
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
  float h = hash(best);
  vec2 off = (vec2(hash(best + 1.7), hash(best + 4.3)) - 0.5) * uShOffset * 0.15;
  vec2 local = (p - best) / uShPieces;
  vec2 src = best / uShPieces + rot((h - 0.5) * uShRotate) * local + off;
  float crack = smoothstep(uShGap * 0.5, uShGap * 0.5 + 0.03, sqrt(d2) - sqrt(d1));
  emit(mix(uShGapColor, inputAt(src) * (0.88 + 0.24 * h), crack));
}
`,
});
