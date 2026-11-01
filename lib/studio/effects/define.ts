/**
 * Shared building blocks for effect definitions. Each effect lives in its own
 * file under a category folder and describes everything about itself: its
 * controls, defaults, presets, uniforms and fragment shader.
 */

export type Value = number | string | boolean | string[] | null;

export type Control =
  | { key: string; label: string; type: "slider"; min: number; max: number; step: number }
  | { key: string; label: string; type: "select"; options: string[] }
  | { key: string; label: string; type: "color" }
  | { key: string; label: string; type: "colors"; max: number }
  | { key: string; label: string; type: "toggle" };

export const CATEGORIES = ["Color", "Light", "Glass & optics", "Distort", "Texture", "Stylize"] as const;
export type Category = (typeof CATEGORIES)[number];

export const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "soft light", "difference", "add"];

export type Uniform = number | number[];
/** Every section's values, keyed by effect. */
export type Sections = Record<string, Record<string, Value>>;
export type UniformContext = { hasImage: boolean };

export type PresetDef = { id: string; name: string; values: Record<string, Value> };

export type EffectDefinition<K extends string = string> = {
  key: K;
  label: string;
  category: Category;
  /** One line shown in the inspector header. */
  blurb: string;
  info?: string;
  controls: Control[];
  defaults: Record<string, Value>;
  presets?: {
    /** Library heading; defaults to the effect label. */
    label?: string;
    /** Sections enabled underneath when rendering preset thumbnails. */
    thumbBase?: Record<string, Record<string, Value>>;
    list: PresetDef[];
  };
  /** Uniform values for this effect's shader, from the current design. */
  uniforms: (s: Sections, ctx: UniformContext) => Record<string, Uniform>;
  /** Uniform declarations and `main()`; the shared header is prepended. */
  glsl: string;
};

export function defineEffect<K extends string>(effect: EffectDefinition<K>) {
  return effect;
}

export const slider = (key: string, label: string, min: number, max: number, step: number): Control => ({
  key,
  label,
  type: "slider",
  min,
  max,
  step,
});

/** "l-rays-top" -> "Rays top" when a preset has no explicit name. */
const nameFromId = (id: string) => {
  const words = id.split("-").slice(1).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** A preset: an id plus the values it applies (an optional `name` is pulled out). */
export const p = (id: string, values: Record<string, Value>): PresetDef => {
  const { name, ...rest } = values;
  return { id, name: typeof name === "string" ? name : nameFromId(id), values: rest };
};

export const n = (v: unknown) => Number(v) || 0;

/** Index of a select option, so the shader can branch on it. */
export function opt(controls: Control[], key: string, value: unknown): number {
  const control = controls.find((c) => c.key === key);
  if (!control || control.type !== "select") return 0;
  return Math.max(0, control.options.indexOf(String(value)));
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex).replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0");
  const v = parseInt(full.slice(0, 6), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/** Up to five hex colors packed into the vec3[5] the shaders expect. */
export function flatColors(colors: unknown) {
  const list = Array.isArray(colors) ? (colors as string[]).slice(0, 5) : [];
  const flat = new Array(15).fill(0);
  list.forEach((c, i) => flat.splice(i * 3, 3, ...hexToRgb(c)));
  return flat;
}

export const colorCount = (colors: unknown) => (Array.isArray(colors) ? Math.min(5, colors.length) : 0);

// ---- thumbnail backdrops shared by several effects' presets

export const mono = {
  type: "linear",
  colors: ["#ffffff", "#7a7a7a", "#000000"],
  angle: -20,
  scale: 1,
  warp: 0.3,
  speed: 0.5,
};
export const violet = {
  type: "mesh",
  colors: ["#2a1b6e", "#8a4fff", "#3bc8c0", "#d65db1"],
  angle: 0,
  scale: 1,
  warp: 0.6,
  speed: 0.4,
};
export const magenta = {
  type: "mesh",
  colors: ["#ff2d95", "#3a0ca3", "#ff8c42", "#4cc9f0"],
  angle: 0,
  scale: 1,
  warp: 0.5,
  speed: 0.4,
};

/** Default glass, also the "fluted" preset: inverted, magnified flutes with offset strips. */
export const GLASS_FLUTED = {
  type: "fluted",
  segments: 18,
  distortion: 0.5,
  zoom: 1.45,
  stagger: 0.3,
  dispersion: 0.3,
  angle: 0,
  shading: 0.55,
  frost: 0,
};
