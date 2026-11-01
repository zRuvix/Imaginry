import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("strength", "Strength", -1, 1, 0.01),
  slider("radius", "Radius", 0.05, 1.2, 0.01),
  slider("x", "Center X", -1, 1, 0.01),
  slider("y", "Center Y", -1, 1, 0.01),
];

/** Pushes the image out like a lens, or pinches it in. */
export default defineEffect({
  key: "bulge",
  label: "Bulge",
  category: "Distort",
  blurb: "Bulges the image out like a lens, or pinches it in.",
  controls,
  defaults: { strength: 0.6, radius: 0.5, x: 0, y: 0 },
  presets: {
    thumbBase: { gradient: magenta, pattern: { type: "grid", scale: 10, size: 0.3, angle: 0, softness: 0.03, background: "#0a0a0a" } },
    list: [
      p("bu-bulge", { name: "Bulge", strength: 0.6, radius: 0.5, x: 0, y: 0 }),
      p("bu-pinch", { name: "Pinch", strength: -0.8, radius: 0.55, x: 0, y: 0 }),
      p("bu-bubble", { name: "Bubble", strength: 0.9, radius: 0.3, x: 0.4, y: 0.2 }),
    ],
  },
  uniforms: (s) => ({
    uBgStrength: n(s.bulge.strength),
    uBgRadius: n(s.bulge.radius),
    uBgCenter: [n(s.bulge.x), n(s.bulge.y)],
  }),
  glsl: /* glsl */ `
uniform float uBgStrength;
uniform float uBgRadius;
uniform vec2 uBgCenter;

void main() {
  vec2 p = fragP();
  vec2 c = uBgCenter * vec2(aspect() * 0.5, 0.5);
  vec2 d = p - c;
  float r = length(d) / max(uBgRadius, 0.01);
  if (r < 1.0) d *= 1.0 - uBgStrength * (1.0 - r * r) * 0.9;
  emit(inputAt(c + d));
}
`,
});
