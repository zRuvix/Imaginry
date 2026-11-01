import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("strength", "Depth", 0, 3, 0.01),
  slider("angle", "Light angle", -180, 180, 1),
  { key: "colored", label: "Keep color", type: "toggle" },
];

/** Raises the image into relief, lit from one side. */
export default defineEffect({
  key: "emboss",
  label: "Emboss",
  category: "Stylize",
  blurb: "Raises the image into relief, lit from one side.",
  controls,
  defaults: { strength: 1.2, angle: 135, colored: false },
  presets: {
    thumbBase: { gradient: magenta, pattern: { type: "diamonds", scale: 8, size: 0.8, angle: 0, softness: 0.1, background: "#1a1a1a" } },
    list: [
      p("em-metal", { name: "Metal", strength: 1.4, angle: 135, colored: false }),
      p("em-color", { name: "Relief", strength: 1, angle: 45, colored: true }),
      p("em-deep", { name: "Deep", strength: 2.6, angle: -45, colored: false }),
    ],
  },
  uniforms: (s) => ({
    uEmStrength: n(s.emboss.strength),
    uEmAngle: n(s.emboss.angle),
    uEmColor: s.emboss.colored ? 1 : 0,
  }),
  glsl: /* glsl */ `
uniform float uEmStrength;
uniform float uEmAngle;
uniform float uEmColor;

void main() {
  vec2 fc = gl_FragCoord.xy;
  float a = radians(uEmAngle);
  vec2 d = vec2(cos(a), sin(a)) * max(unit() * 1.5, 1.0);
  float e = (luma(inputFc(fc + d)) - luma(inputFc(fc - d))) * uEmStrength * 3.0;
  vec3 base = uEmColor > 0.5 ? inputFc(fc) : vec3(0.5);
  emit(base + e);
}
`,
});
