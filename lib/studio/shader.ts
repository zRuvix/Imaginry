import type { SectionKey } from "./schema";

export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/**
 * Every effect is its own small fragment shader. The renderer draws the
 * visible layers bottom to top, each one reading the layer below from
 * `uInput`, so the stack order in the Layers panel is the real order.
 * Small shaders also compile quickly on ANGLE/D3D.
 */
const HEAD = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform float uSeed;
uniform float uDetail;

uniform float uImgOn;
uniform sampler2D uImg;
uniform sampler2D uInput;
uniform vec2 uImgSize;
uniform float uImgScale;
uniform vec2 uImgPos;
uniform float uImgBlur;
uniform float uImgBright;
uniform float uImgContrast;
uniform float uImgSat;
uniform float uImgExposure;
uniform float uImgFilter;

uniform float uGradOn;
uniform float uGradType;
uniform vec3 uColors[5];
uniform float uColorCount;
uniform float uGradAngle;
uniform float uGradScale;
uniform float uGradWarp;
uniform float uGradSpeed;

uniform float uPatOn;
uniform float uPatType;
uniform float uPatScale;
uniform float uPatSize;
uniform float uPatAngle;
uniform float uPatSoft;
uniform vec3 uPatBg;

uniform float uOptOn;
uniform float uOptAberr;
uniform float uOptLens;
uniform float uOptVig;
uniform float uOptGlow;

uniform float uLightOn;
uniform float uLightType;
uniform float uLightIntensity;
uniform vec3 uLightColor;
uniform float uLightSpread;
uniform float uLightAngle;
uniform vec2 uLightPos;

uniform float uWaveOn;
uniform float uWaveType;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uWaveSpeed;
uniform float uWaveAngle;

uniform float uBlobOn;
uniform float uBlobCount;
uniform float uBlobSize;
uniform float uBlobSoft;
uniform float uBlobSpeed;
uniform float uBlobMix;

uniform float uGlassOn;
uniform float uGlassType;
uniform float uGlassSeg;
uniform float uGlassDist;
uniform float uGlassAngle;
uniform float uGlassShade;
uniform float uGlassFrost;
uniform float uGlassZoom;
uniform float uGlassStagger;
uniform float uGlassDisp;

uniform float uPixOn;
uniform float uPixSize;

uniform float uDithOn;
uniform float uDithLevels;
uniform float uDithScale;
uniform float uDithMono;

uniform float uHalfOn;
uniform float uHalfSize;
uniform float uHalfAngle;
uniform float uHalfMono;
uniform vec3 uHalfInk;
uniform vec3 uHalfPaper;

uniform float uPlaidOn;
uniform float uPlaidScale;
uniform float uPlaidOpacity;
uniform float uPlaidAngle;
uniform vec3 uPlaidColor;

uniform float uAsciiOn;
uniform float uAsciiSize;
uniform float uAsciiColored;

uniform float uGrainOn;
uniform float uGrainAmount;
uniform float uGrainSize;

uniform float uLayerOpacity;
uniform float uLayerBlend;

uniform float uAdjBright;
uniform float uAdjContrast;
uniform float uAdjSat;
uniform float uAdjHue;
uniform float uAdjExposure;
uniform float uAdjTemp;

uniform vec3 uMapColors[5];
uniform float uMapCount;
uniform float uMapReverse;

uniform float uPostLevels;
uniform float uPostGamma;

uniform float uBloomThreshold;
uniform float uBloomIntensity;
uniform float uBloomRadius;

uniform float uRgbAmount;
uniform float uRgbAngle;
uniform float uRgbJitter;

uniform float uKalSegments;
uniform float uKalRotate;
uniform float uKalZoom;
uniform float uKalSpeed;

uniform float uMirrorMode;
uniform float uMirrorOffset;

uniform float uMosScale;
uniform float uMosEdge;
uniform float uMosJitter;
uniform vec3 uMosEdgeColor;

uniform float uCrtLines;
uniform float uCrtCurve;
uniform float uCrtMask;
uniform float uCrtFlicker;

uniform float uEdgeStrength;
uniform float uEdgeThick;
uniform float uEdgeMode;
uniform vec3 uEdgeColor;

