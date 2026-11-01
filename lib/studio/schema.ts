export const SECTION_KEYS = [
  "image",
  "pattern",
  "gradient",
  "optics",
  "light",
  "waves",
  "blobs",
  "glass",
  "pixelate",
  "dither",
  "halftone",
  "plaid",
  "ascii",
  "grain",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export type Value = number | string | boolean | string[] | null;

export type SectionState = {
  /** Visible (the eye in the Layers panel). */
  enabled: boolean;
  preset: string | null;
  locked: boolean;
  /** When false the layer holds still at `frozenTime` while others animate. */
  animated: boolean;
  frozenTime: number;
  [key: string]: Value;
};

export type StudioState = {
  seed: number;
  sections: Record<SectionKey, SectionState>;
  /** Layer stack, top first, as shown in the Layers panel. */
  order: SectionKey[];
};

export type Control =
  | {
      key: string;
      label: string;
      type: "slider";
      min: number;
      max: number;
      step: number;
    }
  | { key: string; label: string; type: "select"; options: string[] }
  | { key: string; label: string; type: "color" }
  | { key: string; label: string; type: "colors"; max: number }
  | { key: string; label: string; type: "toggle" };

export type SectionSchema = {
  key: SectionKey;
  label: string;
  info?: string;
  controls: Control[];
  defaults: Record<string, Value>;
};

const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "soft light", "difference", "add"];

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

const slider = (key: string, label: string, min: number, max: number, step: number): Control => ({
  key,
  label,
  type: "slider",
  min,
  max,
  step,
});

export const SCHEMA: SectionSchema[] = [
  {
    key: "image",
    label: "Image",
    info: "Use a photo as the base; layers above it (like a gradient) can blend over it. Paste from the clipboard or drop an image onto the stage.",
    controls: [
      { key: "blend", label: "Blend mode", type: "select", options: BLEND_MODES },
      slider("opacity", "Opacity", 0, 1, 0.01),
      slider("blur", "Blur", 0, 1, 0.01),
      slider("scale", "Scale", 0.5, 3, 0.01),
      slider("x", "Position X", -1, 1, 0.01),
      slider("y", "Position Y", -1, 1, 0.01),
      slider("brightness", "Brightness", -0.5, 0.5, 0.01),
      slider("contrast", "Contrast", 0, 2, 0.01),
      slider("saturation", "Saturation", 0, 2, 0.01),
      slider("exposure", "Exposure", -2, 2, 0.01),
      {
        key: "filter",
        label: "Filter",
        type: "select",
        options: ["none", "mono", "sepia", "cool", "warm", "noir", "invert"],
      },
    ],
    defaults: {
      blend: "normal",
      opacity: 1,
      blur: 0,
      scale: 1,
      x: 0,
      y: 0,
      brightness: 0,
      contrast: 1,
      saturation: 1,
      exposure: 0,
      filter: "none",
    },
  },
  {
    key: "pattern",
    label: "Pattern",
    info: "Masks the image into a repeating shape. Areas outside the shape take the background color.",
    controls: [
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["dots", "grid", "stripes", "checker", "diamonds", "triangles"],
      },
      slider("scale", "Scale", 2, 60, 1),
      slider("size", "Size", 0.05, 1, 0.01),
      slider("angle", "Angle", -180, 180, 1),
      slider("softness", "Softness", 0, 0.5, 0.01),
      { key: "background", label: "Background", type: "color" },
    ],
    defaults: {
      type: "dots",
      scale: 18,
      size: 0.75,
      angle: 0,
      softness: 0.04,
      background: "#0a0a0a",
    },
  },
  {
    key: "gradient",
    label: "Gradient",
    controls: [
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["linear", "radial", "conic", "mesh"],
      },
      { key: "colors", label: "Colors", type: "colors", max: 5 },
      slider("angle", "Angle", -180, 180, 1),
      slider("scale", "Scale", 0.2, 3, 0.01),
      slider("warp", "Warp", 0, 2, 0.01),
      slider("speed", "Speed", 0, 3, 0.01),
      { key: "blend", label: "Blend mode", type: "select", options: BLEND_MODES },
      slider("opacity", "Opacity", 0, 1, 0.01),
    ],
    defaults: {
      type: "linear",
      colors: ["#ffffff", "#7a7a7a", "#000000"],
      angle: -20,
      scale: 1,
      warp: 0.3,
      speed: 0.5,
      blend: "normal",
      opacity: 1,
    },
  },
  {
    key: "optics",
    label: "Optics",
    controls: [
      slider("aberration", "Aberration", 0, 2, 0.01),
      slider("distortion", "Distortion", -1, 1, 0.01),
      slider("vignette", "Vignette", 0, 1.5, 0.01),
      slider("glow", "Glow", 0, 1.5, 0.01),
    ],
    defaults: { aberration: 0.5, distortion: 0.15, vignette: 0.4, glow: 0.2 },
  },
  {
    key: "light",
    label: "Light",
    controls: [
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
    ],
    defaults: {
      type: "rays",
      intensity: 0.8,
      color: "#ffffff",
      spread: 1,
      angle: -45,
      x: -0.5,
      y: 0.5,
    },
  },
  {
    key: "waves",
    label: "Waves",
    controls: [
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
    ],
    defaults: {
      type: "sine",
      amplitude: 0.05,
      frequency: 8,
      speed: 1,
      angle: 0,
    },
  },
  {
    key: "blobs",
    label: "Blobs",
    controls: [
      slider("count", "Count", 1, 8, 1),
      slider("size", "Size", 0.05, 0.8, 0.01),
      slider("softness", "Softness", 0, 1, 0.01),
      slider("speed", "Speed", 0, 3, 0.01),
      slider("mix", "Mix", 0, 1, 0.01),
    ],
    defaults: { count: 4, size: 0.22, softness: 0.4, speed: 0.6, mix: 1 },
  },
  {
    key: "glass",
    label: "Glass",
    controls: [
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
    ],
    defaults: GLASS_FLUTED,
  },
  {
    key: "pixelate",
    label: "Pixelate",
    controls: [slider("size", "Size", 2, 120, 1)],
    defaults: { size: 16 },
  },
  {
    key: "dither",
    label: "Dither",
    controls: [
      slider("levels", "Levels", 2, 8, 1),
      slider("scale", "Scale", 1, 12, 0.5),
      { key: "mono", label: "Mono", type: "toggle" },
    ],
    defaults: { levels: 2, scale: 2, mono: true },
  },
  {
    key: "halftone",
    label: "Halftone",
    controls: [
      slider("size", "Size", 3, 60, 0.5),
      slider("angle", "Angle", -90, 90, 1),
      { key: "mono", label: "Mono", type: "toggle" },
      { key: "ink", label: "Ink", type: "color" },
      { key: "paper", label: "Paper", type: "color" },
    ],
    defaults: {
      size: 12,
      angle: 45,
      mono: true,
      ink: "#111111",
      paper: "#f2efe6",
    },
  },
  {
    key: "plaid",
    label: "Plaid",
    controls: [
      slider("scale", "Scale", 1, 20, 0.1),
      slider("opacity", "Opacity", 0, 1, 0.01),
      slider("angle", "Angle", -180, 180, 1),
      { key: "color", label: "Color", type: "color" },
    ],
    defaults: { scale: 5, opacity: 0.55, angle: 0, color: "#b3202a" },
  },
  {
    key: "ascii",
    label: "ASCII",
    controls: [slider("size", "Size", 4, 40, 0.5), { key: "colored", label: "Colored", type: "toggle" }],
    defaults: { size: 10, colored: true },
  },
  {
    key: "grain",
    label: "Grain",
    controls: [slider("amount", "Amount", 0, 0.6, 0.01), slider("size", "Size", 1, 6, 0.1)],
    defaults: { amount: 0.1, size: 1 },
  },
];

