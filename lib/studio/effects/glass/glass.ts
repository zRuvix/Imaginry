import { type Control, defineEffect, GLASS_FLUTED, mono, n, opt, p, slider } from "../define";

const controls: Control[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: ["fluted", "grid", "frosted", "rings", "wavy", "lens"],
  },
  slider("segments", "Segments", 2, 80, 1),
  slider("distortion", "Refraction", -2, 2, 0.01),
  slider("zoom", "Magnify", -1, 2, 0.01),
  slider("stagger", "Stagger", 0, 1, 0.01),
  slider("dispersion", "Dispersion", 0, 1, 0.01),
  slider("angle", "Angle", -180, 180, 1),
  slider("shading", "Shading", 0, 1, 0.01),
  slider("frost", "Frost", 0, 1, 0.01),
];

/** Refracts everything below through lenses. */
export default defineEffect({
  key: "glass",
  label: "Glass",
  category: "Glass & optics",
  blurb: "Refracts everything below through lenses.",
  controls,
  defaults: GLASS_FLUTED,
  presets: {
    thumbBase: { gradient: mono },
    list: [
      p("gl-fluted", { ...GLASS_FLUTED }),
      p("gl-grid", {
        ...GLASS_FLUTED,
        type: "grid",
        segments: 12,
        distortion: 0.6,
        zoom: 1.35,
        stagger: 0.25,
      }),
      p("gl-frosted", {
        ...GLASS_FLUTED,
        type: "frosted",
        segments: 10,
        distortion: 1.2,
        zoom: 0,
        stagger: 0,
        dispersion: 0.5,
        shading: 0.35,
        frost: 0.35,
      }),
      p("gl-rings", { ...GLASS_FLUTED, type: "rings", segments: 9, distortion: 0.5, zoom: 1.4, stagger: 0.4 }),
      p("gl-wavy", { ...GLASS_FLUTED, type: "wavy", segments: 14, distortion: 0.6, zoom: 1.3, angle: 20 }),
      p("gl-lens", {
        ...GLASS_FLUTED,
        type: "lens",
        segments: 6,
        distortion: 0.7,
        zoom: 1.6,
        stagger: 0.2,
        dispersion: 0.4,
      }),
    ],
  },
  uniforms: (s) => ({
    uGlassType: opt(controls, "type", s.glass.type),
    uGlassSeg: n(s.glass.segments),
    uGlassDist: n(s.glass.distortion),
    uGlassAngle: n(s.glass.angle),
    uGlassShade: n(s.glass.shading),
    uGlassFrost: n(s.glass.frost),
    uGlassZoom: n(s.glass.zoom),
    uGlassStagger: n(s.glass.stagger),
    uGlassDisp: n(s.glass.dispersion),
  }),
  glsl: /* glsl */ `
uniform float uGlassType;
uniform float uGlassSeg;
uniform float uGlassDist;
uniform float uGlassAngle;
uniform float uGlassShade;
uniform float uGlassFrost;
uniform float uGlassZoom;
uniform float uGlassStagger;
uniform float uGlassDisp;

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
`,
});
