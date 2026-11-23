/**
 * The Lab's own looks: each starts from one of the Lab styles, finished with a
 * few studio layers, and some arrive already reacting to the cursor or scroll.
 */
import { PRESETS_BY_ID } from "@/lib/studio/presets";
import { emptyState, SCHEMA_BY_KEY, type SectionKey, type StudioState, type Value } from "@/lib/studio/schema";
import type { Route } from "./drive";
import { CURSOR_ROUTES } from "./styles/common";

type Layer = { key: SectionKey; preset?: string; values?: Record<string, Value> };

export type LabLook = {
  id: string;
  name: string;
  /** What it's for, in a few words. */
  note: string;
  seed: number;
  /** Bottom first. */
  layers: Layer[];
  routes?: Omit<Route, "id">[];
};

const grain: Layer = { key: "grain", preset: "gr-fine" };

export const LAB_LOOKS: LabLook[] = [
  {
    id: "ascii-horizon",
    name: "ASCII Horizon",
    note: "Glyph glow that scrambles under the cursor",
    seed: 3.1,
    layers: [{ key: "asciiglow" }, grain],
  },
  {
    id: "ascii-eclipse",
    name: "ASCII Eclipse",
    note: "An amber ring in characters",
    seed: 6.4,
    layers: [
      { key: "asciiglow", values: { shape: "eclipse", colors: ["#1a0700", "#a8360c", "#ff8a3d", "#ffe3c2"], cell: 16, scale: 1.2 } },
      grain,
    ],
  },
  {
    id: "ascii-rise",
    name: "Terminal Rise",
    note: "Green glyphs rising from below",
    seed: 8.8,
    layers: [
      { key: "asciiglow", values: { shape: "rise", colors: ["#001a0e", "#0f7a3d", "#3dff8f", "#d6ffe6"], cell: 14, flicker: 0.5, wash: 0.5 } },
      { key: "crt", preset: "crt-classic" },
    ],
  },
  {
    id: "neon-fluid",
    name: "Neon Fluid",
    note: "Ink that follows the cursor",
    seed: 1.4,
    layers: [{ key: "fluid" }, grain],
  },
  {
    id: "liquid-mirror",
    name: "Liquid Mirror",
    note: "Chrome you can stir",
    seed: 5.9,
    layers: [
      { key: "chrome" },
      { key: "fluid", values: { colors: ["#ffffff", "#c9d6ff", "#ffe4f2"], intensity: 0.45, refract: 0.9, auto: 0.3 } },
      grain,
    ],
  },
  {
    id: "grid-lens",
    name: "Grid Lens",
    note: "A grid that bends under the cursor",
    seed: 2.7,
    layers: [{ key: "ripplegrid" }, { key: "bloom", preset: "bl-soft" }, grain],
  },
  {
    id: "dot-field",
    name: "Dot Field",
    note: "Dots that part around the cursor",
    seed: 4.4,
    layers: [{ key: "dotfield" }, grain],
  },
  {
    id: "stage-light",
    name: "Stage Light",
    note: "Rays that lean toward the cursor",
    seed: 7.7,
    layers: [{ key: "rays" }, { key: "grain", preset: "gr-film" }],
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    note: "Aurora curtains over a night sky",
    seed: 9.1,
    layers: [{ key: "aurora" }, grain],
  },
  {
    id: "violet-aurora",
    name: "Violet Aurora",
    note: "Pink and violet curtains",
    seed: 12.6,
    layers: [{ key: "aurora", values: { colors: ["#05010f", "#ff4ecd", "#8b5cf6", "#38bdf8"], bands: 4, sway: 0.9 } }, grain],
  },
  {
    id: "plasma-bloom",
    name: "Plasma Bloom",
    note: "Endless soft interference",
    seed: 3.6,
    layers: [{ key: "plasma" }, { key: "bloom", preset: "bl-soft" }, grain],
  },
  {
    id: "mercury",
    name: "Mercury",
    note: "Liquid silver for product launches",
    seed: 4.2,
    layers: [{ key: "chrome" }, { key: "optics", preset: "o-subtle" }, grain],
    routes: [{ signal: "pointer x", section: "chrome", control: "flow", amount: 0.25, smoothing: 0.9 }],
  },
  {
    id: "molten-gold",
    name: "Molten Gold",
    note: "Warm metal for luxury and finance",
    seed: 11.7,
    layers: [
      { key: "chrome", values: { colors: ["#140b02", "#5a3510", "#e0a84a", "#fff1c9", "#8a5a1c"], bands: 2.2, depth: 0.7 } },
      { key: "bloom", preset: "bl-soft" },
      grain,
    ],
  },
  {
    id: "satin-dusk",
    name: "Satin Dusk",
    note: "Plum satin for beauty and fashion",
    seed: 2.5,
    layers: [{ key: "silk" }, { key: "grain", preset: "gr-film" }],
  },
  {
    id: "champagne",
    name: "Champagne Silk",
    note: "Soft neutral drape for editorial",
    seed: 8.1,
    layers: [
      { key: "silk", values: { colors: ["#2a1d12", "#8a6a48", "#e9d3b0", "#fff7ea"], folds: 3, sheen: 1.1, angle: 35, drape: 0.5 } },
      grain,
    ],
  },
  {
    id: "pool-light",
    name: "Pool Light",
    note: "Sunlit water for travel and wellness",
    seed: 6.6,
    layers: [{ key: "caustics" }, { key: "optics", preset: "o-subtle" }, grain],
  },
  {
    id: "lagoon-glass",
    name: "Lagoon Glass",
    note: "Caustics behind fluted glass",
    seed: 3.3,
    layers: [
      { key: "caustics", values: { deep: "#003b46", light: "#e0fff8", scale: 0.8, brightness: 1.2 } },
      { key: "glass", preset: "gl-fluted" },
      grain,
    ],
  },
  {
    id: "hologram",
    name: "Hologram",
    note: "Foil that tilts with the cursor",
    seed: 1.9,
    layers: [{ key: "holo", values: { tiltX: -0.5, tiltY: -0.5 } }, grain],
    routes: [
      { signal: "pointer x", section: "holo", control: "tiltX", amount: 0.5, smoothing: 0.85 },
      { signal: "pointer y", section: "holo", control: "tiltY", amount: 0.5, smoothing: 0.85 },
    ],
  },
  {
    id: "iris-foil",
    name: "Iris Foil",
    note: "Dark iridescent for tech and music",
    seed: 9.4,
    layers: [
      { key: "holo", values: { base: "#2a2340", spread: 1.4, metal: 0.85, crinkle: 0.6, tiltX: -0.4, tiltY: -0.4 } },
      { key: "bloom", preset: "bl-soft" },
      grain,
    ],
    routes: [
      { signal: "pointer x", section: "holo", control: "tiltX", amount: 0.4, smoothing: 0.85 },
      { signal: "scroll", section: "holo", control: "tiltY", amount: 0.4, smoothing: 0.7 },
    ],
  },
  {
    id: "sumi",
    name: "Sumi",
    note: "Black ink on warm paper",
    seed: 5.5,
    layers: [{ key: "ink", values: { ink: "#111111", accent: "#3b3b3b", paper: "#efe9df", amount: 0.45, edge: 0.8 } }, grain],
  },
  {
    id: "indigo-bloom",
    name: "Indigo Bloom",
    note: "Indigo and coral, slow and organic",
    seed: 7.2,
    layers: [{ key: "ink" }, { key: "filmdust", preset: "fd-light" }, grain],
  },
  {
    id: "terrain",
    name: "Terrain",
    note: "Contours for data and climate",
    seed: 12.3,
    layers: [{ key: "topo" }, grain],
    routes: [{ signal: "scroll", section: "topo", control: "density", amount: 0.15, smoothing: 0.8 }],
  },
  {
    id: "survey-amber",
    name: "Survey Amber",
    note: "Warm map lines, vintage instrument",
    seed: 3.8,
    layers: [
      { key: "topo", values: { background: "#140c05", line: "#5b3a1b", accent: "#ffb347", density: 1.3, glow: 0.5 } },
      { key: "optics", preset: "o-subtle" },
      grain,
    ],
  },
  {
    id: "signal",
    name: "Signal",
    note: "Dot wave for SaaS and AI heroes",
    seed: 2.2,
    layers: [{ key: "dotwave" }, { key: "bloom", preset: "bl-soft" }, grain],
    routes: [{ signal: "pointer speed", section: "dotwave", control: "wave", amount: 0.3, smoothing: 0.9 }],
  },
  {
    id: "ember-field",
    name: "Ember Field",
    note: "Hot dots on black, for launches",
    seed: 10.5,
    layers: [
      { key: "dotwave", values: { background: "#0b0605", dot: "#ff5a2c", accent: "#ffd9b0", density: 1.3, size: 0.5 } },
      { key: "bloom", preset: "bl-soft" },
      grain,
    ],
  },
];

