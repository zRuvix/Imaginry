/**
 * Shared pieces for the Lab's own backgrounds. These are effects like the
 * studio's (same renderer, embed and export), in a "Lab" category that the
 * studio's shelves never list.
 */
import { colorCount, type Control, flatColors, n, slider, type Sections } from "@/lib/studio/effects/define";

/**
 * A smooth palette lookup over up to five colors. Uniform names must be
 * unique across every effect, so each background passes its own prefix.
 */
export const paletteGlsl = (name: string) => /* glsl */ `
uniform vec3 ${name}[5];
uniform float ${name}N;
vec3 pal(float t) {
  float n = max(${name}N, 1.0);
  float x = clamp(t, 0.0, 1.0) * (n - 1.0);
  int i = int(floor(x));
  int j = int(min(float(i) + 1.0, n - 1.0));
  return mix(${name}[i], ${name}[j], smoothstep(0.0, 1.0, fract(x)));
}
`;

export const paletteUniforms = (name: string, colors: unknown) => ({
  [name]: flatColors(colors),
  [`${name}N`]: colorCount(colors),
});

// ---------------------------------------------------------------- the cursor
//
// Cursor-aware backgrounds read the pointer through ordinary sliders, which
// the Lab drives with routes (pointer x → Cursor X, and so on). Routes are what
// the embed bakes in, so the same reactions work on a website.

export const CURSOR_CONTROLS: Control[] = [
  slider("mx", "Cursor X", 0, 1, 0.001),
  slider("my", "Cursor Y", 0, 1, 0.001),
  slider("hover", "Hover", 0, 1, 0.01),
  slider("press", "Press", 0, 1, 0.01),
  slider("stir", "Stir", 0, 1, 0.01),
];

/** Routes leave the base at 0 and add the live signal on top. */
export const CURSOR_DEFAULTS = { mx: 0, my: 0, hover: 0, press: 0, stir: 0 };

/** Which signal drives each cursor slider, and how smoothly. */
export const CURSOR_ROUTES = [
  { control: "mx", signal: "pointer x", smoothing: 0.55 },
  { control: "my", signal: "pointer y", smoothing: 0.55 },
  { control: "hover", signal: "hover", smoothing: 0.8 },
  { control: "press", signal: "click", smoothing: 0 },
  { control: "stir", signal: "pointer speed", smoothing: 0.75 },
] as const;

export const cursorUniforms = (prefix: string, s: Sections[string]) => ({
  [`${prefix}Cursor`]: [n(s.mx), n(s.my)],
  [`${prefix}Hover`]: n(s.hover),
  [`${prefix}Press`]: n(s.press),
  [`${prefix}Stir`]: n(s.stir),
});

/** Declares the cursor uniforms and `cursorP()`, the cursor in fragP() space. */
export const cursorGlsl = (prefix: string) => /* glsl */ `
uniform vec2 ${prefix}Cursor;
uniform float ${prefix}Hover;
uniform float ${prefix}Press;
uniform float ${prefix}Stir;
vec2 cursorP() { return vec2((${prefix}Cursor.x - 0.5) * aspect(), 0.5 - ${prefix}Cursor.y); }
// A click sends a ring out from the cursor: it grows as the press fades.
float clickRing(float d, float width) {
  float r = (1.0 - ${prefix}Press) * 1.1;
  return ${prefix}Press * exp(-pow((d - r) / width, 2.0));
}
`;
