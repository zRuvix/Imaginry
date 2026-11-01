import { type Control, defineEffect, mono, n, p, slider } from "../define";

const controls: Control[] = [
  slider("dust", "Dust", 0, 1, 0.01),
  slider("scratches", "Scratches", 0, 1, 0.01),
  slider("flicker", "Flicker", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Dust specks, scratches and flicker from an old projector. */
export default defineEffect({
  key: "filmdust",
  label: "Film Dust",
  category: "Texture",
  blurb: "Dust, scratches and flicker from an old projector.",
  controls,
  defaults: { dust: 0.5, scratches: 0.5, flicker: 0.4, speed: 1 },
  presets: {
    thumbBase: { gradient: { ...mono, colors: ["#d9cdb6", "#6b5d48", "#1a140e"] } },
    list: [
      p("fd-reel", { name: "Old reel", dust: 0.6, scratches: 0.6, flicker: 0.5, speed: 1 }),
      p("fd-light", { name: "Light wear", dust: 0.3, scratches: 0.2, flicker: 0.15, speed: 1 }),
      p("fd-worn", { name: "Worn out", dust: 1, scratches: 1, flicker: 0.8, speed: 1.4 }),
    ],
  },
  uniforms: (s) => ({
    uFdDust: n(s.filmdust.dust),
    uFdScratch: n(s.filmdust.scratches),
    uFdFlicker: n(s.filmdust.flicker),
    uFdSpeed: n(s.filmdust.speed),
  }),
  glsl: /* glsl */ `
uniform float uFdDust;
uniform float uFdScratch;
uniform float uFdFlicker;
uniform float uFdSpeed;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = floor(uTime * uFdSpeed * 12.0) + uSeed;
  vec3 c = inputFc(gl_FragCoord.xy);

  vec2 g = uv * vec2(aspect(), 1.0) * 40.0;
  vec2 id = floor(g);
  float dust = 0.0;
  if (hash(id + t * 1.7) > 1.0 - uFdDust * 0.08) {
    vec2 o = vec2(hash(id + t + 3.0), hash(id + t + 5.0));
    dust = smoothstep(0.12, 0.0, length(fract(g) - o)) * (0.5 + hash(id));
  }

  float scratch = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = hash(vec2(t + fi * 7.0, 3.0));
    float on = step(1.0 - uFdScratch * 0.6, hash(vec2(t, fi)));
    scratch += on * smoothstep(0.0015, 0.0, abs(uv.x - x)) * (0.6 + 0.4 * noise(vec2(uv.y * 30.0, t)));
  }

  c = mix(c, vec3(0.05), dust * 0.8);
  c += scratch * 0.35;
  c *= 1.0 - uFdFlicker * 0.12 * hash(vec2(t, 9.0));
  emit(c);
}
`,
});
