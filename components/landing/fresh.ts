import { GALLERY, type CuratedLook } from "@/lib/studio/looks";

/** Fisher–Yates, on a copy. */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A fresh seed and moment, so even a repeat pick renders differently. */
export const reseed = (look: CuratedLook): CuratedLook => ({
  ...look,
  seed: look.seed + Math.random() * 40,
  time: Math.random() * 8,
});

/**
 * `count` different designs from the whole gallery, in a random order with
 * fresh seeds. Call after mount, so the prerendered page stays stable.
 */
export function freshLooks(count: number): CuratedLook[] {
  return shuffle(GALLERY).slice(0, count).map(reseed);
}
