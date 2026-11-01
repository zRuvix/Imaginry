import { PRESETS_BY_ID } from "./presets";
import {
  BLEND_MODES,
  emptyState,
  orderFromEnabled,
  SCHEMA_BY_KEY,
  SECTION_KEYS,
  type Control,
  type SectionKey,
  type SectionState,
  type StudioState,
  type Value,
} from "./schema";

const SAVED_KEY = "imaginry:saved";

export type SavedDesign = {
  id: string;
  createdAt: number;
  thumb: string;
  state: StudioState;
};

function fromBase64Url(text: string) {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Fills in any sections/keys missing from older or hand-edited payloads. */
export function normalize(raw: unknown): StudioState | null {
  if (!raw || typeof raw !== "object" || !("sections" in raw)) return null;
  const input = raw as Partial<StudioState>;
  const base = emptyState(Number(input.seed) || 0);
  for (const key of SECTION_KEYS) {
    const s = input.sections?.[key];
    if (s && typeof s === "object") base.sections[key] = { ...base.sections[key], ...s };
  }
  const order = Array.isArray(input.order) ? input.order.filter((k) => SECTION_KEYS.includes(k)) : [];
  base.order = orderFromEnabled(base.sections, order);
  return base;
}

// ---------------------------------------------------------------- share links
//
// Links only carry what differs from the presets. A design is its seed then
// each layer (top first), separated by "/":
//
//   0.8/th-risograph/w-liquid(amplitude=0.2)/_pa-wash/g-ember(o=0.8,b=3)
//
// A layer is a preset id (or a bare effect key), a leading "_" when hidden,
// and in brackets only the settings changed from that preset: numbers as-is,
// colors without "#", color lists joined by "-", selects and toggles as
// indexes. "o" is opacity, "b" the blend mode index, "t" a held frame.

const num = (v: unknown) => String(+Number(v).toFixed(4));

const sameValue = (a: unknown, b: unknown) =>
  typeof a === "number" || typeof b === "number"
    ? Math.abs(Number(a) - Number(b)) < 1e-6
    : JSON.stringify(a) === JSON.stringify(b);

function packValue(c: Control, v: Value): string {
  switch (c.type) {
    case "slider":
      return num(v);
    case "toggle":
      return v ? "1" : "0";
    case "select":
      return String(Math.max(0, c.options.indexOf(String(v))));
    case "color":
      return String(v).replace("#", "");
    case "colors":
      return (Array.isArray(v) ? v : []).map((x) => String(x).replace("#", "")).join("-");
  }
}

function unpackValue(c: Control, raw: string): Value {
  switch (c.type) {
    case "slider":
      return Number(raw) || 0;
    case "toggle":
      return raw === "1";
    case "select":
      return c.options[Number(raw)] ?? c.options[0];
    case "color":
      return `#${raw}`;
    case "colors":
      return raw.split("-").filter(Boolean).map((x) => `#${x}`);
  }
}

function encodeLayer(state: StudioState, key: SectionKey) {
  const s = state.sections[key];
  const schema = SCHEMA_BY_KEY[key];
  const preset = s.preset ? PRESETS_BY_ID[s.preset] : undefined;
  const fromPreset = preset?.section === key ? preset : undefined;
  const base: Record<string, Value> = { ...schema.defaults, ...(fromPreset?.values ?? {}) };

  const changed: string[] = [];
  for (const c of schema.controls) {
    if (!sameValue(s[c.key], base[c.key])) changed.push(`${c.key}=${packValue(c, s[c.key])}`);
  }
  if (!sameValue(s.layerOpacity ?? 1, 1)) changed.push(`o=${num(s.layerOpacity)}`);
  if ((s.layerBlend ?? "normal") !== "normal") changed.push(`b=${BLEND_MODES.indexOf(String(s.layerBlend))}`);
  if (!s.animated) changed.push(`t=${num(s.frozenTime)}`);

  const id = fromPreset ? fromPreset.id : key;
  return `${s.enabled ? "" : "_"}${id}${changed.length ? `(${changed.join(",")})` : ""}`;
}

/** A compact, human-readable share string for the design. */
export function encodeShare(state: StudioState) {
  return [num(state.seed), ...state.order.map((key) => encodeLayer(state, key))].join("/");
}

function decodeCompact(text: string): StudioState | null {
  const [seedPart, ...tokens] = text.split("/");
  if (!/^-?\d+(\.\d+)?$/.test(seedPart)) return null;
  const state = emptyState(Number(seedPart));
  const order: SectionKey[] = [];

  for (const token of tokens) {
    const m = token.match(/^(_?)([\w-]+)(?:\((.*)\))?$/);
    if (!m) continue;
    const [, hidden, id, args] = m;
    const preset = PRESETS_BY_ID[id];
    const key = preset ? preset.section : (SECTION_KEYS as string[]).includes(id) ? (id as SectionKey) : null;
    if (!key || order.includes(key)) continue;

    const schema = SCHEMA_BY_KEY[key];
    const section: SectionState = {
      ...state.sections[key],
      ...(preset ? structuredClone(preset.values) : {}),
      enabled: !hidden,
      preset: preset ? preset.id : null,
    };
    for (const pair of (args ?? "").split(",").filter(Boolean)) {
      const [k, raw] = pair.split("=");
      if (raw === undefined) continue;
      if (k === "o") section.layerOpacity = Number(raw);
      else if (k === "b") section.layerBlend = BLEND_MODES[Number(raw)] ?? "normal";
      else if (k === "t") {
        section.animated = false;
        section.frozenTime = Number(raw) || 0;
      } else {
        const control = schema.controls.find((c) => c.key === k);
        if (control) section[k] = unpackValue(control, raw);
      }
    }
    state.sections[key] = section;
    order.push(key);
  }
  state.order = order;
  return state;
}

/** Reads a design from a URL hash: the compact format, or the older base64 one. */
export function decodeShare(hash: string): StudioState | null {
  const text = decodeURIComponent(hash.replace(/^#/, ""));
  if (!text) return null;
  const legacy = text.match(/(?:^|&)s=([\w-]+)/);
  try {
    return legacy ? normalize(JSON.parse(fromBase64Url(legacy[1]))) : decodeCompact(text);
  } catch {
    return null;
  }
}

export function loadSaved(): SavedDesign[] {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as SavedDesign[];
    return list.flatMap((d) => {
      const state = normalize(d.state);
      return state ? [{ ...d, state }] : [];
    });
  } catch {
    return [];
  }
}

export function storeSaved(list: SavedDesign[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
