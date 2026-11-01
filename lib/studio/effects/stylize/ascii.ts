import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("size", "Size", 4, 40, 0.5), { key: "colored", label: "Colored", type: "toggle" }];

/** Rebuilds the image from characters. */
export default defineEffect({
  key: "ascii",
  label: "ASCII",
  category: "Stylize",
  blurb: "Rebuilds the image from characters.",
  controls,
  defaults: { size: 10, colored: true },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("a-fine", { size: 8, colored: true }),
      p("a-large", { size: 18, colored: true }),
      p("a-mono", { size: 10, colored: false }),
    ],
  },
  uniforms: (s) => ({
    uAsciiSize: n(s.ascii.size),
    uAsciiColored: s.ascii.colored ? 1 : 0,
  }),
  glsl: /* glsl */ `
uniform float uAsciiSize;
uniform float uAsciiColored;

float character(int n, vec2 p) {
  p = floor(p * vec2(-4.0, 4.0) + 2.5);
  if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y) {
    int a = int(round(p.x) + 5.0 * round(p.y));
    if (((n >> a) & 1) == 1) return 1.0;
  }
  return 0.0;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float cs = max(uAsciiSize * unit(), 4.0);
  vec2 cell = floor(fc / cs);
  vec3 c = inputFc((cell + 0.5) * cs);
  float g = luma(c);
  int n = 0;
  if (g > 0.1) n = 4096;
  if (g > 0.2) n = 65600;
  if (g > 0.3) n = 332772;
  if (g > 0.4) n = 15255086;
  if (g > 0.5) n = 23385164;
  if (g > 0.6) n = 15252014;
  if (g > 0.7) n = 13199452;
  if (g > 0.8) n = 11512810;
  float on = character(n, fract(fc / cs) * 2.0 - 1.0);
  emit(uAsciiColored > 0.5 ? c * on * 1.15 : vec3(on * 0.92));
}
`,
});
