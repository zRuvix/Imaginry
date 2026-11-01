import { type Control, defineEffect, hexToRgb, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("intensity", "Intensity", 0, 2, 0.01),
  slider("x", "Position X", -1, 1, 0.01),
  slider("y", "Position Y", -1, 1, 0.01),
  slider("ghosts", "Ghosts", 0, 2, 0.01),
  { key: "color", label: "Color", type: "color" },
];

/** A camera lens flare: hot core, anamorphic streak, halo and ghosts. */
export default defineEffect({
  key: "flare",
  label: "Lens Flare",
  category: "Light",
  blurb: "Hot core, anamorphic streak, halo and ghosts.",
  controls,
  defaults: { intensity: 1, x: -0.4, y: 0.4, ghosts: 1, color: "#ffe2b0" },
  presets: {
    thumbBase: { gradient: { ...violet, colors: ["#0b0b1e", "#2a2366", "#5a5adb", "#141432"] } },
    list: [
      p("fl-sun", { name: "Sun", intensity: 1, x: -0.4, y: 0.4, ghosts: 1, color: "#ffe2b0" }),
      p("fl-ana", { name: "Anamorphic", intensity: 1.1, x: 0.2, y: 0.1, ghosts: 0.6, color: "#9cc8ff" }),
      p("fl-dusk", { name: "Dusk", intensity: 0.9, x: 0.5, y: -0.3, ghosts: 1.4, color: "#ff9a5a" }),
    ],
  },
  uniforms: (s) => ({
    uFlarePos: [n(s.flare.x), n(s.flare.y)],
    uFlareIntensity: n(s.flare.intensity),
    uFlareGhosts: n(s.flare.ghosts),
    uFlareColor: hexToRgb(String(s.flare.color)),
  }),
  glsl: /* glsl */ `
uniform vec2 uFlarePos;
uniform float uFlareIntensity;
uniform float uFlareGhosts;
uniform vec3 uFlareColor;

void main() {
  vec2 p = fragP();
  vec2 lp = uFlarePos * vec2(aspect() * 0.5, 0.5);
  vec2 d = p - lp;
  float r = length(d);
  float core = exp(-r * r * 60.0) * 1.2 + exp(-r * 6.0) * 0.35;
  float streak = exp(-abs(d.y) * 120.0) * exp(-abs(d.x) * 1.5) * 0.6;
  vec2 dir = d / max(r, 1e-4);
  float rays = pow(noise(dir * 4.0 + uTime * 0.05), 4.0) * exp(-r * 3.0) * 0.8;
  vec3 col = uFlareColor * (core + streak + rays);
  // Ghosts sit on the line through the centre of the frame.
  for (int i = 1; i <= 4; i++) {
    float fi = float(i);
    vec2 gp = -lp * (0.4 * fi - 0.3);
    float size = 0.03 + 0.025 * fi;
    float g = smoothstep(size, size * 0.6, length(p - gp)) * 0.12 * uFlareGhosts;
    col += (0.5 + 0.5 * cos(fi * 1.7 + vec3(0.0, 2.0, 4.0))) * g;
  }
  col += vec3(0.6, 0.8, 1.0) * exp(-pow((r - 0.35) * 18.0, 2.0)) * 0.15 * uFlareGhosts;
  emit(screen(inputFc(gl_FragCoord.xy), clamp(col * uFlareIntensity, 0.0, 1.0)));
}
`,
});
