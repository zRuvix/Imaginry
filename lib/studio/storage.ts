import { emptyState, orderFromEnabled, SECTION_KEYS, type StudioState } from "./schema";

const SAVED_KEY = "imaginry:saved";

export type SavedDesign = {
  id: string;
  createdAt: number;
  thumb: string;
  state: StudioState;
};

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

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

export function encodeShare(state: StudioState) {
  return toBase64Url(JSON.stringify(state));
}

export function decodeShare(hash: string): StudioState | null {
  const match = hash.match(/[#&]s=([\w-]+)/);
  if (!match) return null;
  try {
    return normalize(JSON.parse(fromBase64Url(match[1])));
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