uniform float uEngSize;
uniform float uEngAngle;
uniform float uEngWave;
uniform vec3 uEngInk;
uniform vec3 uEngPaper;

uniform float uSparkDensity;
uniform float uSparkSize;
uniform float uSparkSpeed;
uniform vec3 uSparkColor;

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


vec2 toP(vec2 fc) { return (fc / uRes - 0.5) * vec2(aspect(), 1.0); }
vec2 fragP() { return toP(gl_FragCoord.xy); }
// The layer below, addressed in centered aspect space or in pixels.
vec3 inputAt(vec2 p) { return texture(uInput, p / vec2(aspect(), 1.0) + 0.5).rgb; }
vec3 inputFc(vec2 fc) { return texture(uInput, fc / uRes).rgb; }
float unit() { return min(uRes.x, uRes.y) / 600.0 * uDetail; }
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

const fx = (body: string) => `${HEAD}\n${body}\n`;

export const LAYER_SHADERS: Record<SectionKey, string> = {
  gradient: fx(/* glsl */ `
vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0);
  float n = max(uColorCount - 1.0, 1.0);
  float f = t * n;
  int i = int(min(floor(f), n - 1.0));
  float k = smoothstep(0.0, 1.0, f - float(i));
  return mix(uColors[i], uColors[min(i + 1, int(n))], k);
}

vec3 gradient(vec2 p) {
  float tm = uTime * uGradSpeed;
  vec2 q = p / uGradScale;
  if (uGradWarp > 0.0) {
    vec2 w = vec2(fbm(q * 1.4 + uSeed + tm * 0.15), fbm(q * 1.4 + 7.3 + uSeed - tm * 0.15));
    q += (w - 0.5) * uGradWarp;
  }
  float a = radians(uGradAngle);
  if (uGradType < 0.5) {
    return ramp(dot(q, vec2(cos(a), sin(a))) + 0.5);
  }
  if (uGradType < 1.5) {
    return ramp(length(q) * 1.6);
  }
  if (uGradType < 2.5) {
    float t = fract(atan(q.y, q.x) / TAU + a / TAU);
    return ramp(abs(t * 2.0 - 1.0));
  }
  // mesh: each color owns a drifting control point
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= uColorCount) break;
    float fi = float(i) + uSeed * 1.7;
    vec2 c = vec2(sin(fi * 2.4 + tm * 0.5), cos(fi * 1.9 + tm * 0.43)) * vec2(0.45 * aspect(), 0.42);
    float d = length(q - c);
    float w = exp(-d * d * 6.0);
    acc += uColors[i] * w;
    wsum += w;
  }
  return acc / max(wsum, 1e-4);
}

void main() {
  vec2 p = fragP();
  emit(gradient(p));
}
`),
  image: fx(/* glsl */ `
// Cover-fit UV for the photo, with scale and pan.
vec2 imageUv(vec2 p) {
  float a = aspect();
  float ia = uImgSize.x / uImgSize.y;
  vec2 q = (p - uImgPos * vec2(a, 1.0) * 0.5) / uImgScale;
  vec2 uv = a > ia ? vec2(q.x / a, q.y / a * ia) : vec2(q.x / ia, q.y);
  return uv + 0.5;
}

// Mip-based blur, softened with a few taps so it doesn't look blocky.
vec3 imageSample(vec2 uv) {
  if (uImgBlur <= 0.0) return texture(uImg, uv).rgb;
  float lod = uImgBlur * 7.0;
  vec2 d = uImgBlur * 0.015 * vec2(1.0, uImgSize.x / uImgSize.y);
  vec3 c = textureLod(uImg, uv, lod).rgb * 0.36;
  c += textureLod(uImg, uv + vec2(d.x, 0.0), lod).rgb * 0.16;
  c += textureLod(uImg, uv - vec2(d.x, 0.0), lod).rgb * 0.16;
  c += textureLod(uImg, uv + vec2(0.0, d.y), lod).rgb * 0.16;
  c += textureLod(uImg, uv - vec2(0.0, d.y), lod).rgb * 0.16;
  return c;
}

vec3 adjust(vec3 c) {
  c *= exp2(uImgExposure);
  c += uImgBright;
  c = (c - 0.5) * uImgContrast + 0.5;
  c = mix(vec3(luma(c)), c, uImgSat);
  int f = int(uImgFilter + 0.5);
  float l = luma(c);
  if (f == 1) c = vec3(l);
  else if (f == 2) c = vec3(l * 1.07 + 0.05, l * 0.95 + 0.02, l * 0.78);
  else if (f == 3) c *= vec3(0.88, 1.0, 1.18);
  else if (f == 4) c *= vec3(1.15, 1.0, 0.85);
  else if (f == 5) c = vec3(smoothstep(0.25, 0.75, l));
  else if (f == 6) c = 1.0 - c;
  return clamp(c, 0.0, 1.0);
}

void main() {
  vec2 p = fragP();
  vec3 below = inputAt(p);
  vec2 uv = imageUv(p);
  if (uImgOn < 0.5 || uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
    emit(below);
    return;
  }
  emit(adjust(imageSample(uv)));
}
`),
  blobs: fx(/* glsl */ `
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
`),
  light: fx(/* glsl */ `
vec3 light(vec2 p, vec3 col) {
  float tm = uTime;
  vec2 d = p - uLightPos * vec2(aspect() * 0.5, 0.5);
  float r = length(d);
  float l = 0.0;
  if (uLightType < 0.5) {
    vec2 dir = d / max(r, 1e-4);
    float rays = 0.75 * noise(dir * 3.0 * uLightSpread + vec2(tm * 0.15, uSeed))
               + 0.25 * noise(dir * 8.0 * uLightSpread - vec2(tm * 0.1, -uSeed));
    l = pow(rays, 3.0) * exp(-r * 1.1) * 2.4 + exp(-r * 5.0) * 0.5;
  } else if (uLightType < 1.5) {
    float a = radians(uLightAngle);
    vec2 dir = vec2(cos(a), sin(a));
    vec2 perp = vec2(-dir.y, dir.x);
    float s = dot(p, perp);
    float along = dot(p, dir);
    float b = noise(vec2(s * 6.0 / uLightSpread + uSeed, tm * 0.12));
    b = pow(b, 3.0) * 2.4;
    l = b * smoothstep(0.9, -0.6, along);
  } else if (uLightType < 2.5) {
    vec2 q = p * 5.0 / uLightSpread + 30.0;
    vec2 i = q;
    float c = 1.0;
    float inten = 0.005;
    float t = tm * 0.4 + 23.0;
    for (int n = 0; n < 4; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = q + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(q.x / (sin(i.x + tt) / inten), q.y / (cos(i.y + tt) / inten)));
    }
    c /= 4.0;
    c = 1.17 - pow(c, 1.4);
    l = clamp(pow(abs(c), 8.0), 0.0, 1.0) * 0.55;
  } else {
    l = exp(-r * r / (0.08 * uLightSpread)) * 1.4;
  }
  return screen(col, clamp(uLightColor * l * uLightIntensity, 0.0, 1.0));
}

void main() { vec2 p = fragP(); emit(light(p, inputAt(p))); }
`),
  plaid: fx(/* glsl */ `
vec3 plaid(vec2 p, vec3 col) {
  vec2 q = rot(radians(uPlaidAngle)) * p * uPlaidScale;
  float bx = smoothstep(0.55, 0.6, abs(sin(q.x * 3.14159))) * 0.6
           + smoothstep(0.96, 0.98, abs(sin(q.x * 3.14159 * 3.0 + 1.0))) * 0.5;
  float by = smoothstep(0.55, 0.6, abs(sin(q.y * 3.14159))) * 0.6
           + smoothstep(0.96, 0.98, abs(sin(q.y * 3.14159 * 3.0 + 1.0))) * 0.5;
  float unit = max(min(uRes.x, uRes.y) / 1000.0, 1.0);
  float twill = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / (4.0 * unit)));
  float m = clamp(mix(bx, by, twill) + (bx * by) * 0.4, 0.0, 1.0);
  vec3 woven = mix(col, uPlaidColor, m);
  woven *= 0.92 + 0.08 * twill;
  return mix(col, woven, uPlaidOpacity);
}

void main() { vec2 p = fragP(); emit(plaid(p, inputAt(p))); }
`),
  pattern: fx(/* glsl */ `
float patternMask(vec2 p) {
  vec2 q = rot(radians(uPatAngle)) * p * uPatScale;
  vec2 id = floor(q);
  vec2 c = fract(q) - 0.5;
  float s = uPatSize * 0.5;
  float e = max(uPatSoft, 0.005);
  int t = int(uPatType + 0.5);
  if (t == 0) return 1.0 - smoothstep(s - e, s + e, length(c));
  if (t == 1) {
    float w = s * 0.5;
    return 1.0 - smoothstep(w - e, w + e, min(abs(c.x), abs(c.y)));
  }
  if (t == 2) return 1.0 - smoothstep(s - e, s + e, abs(c.x));
  if (t == 3) {
    return mod(id.x + id.y, 2.0);
  }
  if (t == 4) return 1.0 - smoothstep(s - e, s + e, abs(c.x) + abs(c.y));
  // triangles
  float tri = max(abs(c.x) * 0.866 + c.y * 0.5, -c.y);
  return 1.0 - smoothstep(s * 0.5 - e, s * 0.5 + e, tri);
}

void main() { vec2 p = fragP(); emit(mix(uPatBg, inputAt(p), patternMask(p))); }
`),
  waves: fx(/* glsl */ `
vec2 waves(vec2 p) {
  float t = uTime * uWaveSpeed;
  int ty = int(uWaveType + 0.5);
  if (ty == 0) {
    float a = radians(uWaveAngle);
    vec2 dir = vec2(cos(a), sin(a));
    vec2 perp = vec2(-dir.y, dir.x);
    return p + perp * sin(dot(p, dir) * uWaveFreq + t) * uWaveAmp;
  }
  if (ty == 1) {
    float r = length(p);
    return p + p / max(r, 1e-4) * sin(r * uWaveFreq - t * 2.0) * uWaveAmp;
  }
  if (ty == 2) {
    float r = length(p);
    float a = uWaveAmp * 6.0 * exp(-r * uWaveFreq * 0.6) * sin(t * 0.7 + 1.0);
    return rot(a) * p;
  }
  vec2 w = vec2(
    fbm(p * uWaveFreq * 0.5 + vec2(t * 0.2, 0.0) + uSeed),
    fbm(p * uWaveFreq * 0.5 + vec2(5.2, -t * 0.2) + uSeed)
  );
  return p + (w - 0.5) * uWaveAmp * 2.0;
}

void main() { emit(inputAt(waves(fragP()))); }
`),
  glass: fx(/* glsl */ `
// Each cell is a lens. u runs -1..1 across a cell; slope() is the surface
// tilt of a cylinder (or sphere) there, steep at the edges like real glass.
float slope(float u) { return u / sqrt(max(1.0 - u * u, 0.08)); }

struct Lens {
  vec2 q;    // where the cell looks, before refraction
  vec2 n;    // surface tilt
  float u;   // signed position across the cell, for directional light
  float edge;
};

Lens lensAt(vec2 q) {
  float seg = uGlassSeg;
  float w = 1.0 / seg;
  float keep = 1.0 - uGlassZoom;
  int ty = int(uGlassType + 0.5);
  Lens L;
  if (ty == 0 || ty == 4) {
    // fluted, or wavy flutes
    float x = q.x * seg;
    if (ty == 4) x += sin(q.y * 6.0 + uSeed) * 0.5;
    float id = floor(x);
    float u = fract(x) * 2.0 - 1.0;
    float cx = q.x - fract(x) * w + 0.5 * w;
    float shift = (hash(vec2(id, uSeed + 1.0)) - 0.5) * uGlassStagger * 0.35;
    // Real flutes are never perfectly straight: the image bows into arcs
    // across each strip as refraction increases.
    float bow = (u * u - 0.4) * w * 0.45 * uGlassDist;
    L.q = vec2(cx + (q.x - cx) * keep, q.y + shift + bow);
    L.n = vec2(slope(u), 0.0);
    L.u = u;
    L.edge = abs(u);
  } else if (ty == 1) {
    // grid of pillow lenses
    vec2 g = q * seg;
    vec2 id = floor(g);
    vec2 u = fract(g) * 2.0 - 1.0;
    vec2 c = (id + 0.5) * w;
    vec2 shift = (vec2(hash(id + uSeed), hash(id.yx + 3.1 + uSeed)) - 0.5) * uGlassStagger * 0.15;
    L.q = c + (q - c) * keep + shift;
    L.n = vec2(slope(u.x), slope(u.y));
    L.u = (u.x - u.y) * 0.5;
    L.edge = max(abs(u.x), abs(u.y));
  } else if (ty == 2) {
    // hammered / frosted: tilt from a noise height field
    float k = seg * 0.5;
    float e = 0.004;
    float h = fbm(q * k + uSeed);
    vec2 grad = vec2(fbm((q + vec2(e, 0.0)) * k + uSeed) - h, fbm((q + vec2(0.0, e)) * k + uSeed) - h) / e;
    L.n = grad / k * 1.2;
    L.q = q * (1.0 - uGlassZoom * 0.25);
    L.u = clamp(L.n.x - L.n.y, -1.0, 1.0);
    L.edge = clamp(length(L.n) * 0.7, 0.0, 1.0);
  } else if (ty == 3) {
    // concentric ring lenses
    float r = length(q);
    vec2 dir = q / max(r, 1e-4);
    float x = r * seg;
    float id = floor(x);
    float u = fract(x) * 2.0 - 1.0;
    float rc = (id + 0.5) * w;
    float ang = atan(q.y, q.x) + (hash(vec2(id, uSeed)) - 0.5) * uGlassStagger * 1.5;
    L.q = vec2(cos(ang), sin(ang)) * (rc + (r - rc) * keep);
    L.n = dir * slope(u);
    L.u = u;
    L.edge = abs(u);
  } else {
    // honeycomb of dome lenses
    vec2 g = q * seg;
    vec2 off = vec2(0.5 * mod(floor(g.y), 2.0), 0.0);
    vec2 id = floor(g - off);
    vec2 l = (fract(g - off) - 0.5) * 2.0;
    vec2 c = (id + 0.5 + off) * w;
    float rr = min(length(l), 1.0);
    vec2 shift = (vec2(hash(id + uSeed), hash(id.yx + 7.0 + uSeed)) - 0.5) * uGlassStagger * 0.15;
    L.q = c + (q - c) * keep + shift;
    L.n = l / sqrt(max(1.0 - rr * rr, 0.08));
    L.u = (l.x - l.y) * 0.5;
    L.edge = rr;
  }
  return L;
}

void main() {
  float a = radians(uGlassAngle);
  mat2 back = rot(a);
  Lens L = lensAt(rot(-a) * fragP());
  float w = 1.0 / uGlassSeg;

  vec2 base = L.q + L.n * uGlassDist * w * 0.35;
  // Dispersion: red and blue bend by different amounts.
  vec2 disp = L.n * uGlassDisp * w * 0.1;

  // Frost: a small golden-angle disc of taps, rotated per pixel.
  int taps = uGlassFrost > 0.0 ? 6 : 1;
  float radius = uGlassFrost * 0.025;
  float spin = hash(gl_FragCoord.xy) * TAU;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    if (i >= taps) break;
    float fi = float(i);
    vec2 j = taps > 1 ? vec2(cos(fi * 2.39996 + spin), sin(fi * 2.39996 + spin)) * radius * sqrt((fi + 0.5) / 6.0) : vec2(0.0);
    vec2 s = base + j;
    acc += vec3(inputAt(back * (s + disp)).r, inputAt(back * s).g, inputAt(back * (s - disp)).b);
  }
  vec3 col = acc / float(taps);

  // Light from the upper left: bright leading edge, darker trailing edge,
  // a crisp specular line and a thin groove between cells.
  float sh = uGlassShade;
  col *= 1.0 - sh * (0.16 * L.u + 0.3 * pow(L.edge, 5.0));
  col += sh * (exp(-pow((L.u + 0.72) * 7.0, 2.0)) * 0.3 + exp(-pow((L.u - 0.92) * 16.0, 2.0)) * 0.06);
  col *= 1.0 - sh * 0.45 * smoothstep(0.95, 1.0, L.edge);
  emit(col);
}
`),
  optics: fx(/* glsl */ `
void main() {
  vec2 p = fragP();
  p *= 1.0 + uOptLens * dot(p, p) * 0.6;
  vec3 col;
  if (uOptAberr > 0.0) {
    vec2 dir = p * (0.5 + length(p)) * uOptAberr * 0.02;
    col = vec3(inputAt(p + dir).r, inputAt(p).g, inputAt(p - dir).b);
  } else {
    col = inputAt(p);
  }
  col += col * smoothstep(0.45, 1.0, luma(col)) * uOptGlow;
  vec2 v = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - uOptVig * smoothstep(0.2, 0.9, length(v) * 1.2);
  emit(col);
}
`),
  pixelate: fx(/* glsl */ `
void main() {
  float s = max(uPixSize * unit(), 1.0);
  emit(inputFc((floor(gl_FragCoord.xy / s) + 0.5) * s));
}
`),
  dither: fx(/* glsl */ `
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

void main() {
  vec3 col = inputFc(gl_FragCoord.xy);
  float s = max(uDithScale * unit(), 1.0);
  float th = bayer4(gl_FragCoord.xy / s) + 0.03125 - 0.5;
  float lv = max(uDithLevels - 1.0, 1.0);
  if (uDithMono > 0.5) col = vec3(floor(luma(col) * lv + th + 0.5) / lv);
  else col = floor(col * lv + th + 0.5) / lv;
  emit(col);
}
`),
  halftone: fx(/* glsl */ `
void main() {
  vec2 fc = gl_FragCoord.xy;
  float cs = max(uHalfSize * unit(), 2.0);
  mat2 r = rot(radians(uHalfAngle));
  vec2 rf = r * fc;
  vec2 cell = floor(rf / cs);
  vec2 local = fract(rf / cs) - 0.5;
  vec3 c = inputFc(transpose(r) * ((cell + 0.5) * cs));
  float l = luma(c);
  float aa = 1.5 / cs;
  if (uHalfMono > 0.5) {
    float rad = sqrt(1.0 - l) * 0.7;
    emit(mix(uHalfPaper, uHalfInk, 1.0 - smoothstep(rad - aa, rad + aa, length(local))));
  } else {
    float rad = sqrt(l) * 0.7;
    emit(mix(vec3(0.03), c * 1.1, 1.0 - smoothstep(rad - aa, rad + aa, length(local))));
  }
}
`),
  ascii: fx(/* glsl */ `
float character(int n, vec2 p) {
  p = floor(p * vec2(-4.0, 4.0) + 2.5);
  if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y) {
    int a = int(round(p.x) + 5.0 * round(p.y));
    if (((n >> a) & 1) == 1) return 1.0;
  }
  return 0.0;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float cs = max(uAsciiSize * unit(), 4.0);
  vec2 cell = floor(fc / cs);
  vec3 c = inputFc((cell + 0.5) * cs);
  float g = luma(c);
  int n = 0;
  if (g > 0.1) n = 4096;
  if (g > 0.2) n = 65600;
  if (g > 0.3) n = 332772;
  if (g > 0.4) n = 15255086;
  if (g > 0.5) n = 23385164;
  if (g > 0.6) n = 15252014;
  if (g > 0.7) n = 13199452;
  if (g > 0.8) n = 11512810;
  float on = character(n, fract(fc / cs) * 2.0 - 1.0);
  emit(uAsciiColored > 0.5 ? c * on * 1.15 : vec3(on * 0.92));
}
`),
  grain: fx(/* glsl */ `
void main() {
  float s = max(uGrainSize * max(unit(), 1.0), 1.0);
  float n = hash(floor(gl_FragCoord.xy / s) + fract(uTime * 7.13) * 91.7) - 0.5;
  emit(inputFc(gl_FragCoord.xy) + n * uGrainAmount);
}
`),
  adjust: fx(/* glsl */ `
vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

void main() {
  vec3 c = inputFc(gl_FragCoord.xy);
  c *= exp2(uAdjExposure);
  c += uAdjBright;
  c = (c - 0.5) * uAdjContrast + 0.5;
  c = mix(vec3(luma(c)), c, uAdjSat);
  c = hueShift(c, radians(uAdjHue));
  c += vec3(uAdjTemp, uAdjTemp * 0.25, -uAdjTemp) * 0.08;
  emit(c);
}
`),
  gradientmap: fx(/* glsl */ `
vec3 mapRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  float n = max(uMapCount - 1.0, 1.0);
  float f = t * n;
  int i = int(min(floor(f), n - 1.0));
  float k = smoothstep(0.0, 1.0, f - float(i));
  return mix(uMapColors[i], uMapColors[min(i + 1, int(n))], k);
}

void main() {
  float l = clamp(luma(inputFc(gl_FragCoord.xy)), 0.0, 1.0);
  emit(mapRamp(uMapReverse > 0.5 ? 1.0 - l : l));
}
`),
  posterize: fx(/* glsl */ `
void main() {
  vec3 c = pow(clamp(inputFc(gl_FragCoord.xy), 0.0, 1.0), vec3(uPostGamma));
  float lv = max(uPostLevels, 2.0);
  c = floor(c * lv) / (lv - 1.0);
  emit(pow(clamp(c, 0.0, 1.0), vec3(1.0 / uPostGamma)));
}
`),
  bloom: fx(/* glsl */ `
void main() {
  vec2 p = fragP();
  vec3 c = inputAt(p);
  float r = uBloomRadius * 0.12;
  float spin = hash(gl_FragCoord.xy) * TAU;
  vec3 acc = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    float d = sqrt((fi + 0.5) / 24.0) * r;
    vec2 o = vec2(cos(fi * 2.39996 + spin), sin(fi * 2.39996 + spin)) * d;
    vec3 s = inputAt(p + o);
    float w = 1.0 - 0.6 * d / max(r, 1e-4);
    acc += max(s - uBloomThreshold, 0.0) / max(1.0 - uBloomThreshold, 0.02) * w;
    total += w;
  }
  emit(c + acc / total * uBloomIntensity * 1.4);
}
`),
  rgbshift: fx(/* glsl */ `
void main() {
  vec2 p = fragP();
  float a = radians(uRgbAngle);
  vec2 d = vec2(cos(a), sin(a)) * uRgbAmount * 0.04;
  if (uRgbJitter > 0.0) {
    float band = hash(vec2(floor(uTime * 10.0), floor(p.y * 36.0)));
    d *= 1.0 + (band - 0.5) * uRgbJitter * 4.0;
    p.x += step(0.93, band) * (band - 0.95) * uRgbJitter * 0.6;
  }
  emit(vec3(inputAt(p + d).r, inputAt(p).g, inputAt(p - d).b));
}
`),
  kaleido: fx(/* glsl */ `
void main() {
  vec2 p = fragP() / uKalZoom;
  float r = length(p);
  float a = atan(p.y, p.x) + radians(uKalRotate) + uTime * uKalSpeed * 0.25;
  float seg = TAU / max(uKalSegments, 1.0);
  a = mod(a, seg);
  a = abs(a - seg * 0.5);
  emit(inputAt(vec2(cos(a), sin(a)) * r));
}
`),
  mirror: fx(/* glsl */ `
void main() {
  vec2 p = fragP();
  float o = uMirrorOffset * 0.5;
  int m = int(uMirrorMode + 0.5);
  if (m == 0 || m == 2) p.x = o + abs(p.x - o);
  if (m == 1 || m == 2) p.y = o + abs(p.y - o);
  if (m == 3 && p.y > p.x) p = p.yx;
  emit(inputAt(p));
}
`),
  mosaic: fx(/* glsl */ `
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
  vec2 p = fragP() * uMosScale;
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 best = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = 0.5 + (hash2(ip + g + uSeed) - 0.5) * uMosJitter;
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        best = ip + g + o;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  vec3 c = inputAt(best / uMosScale);
  float edge = sqrt(d2) - sqrt(d1);
  float e = (1.0 - smoothstep(uMosEdge * 0.5, uMosEdge * 0.5 + 0.04, edge)) * step(0.001, uMosEdge);
  emit(mix(c, uMosEdgeColor, e));
}
`),
  crt: fx(/* glsl */ `
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 cc = uv - 0.5;
  cc *= 1.0 + uCrtCurve * 0.35 * dot(cc, cc);
  uv = cc + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
    emit(vec3(0.0));
    return;
  }
  vec3 c = texture(uInput, uv).rgb;
  float lines = 0.5 + 0.5 * sin(uv.y * uRes.y / max(unit() * 2.5, 1.0) * 3.14159);
  c *= mix(1.0, 0.55 + 0.45 * lines, uCrtLines);
  float m = mod(gl_FragCoord.x, 3.0);
  vec3 mask = vec3(m < 1.0 ? 1.0 : 0.7, m >= 1.0 && m < 2.0 ? 1.0 : 0.7, m >= 2.0 ? 1.0 : 0.7);
  c *= mix(vec3(1.0), mask * 1.18, uCrtMask);
  c *= 1.0 - uCrtFlicker * 0.12 * hash(vec2(floor(uTime * 24.0), 1.0));
  c *= 1.0 - dot(cc, cc) * (0.4 + uCrtCurve);
  emit(c);
}
`),
  edges: fx(/* glsl */ `
void main() {
  vec2 fc = gl_FragCoord.xy;
  float t = max(uEdgeThick * unit(), 1.0);
  float tl = luma(inputFc(fc + vec2(-t, t)));
  float tc = luma(inputFc(fc + vec2(0.0, t)));
  float tr = luma(inputFc(fc + vec2(t, t)));
  float ml = luma(inputFc(fc + vec2(-t, 0.0)));
  float mr = luma(inputFc(fc + vec2(t, 0.0)));
  float bl = luma(inputFc(fc + vec2(-t, -t)));
  float bc = luma(inputFc(fc + vec2(0.0, -t)));
  float br = luma(inputFc(fc + vec2(t, -t)));
  float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
  float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
  float g = clamp(length(vec2(gx, gy)) * uEdgeStrength * 2.0, 0.0, 1.0);
  int m = int(uEdgeMode + 0.5);
  if (m == 0) emit(inputFc(fc) + uEdgeColor * g);
  else if (m == 1) emit(mix(vec3(0.95, 0.93, 0.88), uEdgeColor, g));
  else emit(uEdgeColor * g);
}
`),
  engrave: fx(/* glsl */ `
void main() {
  vec2 fc = gl_FragCoord.xy;
  float s = max(uEngSize * unit(), 2.0);
  vec2 q = rot(radians(uEngAngle)) * fc / s;
  q.y += sin(q.x * 0.35) * uEngWave;
  float l = luma(inputFc(fc));
  float w = (1.0 - l) * 0.5;
  float d = abs(fract(q.y) - 0.5);
  float aa = 1.2 / s;
  emit(mix(uEngPaper, uEngInk, 1.0 - smoothstep(w - aa, w + aa, d)));
}
`),
  sparkle: fx(/* glsl */ `
void main() {
  vec3 c = inputFc(gl_FragCoord.xy);
  vec2 p = fragP() * uSparkDensity * 10.0;
  vec2 ip = floor(p);
  vec2 fp = fract(p) - 0.5;
  float h = hash(ip + uSeed);
  if (h > 0.55) {
    vec2 d = fp - (vec2(hash(ip + 3.1), hash(ip + 7.7)) - 0.5) * 0.6;
    float twinkle = 0.5 + 0.5 * sin(uTime * uSparkSpeed * 3.0 + h * 40.0);
    float s = uSparkSize * 0.12 * (0.5 + h);
    float rays = max(0.0, 1.0 - abs(d.x) / (s * 0.12)) * max(0.0, 1.0 - abs(d.y) / (s * 2.2))
                + max(0.0, 1.0 - abs(d.y) / (s * 0.12)) * max(0.0, 1.0 - abs(d.x) / (s * 2.2));
    float core = exp(-dot(d, d) / (s * s * 0.04));
    c = screen(c, clamp(uSparkColor * (rays * 0.8 + core) * twinkle, 0.0, 1.0));
  }
  emit(c);
}
`),
};
