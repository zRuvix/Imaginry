import { type Control, defineEffect, GLASS_FLUTED, hexToRgb, magenta, n, opt, p, slider } from "../define";

const controls: Control[] = [
  { key: "mode", label: "Mode", type: "select", options: ["glow", "ink", "neon"] },
  slider("strength", "Strength", 0, 3, 0.01),
  slider("thickness", "Thickness", 0.5, 4, 0.1),
  { key: "color", label: "Color", type: "color" },
];

/** Traces every contour: glow, ink or neon. */
export default defineEffect({
  key: "edges",
  label: "Edges",
  category: "Stylize",
  blurb: "Traces every contour: glow, ink or neon.",
  controls,
  defaults: { mode: "glow", strength: 1.2, thickness: 1.2, color: "#ffd2a8" },
  presets: {
    thumbBase: { gradient: magenta, glass: { ...GLASS_FLUTED, type: "lens", segments: 5 } },
    list: [
      p("ed-glow", { name: "Glow", mode: "glow", strength: 1.2, thickness: 1.2, color: "#ffd2a8" }),
      p("ed-ink", { name: "Ink", mode: "ink", strength: 1.6, thickness: 1, color: "#1a1410" }),
      p("ed-neon", { name: "Neon", mode: "neon", strength: 2, thickness: 1.4, color: "#5cf2ff" }),
    ],
  },
  uniforms: (s) => ({
    uEdgeStrength: n(s.edges.strength),
    uEdgeThick: n(s.edges.thickness) || 1,
    uEdgeMode: opt(controls, "mode", s.edges.mode),
    uEdgeColor: hexToRgb(String(s.edges.color)),
  }),
  glsl: /* glsl */ `
uniform float uEdgeStrength;
uniform float uEdgeThick;
uniform float uEdgeMode;
uniform vec3 uEdgeColor;

void main() {
  vec2 fc = gl_FragCoord.xy;
  float t = max(uEdgeThick * unit(), 1.0);
  float tl = luma(inputFc(fc + vec2(-t, t)));
  float tc = luma(inputFc(fc + vec2(0.0, t)));
  float tr = luma(inputFc(fc + vec2(t, t)));
  float ml = luma(inputFc(fc + vec2(-t, 0.0)));
  float mr = luma(inputFc(fc + vec2(t, 0.0)));
  float bl = luma(inputFc(fc + vec2(-t, -t)));
  float bc = luma(inputFc(fc + vec2(0.0, -t)));
  float br = luma(inputFc(fc + vec2(t, -t)));
  float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
  float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
  float g = clamp(length(vec2(gx, gy)) * uEdgeStrength * 2.0, 0.0, 1.0);
  int m = int(uEdgeMode + 0.5);
  if (m == 0) emit(inputFc(fc) + uEdgeColor * g);
  else if (m == 1) emit(mix(vec3(0.95, 0.93, 0.88), uEdgeColor, g));
  else emit(uEdgeColor * g);
}
`,
});
