import { emptyState, GLASS_FLUTED, orderFromEnabled, type SectionKey, type StudioState, type Value } from "./schema";

export type Preset = {
  id: string;
  section: SectionKey;
  values: Record<string, Value>;
};

export type PresetGroup = {
  label: string;
  section: SectionKey;
  info?: string;
  /** Sections enabled underneath the preset when rendering its thumbnail. */
  thumbBase?: Partial<Record<SectionKey, Record<string, Value>>>;
  presets: Preset[];
};

const mono = { type: "linear", colors: ["#ffffff", "#7a7a7a", "#000000"], angle: -20, scale: 1, warp: 0.3, speed: 0.5 };
const violet = {
  type: "mesh",
  colors: ["#2a1b6e", "#8a4fff", "#3bc8c0", "#d65db1"],
  angle: 0,
  scale: 1,
  warp: 0.6,
  speed: 0.4,
};
const magenta = {
  type: "mesh",
  colors: ["#ff2d95", "#3a0ca3", "#ff8c42", "#4cc9f0"],
  angle: 0,
  scale: 1,
  warp: 0.5,
  speed: 0.4,
};

const p = (section: SectionKey, id: string, values: Record<string, Value>): Preset => ({
  id,
  section,
  values,
});

export const GROUPS: PresetGroup[] = [
  {
    label: "Gradients",
    section: "gradient",
    presets: [
      p("gradient", "g-mono", mono),
      p("gradient", "g-magenta", {
        type: "radial",
        colors: ["#1a0010", "#c2105f", "#ff5aa8", "#d01070"],
        angle: 0,
        scale: 1,
        warp: 0.15,
        speed: 0.4,
      }),
      p("gradient", "g-violet", {
        type: "linear",
        colors: ["#2d0aff", "#9d1cf0", "#ff2d95", "#3046ff"],
        angle: 35,
        scale: 0.9,
        warp: 0.9,
        speed: 0.5,
      }),
      p("gradient", "g-ember", {
        type: "mesh",
        colors: ["#ff3b30", "#7b61ff", "#ff8a3d", "#c2185b"],
        angle: 0,
        scale: 1,
        warp: 0.5,
        speed: 0.5,
      }),
      p("gradient", "g-acid", {
        type: "mesh",
        colors: ["#ffd600", "#2e1b4a", "#ff6a00", "#5b2a86"],
        angle: 0,
        scale: 1.1,
        warp: 0.7,
        speed: 0.5,
      }),
      p("gradient", "g-spectrum", {
        type: "linear",
        colors: ["#00c853", "#2962ff", "#ffd600", "#d50000"],
        angle: 50,
        scale: 1,
        warp: 0.8,
        speed: 0.6,
      }),
      p("gradient", "g-lilac", {
        type: "mesh",
        colors: ["#3b3366", "#b4a7e0", "#6b5ca5", "#2b2440"],
        angle: 0,
        scale: 1.3,
        warp: 0.4,
        speed: 0.3,
      }),
      p("gradient", "g-teal", {
        type: "mesh",
        colors: ["#0c3b3c", "#2bb0a0", "#145c58", "#6be3c6"],
        angle: 0,
        scale: 1.2,
        warp: 0.4,
        speed: 0.3,
      }),
      p("gradient", "g-sunset", {
        type: "radial",
        colors: ["#ffcc33", "#ff5a1f", "#c41e3a", "#2a0a0a"],
        angle: 0,
        scale: 1.1,
        warp: 0.35,
        speed: 0.4,
      }),
      p("gradient", "g-ice", {
        type: "mesh",
        colors: ["#e9e4d6", "#3d93bf", "#173f5f", "#b8d8e8"],
        angle: 0,
        scale: 1,
        warp: 0.6,
        speed: 0.4,
      }),
      p("gradient", "g-gold", {
        type: "linear",
        colors: ["#3a2a10", "#d9a441", "#f5e0a0", "#6b4a1a"],
        angle: -60,
        scale: 1,
        warp: 0.9,
        speed: 0.4,
      }),
      p("gradient", "g-nebula", {
        type: "mesh",
        colors: ["#0b0b1e", "#5a5adb", "#b7a6ff", "#141432"],
        angle: 0,
        scale: 0.9,
        warp: 0.5,
        speed: 0.4,
      }),
    ],
  },
  {
    label: "Patterns",
    section: "pattern",
    info: "Masks the image into a repeating shape.",
    thumbBase: { gradient: magenta },
    presets: [
      p("pattern", "pt-dots", { type: "dots", scale: 9, size: 0.8, angle: 0, softness: 0.04, background: "#0a0a0a" }),
      p("pattern", "pt-grid", { type: "grid", scale: 9, size: 0.3, angle: 0, softness: 0.03, background: "#0a0a0a" }),
      p("pattern", "pt-stripes", {
        type: "stripes",
        scale: 10,
        size: 0.5,
        angle: 45,
        softness: 0.08,
        background: "#0a0a0a",
      }),
      p("pattern", "pt-checker", {
        type: "checker",
        scale: 8,
        size: 0.5,
        angle: 0,
        softness: 0.02,
        background: "#0a0a0a",
      }),
      p("pattern", "pt-diamonds", {
        type: "diamonds",
        scale: 12,
        size: 0.8,
        angle: 0,
        softness: 0.04,
        background: "#0a0a0a",
      }),
      p("pattern", "pt-triangles", {
        type: "triangles",
        scale: 10,
        size: 0.8,
        angle: 0,
        softness: 0.03,
        background: "#0a0a0a",
      }),
    ],
  },
  {
    label: "Light",
    section: "light",
    thumbBase: { gradient: violet },
    presets: [
      p("light", "l-rays", { type: "rays", intensity: 0.9, color: "#ffffff", spread: 1, angle: -45, x: -0.5, y: 0.5 }),
      p("light", "l-rays-top", { type: "rays", intensity: 0.9, color: "#fff2d6", spread: 2, angle: -90, x: 0, y: 0.6 }),
      p("light", "l-beams", { type: "beams", intensity: 0.9, color: "#ffffff", spread: 1.2, angle: -60, x: 0, y: 0 }),
      p("light", "l-spot", { type: "spot", intensity: 0.9, color: "#ffe9f6", spread: 1, angle: 0, x: 0.2, y: 0.2 }),
      p("light", "l-caustics", { type: "caustics", intensity: 0.8, color: "#d9fbff", spread: 1, angle: 0, x: 0, y: 0 }),
      p("light", "l-rays-soft", {
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
  {
    label: "Glass",
    section: "glass",
    thumbBase: { gradient: mono },
    presets: [
      p("glass", "gl-fluted", { ...GLASS_FLUTED }),
      p("glass", "gl-grid", {
        ...GLASS_FLUTED,
        type: "grid",
        segments: 12,
        distortion: 0.6,
        zoom: 1.35,
        stagger: 0.25,
      }),
      p("glass", "gl-frosted", {
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
      p("glass", "gl-rings", { ...GLASS_FLUTED, type: "rings", segments: 9, distortion: 0.5, zoom: 1.4, stagger: 0.4 }),
      p("glass", "gl-wavy", { ...GLASS_FLUTED, type: "wavy", segments: 14, distortion: 0.6, zoom: 1.3, angle: 20 }),
      p("glass", "gl-lens", {
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
  {
    label: "Optics",
    section: "optics",
    thumbBase: { gradient: violet },
    presets: [
      p("optics", "o-subtle", { aberration: 0.4, distortion: 0.1, vignette: 0.3, glow: 0.1 }),
      p("optics", "o-prism", { aberration: 1.6, distortion: 0.2, vignette: 0.2, glow: 0.2 }),
      p("optics", "o-fisheye", { aberration: 0.6, distortion: 0.8, vignette: 0.6, glow: 0 }),
      p("optics", "o-dream", { aberration: 0.3, distortion: -0.2, vignette: 0.9, glow: 0.9 }),
    ],
  },
  {
    label: "Waves",
    section: "waves",
    thumbBase: { gradient: magenta },
    presets: [
      p("waves", "w-sine", { type: "sine", amplitude: 0.05, frequency: 8, speed: 1, angle: 0 }),
      p("waves", "w-ripple", { type: "ripple", amplitude: 0.03, frequency: 24, speed: 1.5, angle: 0 }),
      p("waves", "w-swirl", { type: "swirl", amplitude: 0.3, frequency: 3, speed: 0.6, angle: 0 }),
      p("waves", "w-liquid", { type: "liquid", amplitude: 0.15, frequency: 4, speed: 0.5, angle: 0 }),
    ],
  },
  {
    label: "Blobs",
    section: "blobs",
    thumbBase: { gradient: { ...violet, colors: ["#120d2b", "#ff4fa0", "#ffd166", "#4cc9f0"] } },
    presets: [
      p("blobs", "b-lava", { count: 4, size: 0.22, softness: 0.4, speed: 0.6, mix: 1 }),
      p("blobs", "b-duo", { count: 2, size: 0.4, softness: 0.6, speed: 0.4, mix: 1 }),
      p("blobs", "b-swarm", { count: 8, size: 0.12, softness: 0.2, speed: 1, mix: 1 }),
      p("blobs", "b-haze", { count: 5, size: 0.35, softness: 1, speed: 0.3, mix: 0.7 }),
    ],
  },
  {
    label: "Pixelate",
    section: "pixelate",
    thumbBase: { gradient: magenta },
    presets: [
      p("pixelate", "px-fine", { size: 10 }),
      p("pixelate", "px-mid", { size: 24 }),
      p("pixelate", "px-chunky", { size: 60 }),
    ],
  },
  {
    label: "Dither",
    section: "dither",
    thumbBase: { gradient: magenta },
    presets: [
      p("dither", "d-1bit", { levels: 2, scale: 2, mono: true }),
      p("dither", "d-1bit-coarse", { levels: 2, scale: 6, mono: true }),
      p("dither", "d-color", { levels: 2, scale: 3, mono: false }),
      p("dither", "d-color-4", { levels: 4, scale: 3, mono: false }),
    ],
  },
  {
    label: "Halftone",
    section: "halftone",
    thumbBase: { gradient: magenta },
    presets: [
      p("halftone", "h-news", { size: 10, angle: 45, mono: true, ink: "#111111", paper: "#f2efe6" }),
      p("halftone", "h-coarse", { size: 24, angle: 15, mono: true, ink: "#1b1bb3", paper: "#f4f1ea" }),
      p("halftone", "h-color", { size: 12, angle: 45, mono: false, ink: "#111111", paper: "#f2efe6" }),
      p("halftone", "h-pop", { size: 20, angle: 0, mono: false, ink: "#111111", paper: "#f2efe6" }),
    ],
  },
  {
    label: "Plaid",
    section: "plaid",
    thumbBase: { gradient: { ...mono, colors: ["#3a3a3a", "#1a1a1a"] } },
    presets: [
      p("plaid", "pl-tartan", { scale: 5, opacity: 0.6, angle: 0, color: "#b3202a" }),
      p("plaid", "pl-navy", { scale: 4, opacity: 0.6, angle: 0, color: "#2846b8" }),
      p("plaid", "pl-forest", { scale: 7, opacity: 0.6, angle: 45, color: "#1f7a3e" }),
      p("plaid", "pl-ivory", { scale: 3, opacity: 0.5, angle: 0, color: "#efe6cf" }),
    ],
  },
  {
    label: "ASCII",
    section: "ascii",
    thumbBase: { gradient: magenta },
    presets: [
      p("ascii", "a-fine", { size: 8, colored: true }),
      p("ascii", "a-large", { size: 18, colored: true }),
      p("ascii", "a-mono", { size: 10, colored: false }),
    ],
  },
  {
    label: "Grain",
    section: "grain",
    thumbBase: { gradient: mono },
    presets: [
      p("grain", "gr-fine", { amount: 0.08, size: 1 }),
      p("grain", "gr-film", { amount: 0.18, size: 1.5 }),
      p("grain", "gr-heavy", { amount: 0.35, size: 2.5 }),
    ],
  },
];

export const PRESETS_BY_ID: Record<string, Preset> = Object.fromEntries(
  GROUPS.flatMap((g) => g.presets.map((pr) => [pr.id, pr])),
);

/** State used to render a preset's thumbnail. */
export function thumbState(group: PresetGroup, preset: Preset): StudioState {
  const state = emptyState(3);
  for (const [key, values] of Object.entries(group.thumbBase ?? {})) {
    const k = key as SectionKey;
    state.sections[k] = { ...state.sections[k], ...structuredClone(values), enabled: true };
  }
  state.sections[preset.section] = {
    ...state.sections[preset.section],
    ...structuredClone(preset.values),
    enabled: true,
    preset: preset.id,
  };
  state.order = orderFromEnabled(state.sections);
  return state;
}
