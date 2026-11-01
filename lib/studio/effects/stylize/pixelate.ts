import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("size", "Size", 2, 120, 1)];

/** Big, honest pixels. */
export default defineEffect({
  key: "pixelate",
  label: "Pixelate",
  category: "Stylize",
  blurb: "Big, honest pixels.",
  controls,
  defaults: { size: 16 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [p("px-fine", { size: 10 }), p("px-mid", { size: 24 }), p("px-chunky", { size: 60 })],
  },
  uniforms: (s) => ({
    uPixSize: n(s.pixelate.size),
  }),
  glsl: /* glsl */ `
uniform float uPixSize;

void main() {
  float s = max(uPixSize * unit(), 1.0);
  emit(inputFc((floor(gl_FragCoord.xy / s) + 0.5) * s));
}
`,
});
