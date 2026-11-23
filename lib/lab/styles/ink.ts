import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";

const controls: Control[] = [
  { key: "ink", label: "Ink", type: "color" },
  { key: "accent", label: "Accent", type: "color" },
  { key: "paper", label: "Paper", type: "color" },
  slider("amount", "Amount", 0, 1, 0.01),
  slider("scale", "Scale", 0.3, 3, 0.01),
  slider("detail", "Detail", 0.5, 3, 0.01),
  slider("edge", "Edge", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Ink blooming through water onto paper, with darker drying edges. */
export default defineEffect({
  key: "ink",
  label: "Ink Bloom",
  category: "Lab",
  blurb: "Ink blooming through water, with drying edges.",
  controls,
  defaults: { ink: "#14213d", accent: "#e76f51", paper: "#f2ebe0", amount: 0.5, scale: 1, detail: 1.2, edge: 0.6, speed: 0.5 },
  uniforms: (s) => ({
    uInkInk: hexToRgb(String(s.ink.ink)),
    uInkAccent: hexToRgb(String(s.ink.accent)),
    uInkPaper: hexToRgb(String(s.ink.paper)),
    uInkAmount: n(s.ink.amount),
    uInkScale: n(s.ink.scale),
    uInkDetail: n(s.ink.detail),
    uInkEdge: n(s.ink.edge),
    uInkSpeed: n(s.ink.speed),
  }),
  glsl: /* glsl */ `
uniform vec3 uInkInk;
uniform vec3 uInkAccent;
uniform vec3 uInkPaper;
uniform float uInkAmount;
uniform float uInkScale;
uniform float uInkDetail;
uniform float uInkEdge;
uniform float uInkSpeed;

void main() {
  vec2 p = fragP() * 1.8 / uInkScale;
  float t = uTime * uInkSpeed * 0.06;
  vec2 q = vec2(fbm(p * uInkDetail + t + uSeed), fbm(p * uInkDetail + vec2(3.1, 7.7) - t));
  vec2 r = vec2(
    fbm(p * uInkDetail + 3.0 * q + vec2(1.2, 4.5) + t * 1.3),
    fbm(p * uInkDetail + 3.0 * q + vec2(6.1, 2.2) - t)
  );
  float f = fbm(p * uInkDetail * 0.8 + 4.0 * r);
  float th = 0.72 - uInkAmount * 0.45;
  float mask = smoothstep(th, th + 0.12, f);
  // Pigment pools at the boundary as it dries.
  float rim = 1.0 - smoothstep(0.0, 0.07, abs(f - th - 0.02));
  vec3 inkCol = mix(uInkInk, uInkAccent, smoothstep(0.45, 0.85, length(r - 0.3)) * 0.85);
  vec3 col = mix(uInkPaper, inkCol, mask * mix(0.55, 1.0, smoothstep(th, th + 0.35, f)));
  col = mix(col, uInkInk * 0.55, rim * uInkEdge * 0.8);
  // Paper tooth.
  col += (noise(gl_FragCoord.xy / px() * 0.9) - 0.5) * 0.035;
  emit(col);
}
`,
});
