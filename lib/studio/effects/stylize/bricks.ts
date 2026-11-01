import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("size", "Brick size", 6, 60, 1),
  slider("stud", "Studs", 0, 1.5, 0.01),
  slider("colors", "Palette", 2, 12, 1),
];

/** Rebuilds the image from toy bricks with studs on top. */
export default defineEffect({
  key: "bricks",
  label: "Bricks",
  category: "Stylize",
  blurb: "Rebuilds the image from toy bricks.",
  controls,
  defaults: { size: 18, stud: 1, colors: 6 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("br-toy", { name: "Toy", size: 18, stud: 1, colors: 6 }),
      p("br-big", { name: "Chunky", size: 36, stud: 1.2, colors: 4 }),
      p("br-flat", { name: "Flat tiles", size: 14, stud: 0, colors: 8 }),
    ],
  },
  uniforms: (s) => ({
    uBrSize: n(s.bricks.size) || 18,
    uBrStud: n(s.bricks.stud),
    uBrColors: n(s.bricks.colors) || 6,
  }),
  glsl: /* glsl */ `
uniform float uBrSize;
uniform float uBrStud;
uniform float uBrColors;

void main() {
  vec2 fc = gl_FragCoord.xy;
  float s = max(uBrSize * unit(), 4.0);
  vec2 cell = floor(fc / s);
  vec2 f = fract(fc / s) - 0.5;
  vec3 c = floor(inputFc((cell + 0.5) * s) * uBrColors + 0.5) / uBrColors;

  float bevel = smoothstep(0.42, 0.5, max(abs(f.x), abs(f.y)));
  vec3 col = c * (1.0 - bevel * 0.35) + (f.x < -f.y ? 0.06 : -0.06) * bevel;

  float r = length(f);
  float side = dot(f / max(r, 1e-4), vec2(-0.7, 0.7));
  float stud = smoothstep(0.3, 0.27, r);
  float rim = stud - smoothstep(0.27, 0.22, r);
  col += (stud * 0.06 + rim * side * 0.25) * uBrStud;
  col *= 1.0 - smoothstep(0.3, 0.36, r) * (1.0 - smoothstep(0.36, 0.4, r)) * 0.25 * uBrStud;
  emit(col);
}
`,
});
