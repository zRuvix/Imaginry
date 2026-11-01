import { type Control, defineEffect, hexToRgb, mono, n, p, slider } from "../define";

const controls: Control[] = [
  slider("intensity", "Intensity", 0, 2, 0.01),
  slider("scale", "Scale", 0.3, 3, 0.01),
  slider("speed", "Drift", 0, 3, 0.01),
  { key: "colorA", label: "Color A", type: "color" },
  { key: "colorB", label: "Color B", type: "color" },
];

/** Warm film light leaks drifting in from the edges. */
export default defineEffect({
  key: "lightleak",
  label: "Light Leak",
  category: "Light",
  blurb: "Warm film leaks drifting in from the edges.",
  controls,
  defaults: { intensity: 1, scale: 1, speed: 0.6, colorA: "#ff4a1c", colorB: "#ffd27a" },
  presets: {
    thumbBase: { gradient: { ...mono, colors: ["#2a2a2a", "#111111"] } },
    list: [
      p("lk-burn", { name: "Film burn", intensity: 1, scale: 1, speed: 0.6, colorA: "#ff4a1c", colorB: "#ffd27a" }),
      p("lk-rose", { name: "Rose", intensity: 0.9, scale: 1.4, speed: 0.4, colorA: "#ff3d8b", colorB: "#ffb3c7" }),
      p("lk-teal", { name: "Teal", intensity: 0.8, scale: 0.8, speed: 0.5, colorA: "#00c2b8", colorB: "#b6fff3" }),
    ],
  },
  uniforms: (s) => ({
    uLeakIntensity: n(s.lightleak.intensity),
    uLeakScale: n(s.lightleak.scale) || 1,
    uLeakSpeed: n(s.lightleak.speed),
    uLeakA: hexToRgb(String(s.lightleak.colorA)),
    uLeakB: hexToRgb(String(s.lightleak.colorB)),
  }),
  glsl: /* glsl */ `
uniform float uLeakIntensity;
uniform float uLeakScale;
uniform float uLeakSpeed;
uniform vec3 uLeakA;
uniform vec3 uLeakB;

void main() {
  vec2 p = fragP();
  float t = uTime * uLeakSpeed * 0.15;
  float n1 = fbm(p * uLeakScale + vec2(t, -t * 0.7) + uSeed);
  float n2 = fbm(p * uLeakScale * 0.7 - vec2(t * 0.5, t) + 7.0 + uSeed);
  // Leaks gather toward the frame edges.
  float edge = smoothstep(0.2, 1.0, length(p * vec2(1.0 / aspect(), 1.0)) * 1.3);
  vec3 leak = mix(uLeakA, uLeakB, n2) * smoothstep(0.35, 0.85, n1) * (0.4 + edge);
  emit(screen(inputFc(gl_FragCoord.xy), clamp(leak * uLeakIntensity, 0.0, 1.0)));
}
`,
});
