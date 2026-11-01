import { type Control, defineEffect, hexToRgb, mono, n, p, slider } from "../define";

const controls: Control[] = [
  slider("scale", "Scale", 1, 20, 0.1),
  slider("opacity", "Opacity", 0, 1, 0.01),
  slider("angle", "Angle", -180, 180, 1),
  { key: "color", label: "Color", type: "color" },
];

/** Woven tartan over the image. */
export default defineEffect({
  key: "plaid",
  label: "Plaid",
  category: "Texture",
  blurb: "Woven tartan over the image.",
  controls,
  defaults: { scale: 5, opacity: 0.55, angle: 0, color: "#b3202a" },
  presets: {
    thumbBase: { gradient: { ...mono, colors: ["#3a3a3a", "#1a1a1a"] } },
    list: [
      p("pl-tartan", { scale: 5, opacity: 0.6, angle: 0, color: "#b3202a" }),
      p("pl-navy", { scale: 4, opacity: 0.6, angle: 0, color: "#2846b8" }),
      p("pl-forest", { scale: 7, opacity: 0.6, angle: 45, color: "#1f7a3e" }),
      p("pl-ivory", { scale: 3, opacity: 0.5, angle: 0, color: "#efe6cf" }),
    ],
  },
  uniforms: (s) => ({
    uPlaidScale: n(s.plaid.scale),
    uPlaidOpacity: n(s.plaid.opacity),
    uPlaidAngle: n(s.plaid.angle),
    uPlaidColor: hexToRgb(String(s.plaid.color)),
  }),
  glsl: /* glsl */ `
uniform float uPlaidScale;
uniform float uPlaidOpacity;
uniform float uPlaidAngle;
uniform vec3 uPlaidColor;

vec3 plaid(vec2 p, vec3 col) {
  vec2 q = rot(radians(uPlaidAngle)) * p * uPlaidScale;
  float bx = smoothstep(0.55, 0.6, abs(sin(q.x * 3.14159))) * 0.6
           + smoothstep(0.96, 0.98, abs(sin(q.x * 3.14159 * 3.0 + 1.0))) * 0.5;
  float by = smoothstep(0.55, 0.6, abs(sin(q.y * 3.14159))) * 0.6
           + smoothstep(0.96, 0.98, abs(sin(q.y * 3.14159 * 3.0 + 1.0))) * 0.5;
  float unit = max(min(uRes.x, uRes.y) / 1000.0, 1.0);
  float twill = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / (4.0 * unit)));
  float m = clamp(mix(bx, by, twill) + (bx * by) * 0.4, 0.0, 1.0);
  vec3 woven = mix(col, uPlaidColor, m);
  woven *= 0.92 + 0.08 * twill;
  return mix(col, woven, uPlaidOpacity);
}

void main() { vec2 p = fragP(); emit(plaid(p, inputAt(p))); }
`,
});
