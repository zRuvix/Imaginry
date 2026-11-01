import { type Control, defineEffect, hexToRgb, magenta, n, opt, p, slider } from "../define";

const controls: Control[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: ["dots", "grid", "stripes", "checker", "diamonds", "triangles"],
  },
  slider("scale", "Scale", 2, 60, 1),
  slider("size", "Size", 0.05, 1, 0.01),
  slider("angle", "Angle", -180, 180, 1),
  slider("softness", "Softness", 0, 0.5, 0.01),
  { key: "background", label: "Background", type: "color" },
];

/** Masks the image into repeating shapes. */
export default defineEffect({
  key: "pattern",
  label: "Pattern",
  category: "Texture",
  blurb: "Masks the image into repeating shapes.",
  info: "Masks the image into a repeating shape. Areas outside the shape take the background color.",
  controls,
  defaults: {
    type: "dots",
    scale: 18,
    size: 0.75,
    angle: 0,
    softness: 0.04,
    background: "#0a0a0a",
  },
  presets: {
    label: "Patterns",
    thumbBase: { gradient: magenta },
    list: [
      p("pt-dots", { type: "dots", scale: 9, size: 0.8, angle: 0, softness: 0.04, background: "#0a0a0a" }),
      p("pt-grid", { type: "grid", scale: 9, size: 0.3, angle: 0, softness: 0.03, background: "#0a0a0a" }),
      p("pt-stripes", {
        type: "stripes",
        scale: 10,
        size: 0.5,
        angle: 45,
        softness: 0.08,
        background: "#0a0a0a",
      }),
      p("pt-checker", {
        type: "checker",
        scale: 8,
        size: 0.5,
        angle: 0,
        softness: 0.02,
        background: "#0a0a0a",
      }),
      p("pt-diamonds", {
        type: "diamonds",
        scale: 12,
        size: 0.8,
        angle: 0,
        softness: 0.04,
        background: "#0a0a0a",
      }),
      p("pt-triangles", {
        type: "triangles",
        scale: 10,
        size: 0.8,
        angle: 0,
        softness: 0.03,
        background: "#0a0a0a",
      }),
    ],
  },
  uniforms: (s) => ({
    uPatType: opt(controls, "type", s.pattern.type),
    uPatScale: n(s.pattern.scale),
    uPatSize: n(s.pattern.size),
    uPatAngle: n(s.pattern.angle),
    uPatSoft: n(s.pattern.softness),
    uPatBg: hexToRgb(String(s.pattern.background)),
  }),
  glsl: /* glsl */ `
uniform float uPatType;
uniform float uPatScale;
uniform float uPatSize;
uniform float uPatAngle;
uniform float uPatSoft;
uniform vec3 uPatBg;

float patternMask(vec2 p) {
  vec2 q = rot(radians(uPatAngle)) * p * uPatScale;
  vec2 id = floor(q);
  vec2 c = fract(q) - 0.5;
  float s = uPatSize * 0.5;
  float e = max(uPatSoft, 0.005);
  int t = int(uPatType + 0.5);
  if (t == 0) return 1.0 - smoothstep(s - e, s + e, length(c));
  if (t == 1) {
    float w = s * 0.5;
    return 1.0 - smoothstep(w - e, w + e, min(abs(c.x), abs(c.y)));
  }
  if (t == 2) return 1.0 - smoothstep(s - e, s + e, abs(c.x));
  if (t == 3) {
    return mod(id.x + id.y, 2.0);
  }
  if (t == 4) return 1.0 - smoothstep(s - e, s + e, abs(c.x) + abs(c.y));
  // triangles
  float tri = max(abs(c.x) * 0.866 + c.y * 0.5, -c.y);
  return 1.0 - smoothstep(s * 0.5 - e, s * 0.5 + e, tri);
}

void main() { vec2 p = fragP(); emit(mix(uPatBg, inputAt(p), patternMask(p))); }
`,
});
