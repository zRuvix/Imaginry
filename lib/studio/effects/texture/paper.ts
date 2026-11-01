import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("amount", "Amount", 0, 1, 0.01),
  slider("scale", "Grain", 0.3, 3, 0.01),
  slider("fibers", "Fibers", 0, 1, 0.01),
  { key: "tint", label: "Paper", type: "color" },
];

/** Prints the image onto textured paper with fibers and tooth. */
export default defineEffect({
  key: "paper",
  label: "Paper",
  category: "Texture",
  blurb: "Prints the image onto textured, fibrous paper.",
  controls,
  defaults: { amount: 0.8, scale: 1, fibers: 0.4, tint: "#f4ecdc" },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("pa-cotton", { name: "Cotton", amount: 0.8, scale: 1, fibers: 0.4, tint: "#f4ecdc" }),
      p("pa-kraft", { name: "Kraft", amount: 0.9, scale: 1.4, fibers: 0.8, tint: "#d9b98a" }),
      p("pa-wash", { name: "Watercolor", amount: 0.7, scale: 0.6, fibers: 0.2, tint: "#fbf6ee" }),
    ],
  },
  uniforms: (s) => ({
    uPpAmount: n(s.paper.amount),
    uPpScale: n(s.paper.scale) || 1,
    uPpFibers: n(s.paper.fibers),
    uPpTint: hexToRgb(String(s.paper.tint)),
  }),
  glsl: /* glsl */ `
uniform float uPpAmount;
uniform float uPpScale;
uniform float uPpFibers;
uniform vec3 uPpTint;

void main() {
  vec2 p = fragP() * uPpScale * 8.0;
  float tooth = fbm(p * 3.0 + uSeed);
  float bump = fbm((p + 0.3) * 3.0 + uSeed) - tooth;
  float speck = noise(p * 40.0);
  float fiber = pow(abs(sin((p.x * 0.7 + fbm(p * 0.6) * 6.0) * 12.0)), 40.0) * uPpFibers;
  vec3 c = inputFc(gl_FragCoord.xy);
  vec3 paper = uPpTint * (0.92 + 0.08 * tooth) + bump * 0.6 - fiber * 0.08 + (speck - 0.5) * 0.04;
  emit(mix(c, c * paper * 1.08, uPpAmount));
}
`,
});