export const SCHEMA_BY_KEY = Object.fromEntries(SCHEMA.map((s) => [s.key, s])) as Record<SectionKey, SectionSchema>;

/** Every section disabled, with default values. */
export function emptyState(seed = 0): StudioState {
  const sections = {} as Record<SectionKey, SectionState>;
  for (const s of SCHEMA) {
    sections[s.key] = {
      enabled: false,
      preset: null,
      locked: false,
      animated: true,
      frozenTime: 0,
      ...structuredClone(s.defaults),
    };
  }
  return { seed, sections, order: [] };
}

/**
 * Where a newly added layer goes by default: sources at the bottom, then
 * overlays, distortions, stylize, and grain on top.
 */
const RANK: SectionKey[] = [
  "image",
  "gradient",
  "blobs",
  "light",
  "plaid",
  "pattern",
  "waves",
  "glass",
  "optics",
  "pixelate",
  "halftone",
  "ascii",
  "dither",
  "grain",
];

/** Adds `key` to the stack (if missing) at its natural position. */
export function addLayer(order: SectionKey[], key: SectionKey): SectionKey[] {
  if (order.includes(key)) return order;
  const rank = RANK.indexOf(key);
  const at = order.findIndex((k) => RANK.indexOf(k) < rank);
  return at === -1 ? [...order, key] : [...order.slice(0, at), key, ...order.slice(at)];
}

/** Stack for sections that are enabled but have no explicit order yet. */
export function orderFromEnabled(sections: Record<SectionKey, SectionState>, order: SectionKey[] = []) {
  let next = order.filter((k) => k in sections);
  for (const key of RANK) if (sections[key].enabled) next = addLayer(next, key);
  return next;
}

export function initialState(): StudioState {
  const state = emptyState();
  state.sections.gradient = { ...state.sections.gradient, enabled: true, preset: "g-mono" };
  state.sections.glass = { ...state.sections.glass, enabled: true, preset: "gl-fluted" };
  state.sections.grain = { ...state.sections.grain, enabled: true };
  state.order = orderFromEnabled(state.sections);
  return state;
}
