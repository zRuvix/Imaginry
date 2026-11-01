import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [slider("amount", "Amount", 0, 1, 0.01), slider("angle", "Angle", -180, 180, 1)];

/** Smears the image along one direction, like a long exposure. */
export default defineEffect({
  key: "motionblur",
  label: "Motion Blur",
  category: "Glass & optics",
  blurb: "A long-exposure smear along one direction.",
  controls,
  defaults: { amount: 0.4, angle: 0 },
  presets: {
    thumbBase: { gradient: magenta, pattern: { type: "stripes", scale: 10, size: 0.5, angle: 0, softness: 0.05, background: "#0a0a0a" } },
    list: [
      p("mb-pan", { name: "Pan", amount: 0.45, angle: 0 }),
      p("mb-fall", { name: "Fall", amount: 0.5, angle: 90 }),
      p("mb-dash", { name: "Dash", amount: 0.8, angle: 25 }),
    ],
  },
  uniforms: (s) => ({
    uMbAmount: n(s.motionblur.amount),
    uMbAngle: n(s.motionblur.angle),
  }),
  glsl: /* glsl */ `
uniform float uMbAmount;
uniform float uMbAngle;

void main() {
  vec2 p = fragP();
  float a = radians(uMbAngle);
  vec2 dir = vec2(cos(a), sin(a)) * uMbAmount * 0.12;
  float j = hash(gl_FragCoord.xy);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 24; i++) acc += inputAt(p + dir * ((float(i) + j) / 24.0 - 0.5));
  emit(acc / 24.0);
}
`,
});
