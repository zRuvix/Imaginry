import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("radius", "Brush", 1, 12, 0.1), slider("saturation", "Saturation", 0, 2, 0.01)];

/** Kuwahara filter: flat, painterly strokes that keep edges crisp. */
export default defineEffect({
  key: "oilpaint",
  label: "Oil Paint",
  category: "Stylize",
  blurb: "Flat painterly strokes that keep edges crisp.",
  controls,
  defaults: { radius: 4, saturation: 1.15 },
  presets: {
    thumbBase: { gradient: magenta, blobs: { count: 5, size: 0.2, softness: 0.3, speed: 0.6, mix: 1 } },
    list: [
      p("op-brush", { name: "Brush", radius: 4, saturation: 1.15 }),
      p("op-impasto", { name: "Impasto", radius: 8, saturation: 1.3 }),
      p("op-fine", { name: "Fine", radius: 2, saturation: 1 }),
    ],
  },
  uniforms: (s) => ({
    uOilRadius: n(s.oilpaint.radius) || 1,
    uOilSat: n(s.oilpaint.saturation),
  }),
  glsl: /* glsl */ `
uniform float uOilRadius;
uniform float uOilSat;

void main() {
  vec2 fc = gl_FragCoord.xy;
  float r = max(uOilRadius * unit(), px());
  vec3 m[4];
  vec3 s[4];
  for (int k = 0; k < 4; k++) {
    m[k] = vec3(0.0);
    s[k] = vec3(0.0);
  }
  // Mean and variance of the four quadrants around the pixel.
  for (int j = 0; j <= 3; j++) {
    for (int i = 0; i <= 3; i++) {
      vec2 o = vec2(float(i), float(j)) / 3.0 * r;
      vec3 a = inputFc(fc + vec2(-o.x, -o.y));
      vec3 b = inputFc(fc + vec2(o.x, -o.y));
      vec3 c = inputFc(fc + vec2(o.x, o.y));
      vec3 d = inputFc(fc + vec2(-o.x, o.y));
      m[0] += a; s[0] += a * a;
      m[1] += b; s[1] += b * b;
      m[2] += c; s[2] += c * c;
      m[3] += d; s[3] += d * d;
    }
  }
  // Take the calmest quadrant.
  float best = 1e9;
  vec3 res = vec3(0.0);
  for (int k = 0; k < 4; k++) {
    vec3 mean = m[k] / 16.0;
    vec3 v = abs(s[k] / 16.0 - mean * mean);
    float sv = v.r + v.g + v.b;
    if (sv < best) {
      best = sv;
      res = mean;
    }
  }
  emit(mix(vec3(luma(res)), res, uOilSat));
}
`,
});
