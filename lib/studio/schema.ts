import { EFFECTS, type EffectKey } from "./effects";
import type { EffectDefinition, Value } from "./effects/define";

export { BLEND_MODES, CATEGORIES, GLASS_FLUTED, type Category, type Control, type Value } from "./effects/define";

/** Every effect is a section of the design state, and a possible layer. */
export type SectionKey = EffectKey;
export const SECTION_KEYS = EFFECTS.map((e) => e.key) as SectionKey[];

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

export type SectionSchema = EffectDefinition<SectionKey>;

/** All effect definitions, in stacking order. */
export const SCHEMA = [...EFFECTS] as unknown as SectionSchema[];

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
 * Where a newly added layer goes by default: the registry order, from
 * sources at the bottom through distortion and stylize to grain on top.
 */
const RANK: SectionKey[] = SECTION_KEYS;

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
