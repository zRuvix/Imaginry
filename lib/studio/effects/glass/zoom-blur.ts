import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("strength", "Strength", 0, 1, 0.01),
  slider("x", "Center X", -1, 1, 0.01),
  slider("y", "Center Y", -1, 1, 0.01),
];

/** Rushes everything toward a center point. */
export default defineEffect({
  key: "zoomblur",
  label: "Zoom Blur",
  category: "Glass & optics",
  blurb: "Rushes everything toward a center point.",
  controls,
  defaults: { strength: 0.4, x: 0, y: 0 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("zb-warp", { name: "Warp", strength: 0.5, x: 0, y: 0 }),
      p("zb-gentle", { name: "Gentle", strength: 0.2, x: 0, y: 0 }),
      p("zb-off", { name: "Off-center", strength: 0.6, x: 0.5, y: 0.4 }),
    ],
  },
  uniforms: (s) => ({
    uZbStrength: n(s.zoomblur.strength),
    uZbCenter: [n(s.zoomblur.x), n(s.zoomblur.y)],
  }),
  glsl: /* glsl */ `
uniform float uZbStrength;
uniform vec2 uZbCenter;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 c = uZbCenter * 0.5 + 0.5;
  vec2 d = uv - c;
  float j = hash(gl_FragCoord.xy);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    float t = (float(i) + j) / 24.0;
    acc += texture(uInput, c + d * (1.0 - t * uZbStrength * 0.4)).rgb;
  }
  emit(acc / 24.0);
}
`,
});
