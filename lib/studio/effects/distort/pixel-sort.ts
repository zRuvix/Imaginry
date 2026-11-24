import { type Control, defineEffect, magenta, n, p, slider } from "../define";

const controls: Control[] = [
  slider("angle", "Direction", -180, 180, 1),
  slider("length", "Length", 4, 240, 1),
  slider("low", "From", 0, 1, 0.01),
  slider("high", "To", 0, 1, 0.01),
];

/** Glitch-art streaks: runs of pixels in a brightness range, sorted dark to light. */
export default defineEffect({
  key: "pixelsort",
  label: "Pixel sort",
  category: "Distort",
  blurb: "Runs of pixels in a brightness range, sorted into streaks.",
  controls,
  defaults: { angle: 90, length: 90, low: 0.35, high: 0.85 },
  presets: {
    thumbBase: { gradient: magenta, noise: { type: "clouds", scale: 3, amount: 0.5, speed: 0.2, color: "#ffffff" } },
    list: [
      p("ps-rain", { name: "Rain", angle: -90, length: 120, low: 0.3, high: 0.9 }),
      p("ps-melt", { name: "Melt", angle: 90, length: 200, low: 0.15, high: 0.7 }),
      p("ps-drift", { name: "Sideways", angle: 0, length: 80, low: 0.45, high: 1 }),
    ],
  },
  uniforms: (s) => ({
    uPsAngle: n(s.pixelsort.angle),
    uPsLength: n(s.pixelsort.length),
    uPsLow: Math.min(n(s.pixelsort.low), n(s.pixelsort.high)),
    uPsHigh: Math.max(n(s.pixelsort.low), n(s.pixelsort.high)),
  }),
  glsl: /* glsl */ `
uniform float uPsAngle;
uniform float uPsLength;
uniform float uPsLow;
uniform float uPsHigh;

bool inRun(float l) { return l >= uPsLow && l <= uPsHigh; }

// A shader can't sort, so each pixel finds the run it sits in (walking both
// ways while brightness stays in range), notes the run's darkest and lightest
// colours and where it sits along the run, and paints that point of a
// dark-to-light ramp: the look of a sorted run.
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec3 c = inputFc(fc);
  float l = luma(c);
  if (!inRun(l)) { emit(c); return; }

  vec2 dir = vec2(cos(radians(uPsAngle)), sin(radians(uPsAngle)));
  const int N = 40;
  float stepLen = max(uPsLength * unit() / float(N), 1.0);
  vec3 lo = c, hi = c;
  float loL = l, hiL = l;
  float back = 0.0, ahead = 0.0;

  for (int i = 1; i <= N; i++) {
    vec3 s = inputFc(fc - dir * stepLen * float(i));
    float sl = luma(s);
    if (!inRun(sl)) break;
    back = float(i);
    if (sl < loL) { lo = s; loL = sl; }
    if (sl > hiL) { hi = s; hiL = sl; }
  }
  for (int i = 1; i <= N; i++) {
    vec3 s = inputFc(fc + dir * stepLen * float(i));
    float sl = luma(s);
    if (!inRun(sl)) break;
    ahead = float(i);
    if (sl < loL) { lo = s; loL = sl; }
    if (sl > hiL) { hi = s; hiL = sl; }
  }

  float t = back / max(back + ahead, 1.0);
  emit(mix(lo, hi, smoothstep(0.0, 1.0, t)));
}
`,
});
