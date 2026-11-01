import { type Control, defineEffect, hexToRgb, n, opt, p, slider, violet } from "../define";

const controls: Control[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: ["rays", "beams", "caustics", "spot"],
  },
  slider("intensity", "Intensity", 0, 2, 0.01),
  { key: "color", label: "Color", type: "color" },
  slider("spread", "Spread", 0.1, 4, 0.01),
  slider("angle", "Angle", -180, 180, 1),
  slider("x", "Position X", -1, 1, 0.01),
  slider("y", "Position Y", -1, 1, 0.01),
];

/** Rays, beams and caustics. */
export default defineEffect({
  key: "light",
  label: "Light",
  category: "Light",
  blurb: "Rays, beams and caustics.",
  controls,
  defaults: {
    type: "rays",
    intensity: 0.8,
    color: "#ffffff",
    spread: 1,
    angle: -45,
    x: -0.5,
    y: 0.5,
  },
  presets: {
    thumbBase: { gradient: violet },
    list: [
      p("l-rays", { type: "rays", intensity: 0.9, color: "#ffffff", spread: 1, angle: -45, x: -0.5, y: 0.5 }),
      p("l-rays-top", { type: "rays", intensity: 0.9, color: "#fff2d6", spread: 2, angle: -90, x: 0, y: 0.6 }),
      p("l-beams", { type: "beams", intensity: 0.9, color: "#ffffff", spread: 1.2, angle: -60, x: 0, y: 0 }),
      p("l-spot", { type: "spot", intensity: 0.9, color: "#ffe9f6", spread: 1, angle: 0, x: 0.2, y: 0.2 }),
      p("l-caustics", { type: "caustics", intensity: 0.8, color: "#d9fbff", spread: 1, angle: 0, x: 0, y: 0 }),
      p("l-rays-soft", {
        type: "rays",
        intensity: 0.5,
        color: "#ffd1f0",
        spread: 0.5,
        angle: 0,
        x: 0.5,
        y: 0.5,
      }),
    ],
  },
  uniforms: (s) => ({
    uLightType: opt(controls, "type", s.light.type),
    uLightIntensity: n(s.light.intensity),
    uLightColor: hexToRgb(String(s.light.color)),
    uLightSpread: n(s.light.spread) || 1,
    uLightAngle: n(s.light.angle),
    uLightPos: [n(s.light.x), n(s.light.y)],
  }),
  glsl: /* glsl */ `
uniform float uLightType;
uniform float uLightIntensity;
uniform vec3 uLightColor;
uniform float uLightSpread;
uniform float uLightAngle;
uniform vec2 uLightPos;

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
`,
});
