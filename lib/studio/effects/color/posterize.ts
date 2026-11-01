import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("levels", "Levels", 2, 16, 1), slider("gamma", "Gamma", 0.3, 2.5, 0.01)];

/** Flattens color into a few bands. */
export default defineEffect({
  key: "posterize",
  label: "Posterize",
  category: "Color",
  blurb: "Flattens color into a few bands.",
  controls,
  defaults: { levels: 5, gamma: 1 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("po-3", { name: "Three tone", levels: 3, gamma: 1 }),
      p("po-5", { name: "Screenprint", levels: 5, gamma: 0.8 }),
      p("po-8", { name: "Banding", levels: 8, gamma: 1.4 }),
    ],
  },
  uniforms: (s) => ({
    uPostLevels: n(s.posterize.levels),
    uPostGamma: n(s.posterize.gamma) || 1,
  }),
  glsl: /* glsl */ `
uniform float uPostLevels;
uniform float uPostGamma;

void main() {
  vec3 c = pow(clamp(inputFc(gl_FragCoord.xy), 0.0, 1.0), vec3(uPostGamma));
  float lv = max(uPostLevels, 2.0);
  c = floor(c * lv) / (lv - 1.0);
  emit(pow(clamp(c, 0.0, 1.0), vec3(1.0 / uPostGamma)));
}
`,
});
