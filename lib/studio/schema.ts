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
  "adjust",
  "gradientmap",
  "posterize",
  "bloom",
  "rgbshift",
  "kaleido",
  "mirror",
  "mosaic",
  "crt",
  "edges",
  "engrave",
  "sparkle",
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

/** Library shelves. */
export const CATEGORIES = ["Color", "Light", "Glass & optics", "Distort", "Texture", "Stylize"] as const;
export type Category = (typeof CATEGORIES)[number];

export type SectionSchema = {
  key: SectionKey;
  label: string;
  category: Category;
  /** One line shown in the inspector header. */
  blurb: string;
  info?: string;
  controls: Control[];
  defaults: Record<string, Value>;
};

export const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "soft light", "difference", "add"];

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
    category: "Color",
    blurb: "Your own photo as the base layer.",
    info: "Use a photo as the base; layers above it (like a gradient) can blend over it. Paste from the clipboard or drop an image onto the stage.",
    controls: [
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
    category: "Texture",
    blurb: "Masks the image into repeating shapes.",
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
    category: "Color",
    blurb: "The color everything else is built on.",
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
    ],
    defaults: {
      type: "linear",
      colors: ["#ffffff", "#7a7a7a", "#000000"],
      angle: -20,
      scale: 1,
      warp: 0.3,
      speed: 0.5,
    },
  },
  {
    key: "optics",
    label: "Optics",
    category: "Glass & optics",
    blurb: "Lens distortion, fringing and glow.",
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
    category: "Light",
    blurb: "Rays, beams and caustics.",
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
    category: "Distort",
    blurb: "Ripples, swirls and liquid motion.",
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
    category: "Texture",
    blurb: "Soft shapes drifting in your colors.",
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
    category: "Glass & optics",
    blurb: "Refracts everything below through lenses.",
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
    category: "Stylize",
    blurb: "Big, honest pixels.",
    controls: [slider("size", "Size", 2, 120, 1)],
    defaults: { size: 16 },
  },
  {
    key: "dither",
    label: "Dither",
    category: "Stylize",
    blurb: "Ordered dithering, 1-bit or color.",
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
    category: "Stylize",
    blurb: "Print-style dot screens.",
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
    category: "Texture",
    blurb: "Woven tartan over the image.",
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
    category: "Stylize",
    blurb: "Rebuilds the image from characters.",
    controls: [slider("size", "Size", 4, 40, 0.5), { key: "colored", label: "Colored", type: "toggle" }],
    defaults: { size: 10, colored: true },
  },
  {
    key: "grain",
    label: "Grain",
    category: "Texture",
    blurb: "Film grain for the finishing tooth.",
    controls: [slider("amount", "Amount", 0, 0.6, 0.01), slider("size", "Size", 1, 6, 0.1)],
    defaults: { amount: 0.1, size: 1 },
  },
  {
    key: "adjust",
    label: "Adjust",
    category: "Color",
    blurb: "Exposure, contrast, saturation and hue.",
    controls: [
      slider("exposure", "Exposure", -2, 2, 0.01),
      slider("brightness", "Brightness", -0.5, 0.5, 0.01),
      slider("contrast", "Contrast", 0, 2, 0.01),
      slider("saturation", "Saturation", 0, 2, 0.01),
      slider("hue", "Hue", -180, 180, 1),
      slider("temperature", "Temperature", -1, 1, 0.01),
    ],
    defaults: { exposure: 0, brightness: 0, contrast: 1.1, saturation: 1.15, hue: 0, temperature: 0.2 },
  },
  {
    key: "gradientmap",
    label: "Gradient Map",
    category: "Color",
    blurb: "Recolors by brightness, shadows to highlights.",
    controls: [
      { key: "colors", label: "Colors", type: "colors", max: 5 },
      { key: "reverse", label: "Reverse", type: "toggle" },
    ],
    defaults: { colors: ["#120a1e", "#ff5a2c", "#ffe2b8"], reverse: false },
  },
  {
    key: "posterize",
    label: "Posterize",
    category: "Color",
    blurb: "Flattens color into a few bands.",
    controls: [slider("levels", "Levels", 2, 16, 1), slider("gamma", "Gamma", 0.3, 2.5, 0.01)],
    defaults: { levels: 5, gamma: 1 },
  },
  {
    key: "bloom",
    label: "Bloom",
    category: "Light",
    blurb: "Highlights that bleed soft light.",
    controls: [
      slider("threshold", "Threshold", 0, 1, 0.01),
      slider("intensity", "Intensity", 0, 2, 0.01),
      slider("radius", "Radius", 0.05, 1, 0.01),
    ],
    defaults: { threshold: 0.55, intensity: 0.9, radius: 0.4 },
  },
  {
    key: "rgbshift",
    label: "RGB Split",
    category: "Glass & optics",
    blurb: "Pulls the color channels apart.",
    controls: [
      slider("amount", "Amount", 0, 1, 0.01),
      slider("angle", "Angle", -180, 180, 1),
      slider("jitter", "Glitch", 0, 1, 0.01),
    ],
    defaults: { amount: 0.3, angle: 0, jitter: 0 },
  },
  {
    key: "kaleido",
    label: "Kaleidoscope",
    category: "Distort",
    blurb: "Folds the image into mirrored wedges.",
    controls: [
      slider("segments", "Segments", 2, 16, 1),
      slider("rotate", "Rotate", -180, 180, 1),
      slider("zoom", "Zoom", 0.3, 3, 0.01),
      slider("speed", "Spin", -2, 2, 0.01),
    ],
    defaults: { segments: 6, rotate: 0, zoom: 1, speed: 0 },
  },
  {
    key: "mirror",
    label: "Mirror",
    category: "Distort",
    blurb: "Perfect symmetry, any axis.",
    controls: [
      { key: "mode", label: "Axis", type: "select", options: ["horizontal", "vertical", "quad", "diagonal"] },
      slider("offset", "Offset", -1, 1, 0.01),
    ],
    defaults: { mode: "horizontal", offset: 0 },
  },
  {
    key: "mosaic",
    label: "Mosaic",
    category: "Stylize",
    blurb: "Stained-glass cells with leaded edges.",
    controls: [
      slider("scale", "Cells", 3, 60, 1),
      slider("edge", "Edge", 0, 0.4, 0.01),
      slider("jitter", "Jitter", 0, 1, 0.01),
      { key: "edgeColor", label: "Edge color", type: "color" },
    ],
    defaults: { scale: 14, edge: 0.08, jitter: 0.9, edgeColor: "#0d0c0b" },
  },
  {
    key: "crt",
    label: "CRT",
    category: "Stylize",
    blurb: "Scanlines, phosphor mask and a curved tube.",
    controls: [
      slider("lines", "Scanlines", 0, 1, 0.01),
      slider("curve", "Curvature", 0, 1, 0.01),
      slider("mask", "Phosphor", 0, 1, 0.01),
      slider("flicker", "Flicker", 0, 1, 0.01),
    ],
    defaults: { lines: 0.6, curve: 0.4, mask: 0.4, flicker: 0.3 },
  },
  {
    key: "edges",
    label: "Edges",
    category: "Stylize",
    blurb: "Traces every contour: glow, ink or neon.",
    controls: [
      { key: "mode", label: "Mode", type: "select", options: ["glow", "ink", "neon"] },
      slider("strength", "Strength", 0, 3, 0.01),
      slider("thickness", "Thickness", 0.5, 4, 0.1),
      { key: "color", label: "Color", type: "color" },
    ],
    defaults: { mode: "glow", strength: 1.2, thickness: 1.2, color: "#ffd2a8" },
  },
  {
    key: "engrave",
    label: "Engrave",
    category: "Stylize",
    blurb: "Banknote-style line shading.",
    controls: [
      slider("size", "Line size", 3, 30, 0.5),
      slider("angle", "Angle", -90, 90, 1),
      slider("wave", "Wave", 0, 1.5, 0.01),
      { key: "ink", label: "Ink", type: "color" },
      { key: "paper", label: "Paper", type: "color" },
    ],
    defaults: { size: 7, angle: 30, wave: 0.3, ink: "#1a1410", paper: "#efe6d4" },
  },
  {
    key: "sparkle",
    label: "Sparkle",
    category: "Light",
    blurb: "Twinkling star points over everything.",
    controls: [
      slider("density", "Density", 0.3, 4, 0.01),
      slider("size", "Size", 0.2, 3, 0.01),
      slider("speed", "Twinkle", 0, 4, 0.01),
      { key: "color", label: "Color", type: "color" },
    ],
    defaults: { density: 1.4, size: 1, speed: 1.2, color: "#fff4e0" },
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
      // Every layer blends over the one below.
      layerOpacity: 1,
      layerBlend: "normal",
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
  "sparkle",
  "plaid",
  "pattern",
  "mirror",
  "kaleido",
  "waves",
  "glass",
  "rgbshift",
  "optics",
  "bloom",
  "adjust",
  "gradientmap",
  "posterize",
  "mosaic",
  "edges",
  "pixelate",
  "halftone",
  "engrave",
  "ascii",
  "dither",
  "crt",
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
