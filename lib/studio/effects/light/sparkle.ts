import { type Control, defineEffect, hexToRgb, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("density", "Density", 0.3, 4, 0.01),
  slider("size", "Size", 0.2, 3, 0.01),
  slider("speed", "Twinkle", 0, 4, 0.01),
  { key: "color", label: "Color", type: "color" },
];

/** Twinkling star points over everything. */
export default defineEffect({
  key: "sparkle",
  label: "Sparkle",
  category: "Light",
  blurb: "Twinkling star points over everything.",
  controls,
  defaults: { density: 1.4, size: 1, speed: 1.2, color: "#fff4e0" },
  presets: {
    thumbBase: { gradient: { ...violet, colors: ["#0b0b1e", "#2a2366", "#5a5adb", "#141432"] } },
    list: [
      p("sp-dust", { name: "Dust", density: 2.5, size: 0.5, speed: 1, color: "#fff4e0" }),
      p("sp-stars", { name: "Stars", density: 1.2, size: 1.2, speed: 1.4, color: "#ffffff" }),
      p("sp-glitter", { name: "Glitter", density: 3.5, size: 0.8, speed: 3, color: "#ffc9e8" }),
    ],
  },
  uniforms: (s) => ({
    uSparkDensity: n(s.sparkle.density),
    uSparkSize: n(s.sparkle.size),
    uSparkSpeed: n(s.sparkle.speed),
    uSparkColor: hexToRgb(String(s.sparkle.color)),
  }),
  glsl: /* glsl */ `
uniform float uSparkDensity;
uniform float uSparkSize;
uniform float uSparkSpeed;
uniform vec3 uSparkColor;

void main() {
  vec3 c = inputFc(gl_FragCoord.xy);
  vec2 p = fragP() * uSparkDensity * 10.0;
  vec2 ip = floor(p);
  vec2 fp = fract(p) - 0.5;
  float h = hash(ip + uSeed);
  if (h > 0.55) {
    vec2 d = fp - (vec2(hash(ip + 3.1), hash(ip + 7.7)) - 0.5) * 0.6;
    float twinkle = 0.5 + 0.5 * sin(uTime * uSparkSpeed * 3.0 + h * 40.0);
    float s = uSparkSize * 0.12 * (0.5 + h);
    float rays = max(0.0, 1.0 - abs(d.x) / (s * 0.12)) * max(0.0, 1.0 - abs(d.y) / (s * 2.2))
                + max(0.0, 1.0 - abs(d.y) / (s * 0.12)) * max(0.0, 1.0 - abs(d.x) / (s * 2.2));
    float core = exp(-dot(d, d) / (s * s * 0.04));
    c = screen(c, clamp(uSparkColor * (rays * 0.8 + core) * twinkle, 0.0, 1.0));
  }
  emit(c);
}
`,
});
