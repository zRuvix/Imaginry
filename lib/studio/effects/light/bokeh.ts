import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("density", "Density", 0.3, 3, 0.01),
  slider("size", "Size", 0.2, 2.5, 0.01),
  slider("intensity", "Intensity", 0, 2, 0.01),
  slider("speed", "Float", 0, 3, 0.01),
  { key: "color", label: "Tint", type: "color" },
];

/** Out-of-focus light discs floating over the image. */
export default defineEffect({
  key: "bokeh",
  label: "Bokeh",
  category: "Light",
  blurb: "Out-of-focus light discs floating over everything.",
  controls,
  defaults: { density: 1, size: 1, intensity: 0.9, speed: 0.6, color: "#ffc98a" },
  presets: {
    thumbBase: { gradient: { ...magenta, colors: ["#0b0612", "#3a0ca3", "#6b1d4a", "#140a1e"] } },
    list: [
      p("bk-city", { name: "Night city", density: 1, size: 1, intensity: 0.9, speed: 0.6, color: "#ffc98a" }),
      p("bk-fairy", { name: "Fairy", density: 2, size: 0.6, intensity: 1, speed: 1.2, color: "#ffe6ff" }),
      p("bk-soft", { name: "Soft", density: 0.6, size: 1.6, intensity: 0.6, speed: 0.3, color: "#ffffff" }),
    ],
  },
  uniforms: (s) => ({
    uBokDensity: n(s.bokeh.density) || 1,
    uBokSize: n(s.bokeh.size),
    uBokIntensity: n(s.bokeh.intensity),
    uBokSpeed: n(s.bokeh.speed),
    uBokColor: hexToRgb(String(s.bokeh.color)),
  }),
  glsl: /* glsl */ `
uniform float uBokDensity;
uniform float uBokSize;
uniform float uBokIntensity;
uniform float uBokSpeed;
uniform vec3 uBokColor;

void main() {
  vec2 p = fragP();
  vec3 add = vec3(0.0);
  // Three depths of discs, smaller and fainter further back.
  for (int layer = 0; layer < 3; layer++) {
    float fl = float(layer);
    float sc = uBokDensity * (2.0 + fl * 1.6);
    vec2 drift = vec2(uSeed * 3.1 + fl * 7.0, uTime * uBokSpeed * 0.06 * (1.0 + fl * 0.5));
    vec2 q = p * sc + drift;
    vec2 id = floor(q);
    float h = hash(id + fl * 13.0);
    if (h < 0.55) continue;
    vec2 o = (vec2(hash(id + 3.3), hash(id + 8.1)) - 0.5) * 0.5;
    float r = uBokSize * 0.22 * (0.6 + h * 0.6) / (1.0 + fl * 0.4);
    float d = length(fract(q) - 0.5 - o);
    float disk = smoothstep(r, r * 0.82, d) * (0.55 + 0.45 * smoothstep(r * 0.5, r, d));
    vec3 tint = mix(uBokColor, inputAt((id + 0.5 + o - drift) / sc), 0.6);
    add += tint * disk * (0.5 - fl * 0.12);
  }
  emit(screen(inputFc(gl_FragCoord.xy), clamp(add * uBokIntensity, 0.0, 1.0)));
}
`,
});
