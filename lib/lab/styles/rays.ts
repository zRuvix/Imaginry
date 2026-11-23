import { type Control, defineEffect, hexToRgb, n, slider } from "@/lib/studio/effects/define";
import { CURSOR_CONTROLS, CURSOR_DEFAULTS, cursorGlsl, cursorUniforms } from "./common";

const controls: Control[] = [
  { key: "color", label: "Light", type: "color" },
  { key: "background", label: "Background", type: "color" },
  slider("origin", "Origin", -1, 1, 0.01),
  slider("spread", "Spread", 0.1, 1.5, 0.01),
  slider("length", "Length", 0.2, 3, 0.01),
  slider("count", "Rays", 1, 10, 0.1),
  slider("dust", "Dust", 0, 1, 0.01),
  slider("follow", "Follow cursor", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
  ...CURSOR_CONTROLS,
];

/** Shafts of light from above that lean toward the cursor. */
export default defineEffect({
  key: "rays",
  label: "Light Rays",
  category: "Lab",
  blurb: "Shafts of light from above. They lean toward the cursor.",
  controls,
  defaults: {
    color: "#fff2d6",
    background: "#07060a",
    origin: 0,
    spread: 0.7,
    length: 1.3,
    count: 4,
    dust: 0.4,
    follow: 0.6,
    speed: 0.6,
    ...CURSOR_DEFAULTS,
  },
  uniforms: (s) => ({
    uRyColor: hexToRgb(String(s.rays.color)),
    uRyBg: hexToRgb(String(s.rays.background)),
    uRyOrigin: n(s.rays.origin),
    uRySpread: n(s.rays.spread),
    uRyLength: n(s.rays.length),
    uRyCount: n(s.rays.count),
    uRyDust: n(s.rays.dust),
    uRyFollow: n(s.rays.follow),
    uRySpeed: n(s.rays.speed),
    ...cursorUniforms("uRy", s.rays),
  }),
  glsl: /* glsl */ `
${cursorGlsl("uRy")}
uniform vec3 uRyColor;
uniform vec3 uRyBg;
uniform float uRyOrigin;
uniform float uRySpread;
uniform float uRyLength;
uniform float uRyCount;
uniform float uRyDust;
uniform float uRyFollow;
uniform float uRySpeed;

void main() {
  vec2 p = fragP();
  vec2 o = vec2(uRyOrigin * 0.5 * aspect(), 0.62);
  // The source slides toward the cursor while it's over the canvas.
  o.x = mix(o.x, cursorP().x, uRyHover * uRyFollow);
  vec2 d = p - o;
  float ang = atan(d.x, -d.y);
  float dist = length(d);
  float t = uTime * uRySpeed * 0.3;
  float cone = smoothstep(uRySpread, uRySpread * 0.35, abs(ang));
  float streak = noise(vec2(ang * uRyCount * 4.0, t)) * 0.6 + noise(vec2(ang * uRyCount * 9.0 - 3.0, -t * 1.3)) * 0.4;
  streak = pow(streak, 1.6);
  float fall = exp(-dist / max(uRyLength, 0.05));
  float dust = noise(p * 28.0 + vec2(t * 0.4, -t * 0.9));
  float lit = cone * streak * fall * (1.0 + uRyDust * (dust - 0.5) * 1.4);
  vec3 col = uRyBg + uRyColor * lit * 1.5 + uRyColor * exp(-dist * 7.0) * 0.25;
  emit(col);
}
`,
});
