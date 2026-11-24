import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("radius", "Radius", 0, 80, 0.5), slider("saturation", "Saturation", 0, 2, 0.01)];

/** A soft, even blur: melts everything below into smooth color. */
export default defineEffect({
  key: "blur",
  label: "Blur",
  category: "Glass & optics",
  blurb: "Melts everything below into smooth color.",
  controls,
  defaults: { radius: 18, saturation: 1.1 },
  presets: {
    thumbBase: { gradient: magenta, pattern: { type: "dots", scale: 7, size: 0.45, angle: 0, softness: 0.05, background: "#0a0a0a" } },
    list: [
      p("blr-soft", { name: "Soft", radius: 10, saturation: 1 }),
      p("blr-haze", { name: "Haze", radius: 28, saturation: 1.15 }),
      p("blr-melt", { name: "Melt", radius: 64, saturation: 1.35 }),
    ],
  },
  uniforms: (s) => ({ uBlrRadius: n(s.blur.radius), uBlrSat: n(s.blur.saturation) }),
  glsl: /* glsl */ `
uniform float uBlrRadius;
uniform float uBlrSat;

// Taps on a golden-angle spiral, turned per pixel so wide blurs dither
// smoothly instead of showing rings.
void main() {
  vec2 fc = gl_FragCoord.xy;
  float r = uBlrRadius * unit();
  vec3 c;
  if (r < 0.5) {
    c = inputFc(fc);
  } else {
    const int N = 64;
    float spin = hash(fc) * TAU;
    vec3 acc = vec3(0.0);
    float total = 0.0;
    for (int i = 0; i < N; i++) {
      float t = (float(i) + 0.5) / float(N);
      float a = float(i) * 2.39996323 + spin;
      float w = exp(-2.2 * t);
      acc += inputFc(fc + vec2(cos(a), sin(a)) * sqrt(t) * r) * w;
      total += w;
    }
    c = acc / total;
  }
  emit(mix(vec3(luma(c)), c, uBlrSat));
}
`,
});
