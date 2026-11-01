import { type Control, defineEffect, magenta, n, opt, p, slider } from "../define";

const controls: Control[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: ["sine", "ripple", "swirl", "liquid"],
  },
  slider("amplitude", "Amplitude", 0, 0.5, 0.005),
  slider("frequency", "Frequency", 0.5, 40, 0.1),
  slider("speed", "Speed", 0, 4, 0.01),
  slider("angle", "Angle", -180, 180, 1),
];

/** Ripples, swirls and liquid motion. */
export default defineEffect({
  key: "waves",
  label: "Waves",
  category: "Distort",
  blurb: "Ripples, swirls and liquid motion.",
  controls,
  defaults: {
    type: "sine",
    amplitude: 0.05,
    frequency: 8,
    speed: 1,
    angle: 0,
  },
  presets: {
    thumbBase: { gradient: magenta },
    list: [
      p("w-sine", { type: "sine", amplitude: 0.05, frequency: 8, speed: 1, angle: 0 }),
      p("w-ripple", { type: "ripple", amplitude: 0.03, frequency: 24, speed: 1.5, angle: 0 }),
      p("w-swirl", { type: "swirl", amplitude: 0.3, frequency: 3, speed: 0.6, angle: 0 }),
      p("w-liquid", { type: "liquid", amplitude: 0.15, frequency: 4, speed: 0.5, angle: 0 }),
    ],
  },
  uniforms: (s) => ({
    uWaveType: opt(controls, "type", s.waves.type),
    uWaveAmp: n(s.waves.amplitude),
    uWaveFreq: n(s.waves.frequency),
    uWaveSpeed: n(s.waves.speed),
    uWaveAngle: n(s.waves.angle),
  }),
  glsl: /* glsl */ `
uniform float uWaveType;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uWaveSpeed;
uniform float uWaveAngle;

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
`,
});
