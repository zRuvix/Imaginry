import { EFFECTS } from "./effects";
import type { PresetDef } from "./effects/define";
import {
  CATEGORIES,
  emptyState,
  orderFromEnabled,
  SCHEMA_BY_KEY,
  type SectionKey,
  type StudioState,
  type Value,
} from "./schema";

export type Preset = PresetDef & { section: SectionKey };

export type PresetGroup = {
  label: string;
  section: SectionKey;
  /** Sections enabled underneath the preset when rendering its thumbnail. */
  thumbBase?: Partial<Record<SectionKey, Record<string, Value>>>;
  presets: Preset[];
};

/** Library shelves: each effect's presets, grouped by category. */
export const GROUPS: PresetGroup[] = CATEGORIES.flatMap((category) =>
  EFFECTS.filter((e) => e.category === category && e.presets?.list.length).map((e) => ({
    label: e.presets!.label ?? e.label,
    section: e.key,
    thumbBase: e.presets!.thumbBase as PresetGroup["thumbBase"],
    presets: e.presets!.list.map((preset) => ({ ...preset, section: e.key })),
  })),
);

export const PRESETS_BY_ID: Record<string, Preset> = Object.fromEntries(
  GROUPS.flatMap((g) => g.presets.map((pr) => [pr.id, pr])),
);

export const groupFor = (key: SectionKey) => GROUPS.find((g) => g.section === key);

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

/** Curated palettes for the gradient and gradient-map color pickers. */
export const PALETTES: { name: string; colors: string[] }[] = [
  { name: "Ember", colors: ["#16100c", "#9c4a26", "#ff5a2c", "#ffd2a8"] },
  { name: "Lagoon", colors: ["#04132b", "#0f5e7a", "#2bb0a0", "#d9f2ff"] },
  { name: "Orchid", colors: ["#2a1b6e", "#8a4fff", "#ff7ac6", "#ffe0f0"] },
  { name: "Moss", colors: ["#0f2414", "#3f6b3a", "#a7c48a", "#efe6cf"] },
  { name: "Citrus", colors: ["#2e1b4a", "#ff6a00", "#ffd600", "#fff6d6"] },
  { name: "Ink", colors: ["#050505", "#2b2b2b", "#8a8a8a", "#f2f2f2"] },
  { name: "Neon", colors: ["#0a0014", "#ff00aa", "#00ffd5", "#f6ff00"] },
  { name: "Dune", colors: ["#3a2a10", "#b07a3c", "#e8c48e", "#f8efe0"] },
  { name: "Glacier", colors: ["#e9e4d6", "#b8d8e8", "#3d93bf", "#173f5f"] },
  { name: "Rose", colors: ["#2a0a14", "#8a1030", "#ff5a7a", "#ffd9e0"] },
];
