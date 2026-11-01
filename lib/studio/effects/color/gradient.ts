import { colorCount, type Control, defineEffect, flatColors, mono, n, opt, p, slider } from "../define";

const controls: Control[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: ["linear", "radial", "conic", "mesh"],
  },
  { key: "colors", label: "Colors", type: "colors", max: 5 },
  slider("angle", "Angle", -180, 180, 1),
  slider("scale", "Scale", 0.2, 3, 0.01),
  slider("warp", "Warp", 0, 2, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** The color everything else is built on. */
export default defineEffect({
  key: "gradient",
  label: "Gradient",
  category: "Color",
  blurb: "The color everything else is built on.",
  controls,
  defaults: {
    type: "linear",
    colors: ["#ffffff", "#7a7a7a", "#000000"],
    angle: -20,
    scale: 1,
    warp: 0.3,
    speed: 0.5,
  },
  presets: {
    label: "Gradients",
    list: [
      p("g-mono", mono),
      p("g-magenta", {
        type: "radial",
        colors: ["#1a0010", "#c2105f", "#ff5aa8", "#d01070"],
        angle: 0,
        scale: 1,
        warp: 0.15,
        speed: 0.4,
      }),
      p("g-violet", {
        type: "linear",
        colors: ["#2d0aff", "#9d1cf0", "#ff2d95", "#3046ff"],
        angle: 35,
        scale: 0.9,
        warp: 0.9,
        speed: 0.5,
      }),
      p("g-ember", {
        type: "mesh",
        colors: ["#ff3b30", "#7b61ff", "#ff8a3d", "#c2185b"],
        angle: 0,
        scale: 1,
        warp: 0.5,
        speed: 0.5,
      }),
      p("g-acid", {
        type: "mesh",
        colors: ["#ffd600", "#2e1b4a", "#ff6a00", "#5b2a86"],
        angle: 0,
        scale: 1.1,
        warp: 0.7,
        speed: 0.5,
      }),
      p("g-spectrum", {
        type: "linear",
        colors: ["#00c853", "#2962ff", "#ffd600", "#d50000"],
        angle: 50,
        scale: 1,
        warp: 0.8,
        speed: 0.6,
      }),
      p("g-lilac", {
        type: "mesh",
        colors: ["#3b3366", "#b4a7e0", "#6b5ca5", "#2b2440"],
        angle: 0,
        scale: 1.3,
        warp: 0.4,
        speed: 0.3,
      }),
      p("g-teal", {
        type: "mesh",
        colors: ["#0c3b3c", "#2bb0a0", "#145c58", "#6be3c6"],
        angle: 0,
        scale: 1.2,
        warp: 0.4,
        speed: 0.3,
      }),
      p("g-sunset", {
        type: "radial",
        colors: ["#ffcc33", "#ff5a1f", "#c41e3a", "#2a0a0a"],
        angle: 0,
        scale: 1.1,
        warp: 0.35,
        speed: 0.4,
      }),
      p("g-ice", {
        type: "mesh",
        colors: ["#e9e4d6", "#3d93bf", "#173f5f", "#b8d8e8"],
        angle: 0,
        scale: 1,
        warp: 0.6,
        speed: 0.4,
      }),
      p("g-gold", {
        type: "linear",
        colors: ["#3a2a10", "#d9a441", "#f5e0a0", "#6b4a1a"],
        angle: -60,
        scale: 1,
        warp: 0.9,
        speed: 0.4,
      }),
      p("g-nebula", {
        type: "mesh",
        colors: ["#0b0b1e", "#5a5adb", "#b7a6ff", "#141432"],
        angle: 0,
        scale: 0.9,
        warp: 0.5,
        speed: 0.4,
      }),
    ],
  },
  uniforms: (s) => ({
    uGradType: opt(controls, "type", s.gradient.type),
    uColors: flatColors(s.gradient.colors),
    uColorCount: colorCount(s.gradient.colors),
    uGradAngle: n(s.gradient.angle),
    uGradScale: n(s.gradient.scale) || 1,
    uGradWarp: n(s.gradient.warp),
    uGradSpeed: n(s.gradient.speed),
  }),
  glsl: /* glsl */ `
uniform float uGradType;
uniform vec3 uColors[5];
uniform float uColorCount;
uniform float uGradAngle;
uniform float uGradScale;
uniform float uGradWarp;
uniform float uGradSpeed;

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0);
  float n = max(uColorCount - 1.0, 1.0);
  float f = t * n;
  int i = int(min(floor(f), n - 1.0));
  float k = smoothstep(0.0, 1.0, f - float(i));
  return mix(uColors[i], uColors[min(i + 1, int(n))], k);
}

vec3 gradient(vec2 p) {
  float tm = uTime * uGradSpeed;
  vec2 q = p / uGradScale;
  if (uGradWarp > 0.0) {
    vec2 w = vec2(fbm(q * 1.4 + uSeed + tm * 0.15), fbm(q * 1.4 + 7.3 + uSeed - tm * 0.15));
    q += (w - 0.5) * uGradWarp;
  }
  float a = radians(uGradAngle);
  if (uGradType < 0.5) {
    return ramp(dot(q, vec2(cos(a), sin(a))) + 0.5);
  }
  if (uGradType < 1.5) {
    return ramp(length(q) * 1.6);
  }
  if (uGradType < 2.5) {
    float t = fract(atan(q.y, q.x) / TAU + a / TAU);
    return ramp(abs(t * 2.0 - 1.0));
  }
  // mesh: each color owns a drifting control point
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uColorCount) break;
    float fi = float(i) + uSeed * 1.7;
    vec2 c = vec2(sin(fi * 2.4 + tm * 0.5), cos(fi * 1.9 + tm * 0.43)) * vec2(0.45 * aspect(), 0.42);
    float d = length(q - c);
    float w = exp(-d * d * 6.0);
    acc += uColors[i] * w;
    wsum += w;
  }
  return acc / max(wsum, 1e-4);
}

void main() {
  vec2 p = fragP();
  emit(gradient(p));
}
`,
});
