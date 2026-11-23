export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/** Shared header for every layer shader: inputs, helpers, blending. */
export const COMMON_HEAD = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform float uSeed;
uniform float uDetail;
// Size of one studio-preview pixel in this canvas's pixels: 1 on screen, larger
// in a bigger export, so pixel-sized details keep the size they had in the studio.
uniform float uPixel;

uniform sampler2D uInput;

uniform float uLayerOpacity;
uniform float uLayerBlend;
// Layer motion (lib/studio/motion.ts): the layer's pattern is offset (in units
// of the shorter side) and rotated about the centre; the layer below is read
// through the inverse, so the picture under the effect stays put.
uniform vec2 uMoveOff;
uniform float uMoveRot;
// Random wander: amplitude (shorter-side units), patches per shorter side, clock.
uniform vec3 uWander;
// Random motion for cell-based effects: amplitude (in cells), clock.
uniform vec2 uCellWander;

#define TAU 6.28318530718

float aspect() { return uRes.x / uRes.y; }

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 screen(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }

// Effect shaders read gl_FragCoord through motionFC() and uInput through
// inputTex() (shader.ts rewrites them), so every effect can move.
// Each patch of the pattern wanders around its home in its own direction:
// two value-noise fields sliding different ways give every patch a bounded,
// ever-changing offset.
vec2 wanderAt(vec2 fc) {
  if (uWander.x <= 0.0) return vec2(0.0);
  float m = min(uRes.x, uRes.y);
  vec2 q = fc / m * uWander.y + uSeed * 0.37;
  float t = uWander.z;
  vec2 a = vec2(noise(q + vec2(t, 0.3 * t)), noise(q + vec2(41.3, 17.9) - vec2(0.4 * t, t)));
  vec2 b = vec2(noise(q * 1.7 + vec2(9.1, 3.7) - vec2(0.8 * t, 0.5 * t)), noise(q * 1.7 + vec2(-0.6 * t, 0.9 * t)));
  return ((a + b) - 1.0) * 1.6 * uWander.x * m;
}
// A cell's own wandering offset, in cells: every character, dot or lens
// heads its own way and keeps changing course. Zero unless Random is on.
vec2 cellWander(vec2 id) {
  if (uCellWander.x <= 0.0) return vec2(0.0);
  float t = uCellWander.y;
  vec2 h = vec2(hash(id + uSeed * 1.3), hash(id.yx + 7.7 + uSeed));
  vec2 w = vec2(noise(vec2(t + h.x * 97.0, h.y * 53.0)), noise(vec2(h.y * 41.0, t * 0.9 + h.x * 71.0)));
  return (w - 0.5) * 2.0 * uCellWander.x;
}
// Cell effects look this many cells around for neighbours that wandered in.
int cellReach() { return uCellWander.x > 0.0 ? 1 : 0; }

vec2 moveFc(vec2 fc) {
  vec2 c = uRes * 0.5;
  return rot(uMoveRot) * (fc - c) + c - uMoveOff * min(uRes.x, uRes.y) - wanderAt(fc);
}
// Exact for drift, sway, spin and orbit; for random wander a first-order
// inverse, close enough that the picture below barely shifts.
vec2 unmoveFc(vec2 fc) {
  vec2 c = uRes * 0.5;
  return rot(-uMoveRot) * (fc - c + uMoveOff * min(uRes.x, uRes.y) + wanderAt(fc)) + c;
}
vec4 motionFC() { return vec4(moveFc(gl_FragCoord.xy), gl_FragCoord.zw); }
vec4 inputTex(vec2 uv) { return texture(uInput, unmoveFc(uv * uRes) / uRes); }

vec2 toP(vec2 fc) { return (fc / uRes - 0.5) * vec2(aspect(), 1.0); }
vec2 fragP() { return toP(motionFC().xy); }
// The layer below, addressed in centered aspect space or in pixels.
vec3 inputAt(vec2 p) { return inputTex(p / vec2(aspect(), 1.0) + 0.5).rgb; }
vec3 inputFc(vec2 fc) { return inputTex(fc / uRes).rgb; }
float unit() { return min(uRes.x, uRes.y) / 600.0 * uDetail; }
float px() { return uPixel > 0.0 ? uPixel : 1.0; }
// Photoshop-style blend of top over base, then faded by opacity.
// Modes: normal, multiply, screen, overlay, soft light, difference, add.
vec3 blendWith(vec3 base, vec3 top, float mode, float opacity) {
  int m = int(mode + 0.5);
  vec3 r = top;
  if (m == 1) r = base * top;
  else if (m == 2) r = screen(base, top);
  else if (m == 3) r = mix(2.0 * base * top, 1.0 - 2.0 * (1.0 - base) * (1.0 - top), step(0.5, base));
  else if (m == 4) r = mix(
    base - (1.0 - 2.0 * top) * base * (1.0 - base),
    base + (2.0 * top - 1.0) * (sqrt(base) - base),
    step(0.5, top)
  );
  else if (m == 5) r = abs(base - top);
  else if (m == 6) r = base + top;
  return mix(base, clamp(r, 0.0, 1.0), opacity);
}

// Every layer ends here: its result is blended over the layer below using
// the layer's own blend mode and opacity.
void emit(vec3 c) {
  vec3 below = texture(uInput, gl_FragCoord.xy / uRes).rgb;
  outColor = vec4(blendWith(below, clamp(c, 0.0, 1.0), uLayerBlend, uLayerOpacity), 1.0);
}
`;
