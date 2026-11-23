import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("size", "Size", 4, 40, 0.5), { key: "colored", label: "Colored", type: "toggle" }];

/** Rebuilds the image from characters. */
export default defineEffect({
  key: "ascii",
  // Built from cells: Random motion moves each cell on its own.
  cells: true,
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

int glyphFor(float g) {
  int n = 0;
  if (g > 0.1) n = 4096;
  if (g > 0.2) n = 65600;
  if (g > 0.3) n = 332772;
  if (g > 0.4) n = 15255086;
  if (g > 0.5) n = 23385164;
  if (g > 0.6) n = 15252014;
  if (g > 0.7) n = 13199452;
  if (g > 0.8) n = 11512810;
  return n;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float cs = max(uAsciiSize * unit(), 4.0 * px());
  vec2 home = floor(fc / cs);
  vec2 local = fract(fc / cs);
  // Each character takes its colour from its home cell and may wander into
  // a neighbour's, so look one cell around when Random is on.
  int reach = cellReach();
  float on = 0.0;
  vec3 c = inputFc((home + 0.5) * cs);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      if (abs(i) > reach || abs(j) > reach) continue;
      vec2 g = vec2(float(i), float(j));
      vec2 cell = home + g;
      vec3 cc = inputFc((cell + 0.5) * cs);
      float hit = character(glyphFor(luma(cc)), (local - g - cellWander(cell)) * 2.0 - 1.0);
      if (hit > on) {
        on = hit;
        c = cc;
      }
    }
  }
  emit(uAsciiColored > 0.5 ? c * on * 1.15 : vec3(on * 0.92));
}
`,
});
