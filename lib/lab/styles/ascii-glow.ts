import { type Control, defineEffect, n, opt, slider } from "@/lib/studio/effects/define";
import { CURSOR_CONTROLS, CURSOR_DEFAULTS, cursorGlsl, cursorUniforms, paletteGlsl, paletteUniforms } from "./common";

const controls: Control[] = [
  { key: "colors", label: "Light", type: "colors", max: 5 },
  { key: "shape", label: "Shape", type: "select", options: ["horizon", "pinch", "rise", "eclipse"] },
  slider("cell", "Cell size", 8, 40, 0.5),
  slider("density", "Density", 0, 1, 0.01),
  slider("glyphs", "Glyphs", 0, 1.5, 0.01),
  slider("wash", "Gradient", 0, 1.2, 0.01),
  slider("glow", "Glow", 0, 1.5, 0.01),
  slider("flicker", "Flicker", 0, 1, 0.01),
  slider("softness", "Softness", 0.05, 1, 0.01),
  slider("scale", "Scale", 0.4, 2.5, 0.01),
  slider("flow", "Flow", 0, 2, 0.01),
  slider("speed", "Speed", 0, 3, 0.01),
  slider("radius", "Scramble radius", 0.02, 0.5, 0.01),
  ...CURSOR_CONTROLS,
];

/** A soft glow drawn in characters that scramble under the cursor and ripple on click. */
export default defineEffect({
  key: "asciiglow",
  label: "ASCII Glow",
  category: "Lab",
  blurb: "A soft glow drawn in characters. They scramble under the cursor and ripple out on click.",
  controls,
  defaults: {
    colors: ["#06103d", "#1f3cff", "#6fa8ff", "#eaf2ff"],
    shape: "horizon",
    cell: 18,
    density: 0.8,
    glyphs: 0.9,
    wash: 0.85,
    glow: 0.3,
    flicker: 0.25,
    softness: 0.5,
    scale: 1,
    flow: 0.5,
    speed: 1,
    radius: 0.14,
    ...CURSOR_DEFAULTS,
  },
  uniforms: (s) => ({
    ...paletteUniforms("uAgC", s.asciiglow.colors),
    uAgShape: opt(controls, "shape", s.asciiglow.shape),
    uAgCell: n(s.asciiglow.cell),
    uAgDensity: n(s.asciiglow.density),
    uAgGlyph: n(s.asciiglow.glyphs),
    uAgWash: n(s.asciiglow.wash),
    uAgGlow: n(s.asciiglow.glow),
    uAgFlicker: n(s.asciiglow.flicker),
    uAgSoft: n(s.asciiglow.softness),
    uAgScale: n(s.asciiglow.scale),
    uAgFlow: n(s.asciiglow.flow),
    uAgSpeed: n(s.asciiglow.speed),
    uAgRadius: n(s.asciiglow.radius),
    ...cursorUniforms("uAg", s.asciiglow),
  }),
  glsl: /* glsl */ `
${paletteGlsl("uAgC")}
${cursorGlsl("uAg")}
uniform float uAgShape;
uniform float uAgCell;
uniform float uAgDensity;
uniform float uAgGlyph;
uniform float uAgWash;
uniform float uAgGlow;
uniform float uAgFlicker;
uniform float uAgSoft;
uniform float uAgScale;
uniform float uAgFlow;
uniform float uAgSpeed;
uniform float uAgRadius;

// 5×5 bitmap glyphs, dimmest to brightest: .  :  ;  +  x  X  8  @
float character(int n, vec2 p) {
  p = floor(p * vec2(-4.0, 4.0) + 2.5);
  if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y) {
    int a = int(round(p.x) + 5.0 * round(p.y));
    if (((n >> a) & 1) == 1) return 1.0;
  }
  return 0.0;
}

int glyphFor(float b) {
  int i = clamp(int(b * 7.99), 0, 7);
  if (i == 0) return 4096;
  if (i == 1) return 65600;
  if (i == 2) return 332772;
  if (i == 3) return 15255086;
  if (i == 4) return 23385164;
  if (i == 5) return 15252014;
  if (i == 6) return 13199452;
  return 11512810;
}

// The light: bright at its source, falling off into the dark.
float field(vec2 p) {
  float t = uTime * uAgSpeed * 0.12;
  p += (vec2(fbm(p * 1.2 + t + uSeed), fbm(p * 1.2 - t + 4.0)) - 0.5) * uAgFlow * 0.35;
  p /= uAgScale;
  float s = max(uAgSoft, 0.05);
  int shape = int(uAgShape + 0.5);
  float b;
  if (shape == 0) {
    // Horizon: light hugging the rim of a dark planet below.
    float d = length(p - vec2(0.0, -1.55)) - 1.25;
    b = d > 0.0 ? exp(-d / (0.32 * s)) : exp(d * 28.0) * 0.5;
    b *= smoothstep(1.6, 0.1, abs(p.x));
  } else if (shape == 1) {
    // Pinch: a band of light squeezed thin in the middle.
    float w = 0.03 + 0.3 * s * (0.2 + p.x * p.x * 1.8);
    b = exp(-abs(p.y) / w) * smoothstep(1.4, 0.0, abs(p.x) * 0.8);
  } else if (shape == 2) {
    // Rise: glowing up from the bottom edge.
    b = min(1.0, exp(-(p.y + 0.5) / (0.42 * s + 0.04)) * exp(-p.x * p.x * 1.4));
  } else {
    // Eclipse: a ring of light around a dark disc.
    float d = length(p) - 0.28;
    b = d > 0.0 ? exp(-d / (0.22 * s + 0.02)) : exp(d * 40.0) * 0.6;
  }
  return clamp(b, 0.0, 1.0);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float cs = max(uAgCell * min(uRes.x, uRes.y) / 900.0 * uDetail, 3.0);
  vec2 cell = floor(fc / cs);
  vec2 p = toP((cell + 0.5) * cs);
  float b = field(p);
  float smoothB = field(fragP());
  float h = hash(cell + uSeed);

  // Characters swap with their neighbours in brightness now and then.
  float tick = floor(uTime * (3.0 + h * 5.0));
  float level = clamp(b + (hash(cell + tick) - 0.5) * uAgFlicker * 0.45, 0.0, 1.0);

  // Under the cursor (while it moves) and along a click's ring, characters scramble.
  float dm = length(p - cursorP());
  float scramble = uAgHover * clamp(uAgStir * 2.0, 0.0, 1.0) * smoothstep(uAgRadius, uAgRadius * 0.2, dm);
  float chaos = clamp(scramble + clickRing(dm, 0.06), 0.0, 1.0);
  float fast = floor(uTime * 22.0);
  if (hash(cell * 1.3 + fast) < chaos) level = hash(cell * 2.1 + fast);

  // Brighter areas fill in first.
  float show = step(h, uAgDensity * smoothstep(0.02, 0.45, b) * 1.3 + chaos * 0.8);
  float on = character(glyphFor(level), fract(fc / cs) * 2.0 - 1.0) * show * step(0.015, level);

  vec3 col = pal(smoothB) * smoothB * uAgWash;
  col += pal(min(1.0, level * 1.1 + 0.15)) * (0.55 + level * 0.8) * on * uAgGlyph;
  col += pal(smoothB) * smoothB * smoothB * uAgGlow * 0.6;
  emit(col);
}
`,
});
