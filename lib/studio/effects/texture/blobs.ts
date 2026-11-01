import { colorCount, type Control, defineEffect, flatColors, n, p, slider, violet } from "../define";

const controls: Control[] = [
  slider("count", "Count", 1, 8, 1),
  slider("size", "Size", 0.05, 0.8, 0.01),
  slider("softness", "Softness", 0, 1, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
  slider("mix", "Mix", 0, 1, 0.01),
];

/** Soft shapes drifting in your colors. */
export default defineEffect({
  key: "blobs",
  label: "Blobs",
  category: "Texture",
  blurb: "Soft shapes drifting in your colors.",
  controls,
  defaults: { count: 4, size: 0.22, softness: 0.4, speed: 0.6, mix: 1 },
  presets: {
    thumbBase: { gradient: { ...violet, colors: ["#120d2b", "#ff4fa0", "#ffd166", "#4cc9f0"] } },
    list: [
      p("b-lava", { count: 4, size: 0.22, softness: 0.4, speed: 0.6, mix: 1 }),
      p("b-duo", { count: 2, size: 0.4, softness: 0.6, speed: 0.4, mix: 1 }),
      p("b-swarm", { count: 8, size: 0.12, softness: 0.2, speed: 1, mix: 1 }),
      p("b-haze", { count: 5, size: 0.35, softness: 1, speed: 0.3, mix: 0.7 }),
    ],
  },
  uniforms: (s) => ({
    uColors: flatColors(s.gradient.colors),
    uColorCount: colorCount(s.gradient.colors),
    uBlobCount: n(s.blobs.count),
    uBlobSize: n(s.blobs.size),
    uBlobSoft: n(s.blobs.softness),
    uBlobSpeed: n(s.blobs.speed),
    uBlobMix: n(s.blobs.mix),
  }),
  glsl: /* glsl */ `
uniform vec3 uColors[5];
uniform float uColorCount;
uniform float uBlobCount;
uniform float uBlobSize;
uniform float uBlobSoft;
uniform float uBlobSpeed;
uniform float uBlobMix;

vec3 blobs(vec2 p, vec3 col) {
  float tm = uTime * uBlobSpeed;
  float field = 0.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uBlobCount) break;
    float fi = float(i) + 1.0 + uSeed;
    vec2 c = vec2(
      sin(tm * 0.7 + fi * 3.1) * 0.45 * aspect() * cos(tm * 0.21 + fi),
      cos(tm * 0.6 + fi * 2.3) * 0.4
    );
    float d = length(p - c);
    float f = uBlobSize * uBlobSize / max(d * d, 1e-4);
    field += f;
    int ci = int(mod(float(i) + 1.0, max(uColorCount, 1.0)));
    acc += uColors[ci] * f;
  }
  vec3 bc = acc / max(field, 1e-4);
  float soft = max(uBlobSoft, 0.01);
  float m = smoothstep(1.0 - soft, 1.0 + soft * 0.5, field);
  return mix(col, bc, m * uBlobMix);
}

void main() { vec2 p = fragP(); emit(blobs(p, inputAt(p))); }
`,
});
