import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("amount", "Amount", 0, 1, 0.01),
  slider("blocks", "Blocks", 4, 40, 1),
  slider("split", "Color split", 0, 2, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
];

/** Torn blocks, shifted rows and broken color: digital decay. */
export default defineEffect({
  key: "glitch",
  label: "Glitch",
  category: "Distort",
  blurb: "Torn blocks, shifted rows and broken color.",
  controls,
  defaults: { amount: 0.5, blocks: 16, split: 1, speed: 1 },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("gl-light", { name: "Light", amount: 0.3, blocks: 20, split: 0.6, speed: 1 }),
      p("gl-heavy", { name: "Heavy", amount: 0.8, blocks: 12, split: 1.6, speed: 1.5 }),
      p("gl-data", { name: "Datamosh", amount: 0.6, blocks: 34, split: 1, speed: 0.6 }),
    ],
  },
  uniforms: (s) => ({
    uGliAmount: n(s.glitch.amount),
    uGliBlocks: n(s.glitch.blocks) || 16,
    uGliSplit: n(s.glitch.split),
    uGliSpeed: n(s.glitch.speed),
  }),
  glsl: /* glsl */ `
uniform float uGliAmount;
uniform float uGliBlocks;
uniform float uGliSplit;
uniform float uGliSpeed;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = floor(uTime * uGliSpeed * 8.0) + 1.0 + uSeed;
  vec2 blk = floor(uv * vec2(uGliBlocks * 0.5, uGliBlocks));
  float on = step(1.0 - uGliAmount * 0.5, hash(blk + t));
  float shift = (hash(blk.yx + t * 1.3) - 0.5) * 0.25 * on * uGliAmount;
  float line = step(0.985 - uGliAmount * 0.05, hash(vec2(floor(uv.y * 180.0), t)));
  shift += (hash(vec2(uv.y, t)) - 0.5) * 0.05 * line;
  vec2 s = uv + vec2(shift, 0.0);
  float sp = uGliSplit * 0.01 * (on + line * 0.5 + 0.2);
  vec3 c = vec3(texture(uInput, s + vec2(sp, 0.0)).r, texture(uInput, s).g, texture(uInput, s - vec2(sp, 0.0)).b);
  if (on > 0.5 && hash(blk + t + 5.0) > 0.75) c = 1.0 - c * 0.9;
  emit(c);
}
`,
});
