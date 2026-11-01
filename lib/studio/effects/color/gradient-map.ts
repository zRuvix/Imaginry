import { colorCount, type Control, defineEffect, flatColors, mono, p } from "../define";

const controls: Control[] = [
  { key: "colors", label: "Colors", type: "colors", max: 5 },
  { key: "reverse", label: "Reverse", type: "toggle" },
];

/** Recolors by brightness, shadows to highlights. */
export default defineEffect({
  key: "gradientmap",
  label: "Gradient Map",
  category: "Color",
  blurb: "Recolors by brightness, shadows to highlights.",
  controls,
  defaults: { colors: ["#120a1e", "#ff5a2c", "#ffe2b8"], reverse: false },
  presets: {
    thumbBase: { gradient: mono },
    list: [
      p("gm-ember", { name: "Ember", colors: ["#120a1e", "#ff5a2c", "#ffe2b8"], reverse: false }),
      p("gm-ocean", { name: "Ocean", colors: ["#04132b", "#2b7bd6", "#d9f2ff"], reverse: false }),
      p("gm-neon", { name: "Neon", colors: ["#0a0014", "#ff00aa", "#00ffd5"], reverse: false }),
      p("gm-sepia", { name: "Sepia", colors: ["#1a1008", "#c08a4a", "#f4e3c3"], reverse: false }),
    ],
  },
  uniforms: (s) => ({
    uMapColors: flatColors(s.gradientmap.colors),
    uMapCount: colorCount(s.gradientmap.colors),
    uMapReverse: s.gradientmap.reverse ? 1 : 0,
  }),
  glsl: /* glsl */ `
uniform vec3 uMapColors[5];
uniform float uMapCount;
uniform float uMapReverse;

vec3 mapRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  float n = max(uMapCount - 1.0, 1.0);
  float f = t * n;
  int i = int(min(floor(f), n - 1.0));
  float k = smoothstep(0.0, 1.0, f - float(i));
  return mix(uMapColors[i], uMapColors[min(i + 1, int(n))], k);
}

void main() {
  float l = clamp(luma(inputFc(gl_FragCoord.xy)), 0.0, 1.0);
  emit(mapRamp(uMapReverse > 0.5 ? 1.0 - l : l));
}
`,
});