export function stateForLabLook(look: LabLook): StudioState {
  const state = emptyState(look.seed);
  const order: SectionKey[] = [];
  for (const layer of look.layers) {
    const preset = layer.preset ? PRESETS_BY_ID[layer.preset] : undefined;
    state.sections[layer.key] = {
      ...state.sections[layer.key],
      ...(preset ? structuredClone(preset.values) : {}),
      ...structuredClone(layer.values ?? {}),
      enabled: true,
      preset: preset?.id ?? null,
    };
    // Listed bottom first; the stack is stored top first.
    order.unshift(layer.key);
  }
  state.order = order;
  return state;
}

/** True for layers that read the cursor through their Cursor sliders. */
export const followsCursor = (key: SectionKey) => SCHEMA_BY_KEY[key].controls.some((c) => c.key === "mx");

/** The look's own routes, plus the cursor wiring every cursor-aware layer needs. */
export function routesForLook(look: LabLook): Route[] {
  const cursor = look.layers
    .filter((l) => followsCursor(l.key))
    .flatMap((l) => CURSOR_ROUTES.map((c) => ({ signal: c.signal, section: l.key, control: c.control, amount: 1, smoothing: c.smoothing })));
  return [...cursor, ...(look.routes ?? [])].map((r, i) => ({ ...r, id: `${look.id}-${i}` }));
}

/** Reacts to the visitor: wired routes, a cursor-aware layer, or the fluid. */
export const isInteractive = (look: LabLook) =>
  !!look.routes?.length || look.layers.some((l) => followsCursor(l.key) || l.key === "fluid");
