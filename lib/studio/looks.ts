import { PRESETS_BY_ID } from "./presets";
import { addLayer, emptyState, type SectionKey, type StudioState, type Value } from "./schema";

/** A finished design, built from presets plus small tweaks. */
export type CuratedLook = {
  name: string;
  /** What it's made of, shown under the name. */
  recipe: string;
  presets: string[];
  tweaks?: Partial<Record<SectionKey, Record<string, Value>>>;
  seed: number;
  /** Width / height of the card. */
  ratio: number;
  time?: number;
};

export function stateForLook(look: CuratedLook): StudioState {
  const state = emptyState(look.seed);
  for (const id of look.presets) {
    const preset = PRESETS_BY_ID[id];
    state.sections[preset.section] = {
      ...state.sections[preset.section],
      ...structuredClone(preset.values),
      enabled: true,
      preset: id,
    };
    state.order = addLayer(state.order, preset.section);
  }
  for (const [key, values] of Object.entries(look.tweaks ?? {})) {
    const k = key as SectionKey;
    state.sections[k] = { ...state.sections[k], ...values };
  }
  return state;
}

export const CURATED: CuratedLook[] = [
  {
    name: "Ember Reeds",
    recipe: "Fluted glass",
    presets: ["g-sunset", "gl-fluted", "gr-fine"],
    tweaks: { gradient: { type: "linear", angle: 90, warp: 0.9 } },
    seed: 4.2,
    ratio: 4 / 3,
  },
  {
    name: "Cobalt Bloom",
    recipe: "Blobs & aberration",
    presets: ["g-nebula", "b-lava", "o-prism", "gr-film"],
    tweaks: { gradient: { colors: ["#050a2e", "#1d3bff", "#7fb0ff", "#0a1450"] } },
    seed: 11.3,
    ratio: 4 / 3,
  },
  {
    name: "Pearl Screen",
    recipe: "Halftone",
    presets: ["g-lilac", "h-color", "gr-fine"],
    tweaks: {
      gradient: { colors: ["#f3eef8", "#d9c8e6", "#c9e2e8", "#efe2ea"] },
      halftone: { size: 7 },
    },
    seed: 2.7,
    ratio: 4 / 3,
  },
  {
    name: "Moss Haze",
    recipe: "Frosted glass & grain",
    presets: ["g-teal", "gl-frosted", "gr-film"],
    tweaks: {
      gradient: { colors: ["#0f2414", "#7fb069", "#244d2e", "#c9dfa0"], warp: 1.4, scale: 0.8 },
      glass: { frost: 0.6, distortion: 1.6 },
    },
    seed: 7.9,
    ratio: 3 / 4,
  },
  {
    name: "Lilac Static",
    recipe: "Dither",
    presets: ["g-violet", "d-color", "gr-fine"],
    seed: 5.1,
    ratio: 1,
  },
  {
    name: "Night Weave",
    recipe: "Plaid & light",
    presets: ["g-nebula", "pl-navy", "l-spot"],
    seed: 9.4,
    ratio: 4 / 3,
  },
  {
    name: "Acid Ripple",
    recipe: "Waves & glass",
    presets: ["g-acid", "w-ripple", "gl-rings"],
    seed: 3.3,
    ratio: 1,
  },
  {
    name: "Ice Lens",
    recipe: "Lens glass",
    presets: ["g-ice", "gl-lens", "gr-fine"],
    seed: 6.6,
    ratio: 4 / 3,
  },
  {
    name: "Gold Dust",
    recipe: "Light rays & grain",
    presets: ["g-gold", "l-rays", "gr-film"],
    seed: 8.1,
    ratio: 3 / 4,
  },
  {
    name: "Violet Signal",
    recipe: "ASCII",
    presets: ["g-magenta", "a-fine"],
    seed: 1.9,
    ratio: 4 / 3,
  },
  {
    name: "Rust Columns",
    recipe: "Wavy glass",
    presets: ["g-ember", "gl-wavy", "o-subtle", "gr-fine"],
    tweaks: { gradient: { colors: ["#ff3b1f", "#2a0f6b", "#ff8a3d", "#8a1030"] } },
    seed: 12.5,
    ratio: 3 / 4,
  },
  {
    name: "Spectrum Grid",
    recipe: "Pillow glass",
    presets: ["g-spectrum", "gl-grid", "gr-fine"],
    seed: 10.2,
    ratio: 1,
  },
];
