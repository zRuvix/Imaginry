import { type Control, defineEffect, n, slider } from "@/lib/studio/effects/define";

const controls: Control[] = [
  { key: "colors", label: "Ink", type: "colors", max: 5 },
  slider("intensity", "Intensity", 0, 2, 0.01),
  slider("refract", "Refraction", 0, 1, 0.01),
  slider("force", "Force", 0.1, 3, 0.01),
  slider("radius", "Brush", 0.05, 1, 0.01),
  slider("curl", "Swirl", 0, 50, 0.5),
  slider("fade", "Fade", 0, 4, 0.01),
  slider("drag", "Drag", 0, 2, 0.01),
  slider("auto", "Idle stir", 0, 1, 0.01),
];

/**
 * Ink in a real fluid simulation that the cursor stirs. Put it on top of any
 * background: the ink glows over it and bends it like water.
 * (The simulation runs in the Lab, see lib/lab/fluid.ts.)
 */
export default defineEffect({
  key: "fluid",
  label: "Fluid",
  category: "Lab",
  blurb: "Ink in a real fluid the cursor stirs. Works over any background.",
  controls,
  defaults: {
    colors: ["#ff3d7f", "#7a5cff", "#22d3ee", "#ffd166"],
    intensity: 1,
    refract: 0.35,
    force: 1,
    radius: 0.25,
    curl: 22,
    fade: 0.9,
    drag: 0.25,
    auto: 0.6,
  },
  uniforms: (s) => ({
    uFlIntensity: n(s.fluid.intensity),
    uFlRefract: n(s.fluid.refract),
  }),
  glsl: /* glsl */ `
uniform sampler2D uImg;
uniform float uFlIntensity;
uniform float uFlRefract;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 ink = texture(uImg, uv).rgb;
  // The ink's slope bends what's underneath, like looking through water.
  vec2 e = 2.0 / uRes;
  float gx = luma(texture(uImg, uv + vec2(e.x, 0.0)).rgb) - luma(texture(uImg, uv - vec2(e.x, 0.0)).rgb);
  float gy = luma(texture(uImg, uv + vec2(0.0, e.y)).rgb) - luma(texture(uImg, uv - vec2(0.0, e.y)).rgb);
  vec3 below = texture(uInput, uv + vec2(gx, gy) * uFlRefract * 0.6).rgb;
  emit(screen(below, ink * uFlIntensity));
}
`,
});

/** The simulation settings, read from the layer each frame. */
export function fluidParams(s: Record<string, unknown>) {
  return {
    colors: Array.isArray(s.colors) ? (s.colors as string[]) : [],
    curl: Number(s.curl) || 0,
    fade: Number(s.fade) || 0,
    drag: Number(s.drag) || 0,
    force: Number(s.force) || 1,
    radius: Number(s.radius) || 0.25,
    auto: Number(s.auto) || 0,
  };
}
