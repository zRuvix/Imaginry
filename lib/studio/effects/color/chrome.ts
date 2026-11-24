import { type Control, defineEffect, hexToRgb, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("depth", "Depth", 0, 3, 0.01),
  slider("smooth", "Smooth", 0, 1, 0.01),
  slider("shine", "Shine", 0, 1, 0.01),
  { key: "tint", label: "Metal", type: "color" },
];

/** Liquid metal: the shapes below become polished chrome reflecting a studio sky. */
export default defineEffect({
  key: "chrome",
  label: "Chrome",
  category: "Color",
  blurb: "Turns the shapes below into polished liquid metal.",
  controls,
  defaults: { depth: 1.2, smooth: 0.5, shine: 0.6, tint: "#e4e9ef" },
  presets: {
    thumbBase: { gradient: magenta, blobs: { count: 6, size: 0.5, softness: 0.6, speed: 0.3, mix: 0.8 } },
    list: [
      p("chr-silver", { name: "Silver", depth: 1.2, smooth: 0.5, shine: 0.6, tint: "#e4e9ef" }),
      p("chr-gold", { name: "Gold", depth: 1.4, smooth: 0.55, shine: 0.7, tint: "#ffcf7a" }),
      p("chr-black", { name: "Black chrome", depth: 1.6, smooth: 0.45, shine: 0.85, tint: "#7c8590" }),
      p("chr-rose", { name: "Rose", depth: 1, smooth: 0.65, shine: 0.5, tint: "#f6b8b0" }),
    ],
  },
  uniforms: (s) => ({
    uChDepth: n(s.chrome.depth),
    uChSmooth: n(s.chrome.smooth),
    uChShine: n(s.chrome.shine),
    uChTint: hexToRgb(String(s.chrome.tint)),
  }),
  glsl: /* glsl */ `
uniform float uChDepth;
uniform float uChSmooth;
uniform float uChShine;
uniform vec3 uChTint;

// Brightness as height, softened so the metal reads as poured, not noisy.
float height(vec2 fc) {
  float s = (1.0 + uChSmooth * 8.0) * unit();
  return (luma(inputFc(fc)) * 2.0
    + luma(inputFc(fc + vec2(s, 0.0))) + luma(inputFc(fc - vec2(s, 0.0)))
    + luma(inputFc(fc + vec2(0.0, s))) + luma(inputFc(fc - vec2(0.0, s)))) / 6.0;
}

// A photo studio seen in the metal: bright softbox sky, a sharp horizon,
// a dark floor and a few strip lights sliding slowly past.
vec3 studio(vec3 r, float y) {
  vec3 sky = mix(vec3(0.70, 0.76, 0.84), vec3(1.0), smoothstep(0.0, 0.7, y));
  vec3 floor_ = mix(vec3(0.03), vec3(0.22), smoothstep(-0.8, 0.0, y));
  vec3 env = mix(floor_, sky, smoothstep(-0.015, 0.015, y));
  float strips = smoothstep(0.86, 1.0, sin(r.x * 7.0 + uTime * 0.15) * 0.5 + 0.5);
  return env + strips * 0.55 * uChShine * smoothstep(-0.1, 0.4, y);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float e = (1.0 + uChSmooth * 5.0) * unit();
  float dx = height(fc - vec2(e, 0.0)) - height(fc + vec2(e, 0.0));
  float dy = height(fc - vec2(0.0, e)) - height(fc + vec2(0.0, e));
  vec3 nrm = normalize(vec3(dx * uChDepth * 5.0, dy * uChDepth * 5.0, 1.0));
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), nrm);
  // Higher on the canvas looks further up the room, like a curved sheet.
  float y = r.y * 1.4 + fragP().y * 0.6;
  vec3 c = studio(r, y);
  c = pow(c, vec3(1.0 + uChShine * 1.2));
  emit(c * uChTint * 1.08);
}
`,
});
