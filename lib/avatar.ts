/**
 * Generated profile pictures. A short seed always draws the same small
 * abstract piece in the studio's own visual language: soft mesh gradients,
 * fluted glass, ripples, halftone and grain. Pure string building, so the
 * server route and the editor's instant preview draw identical avatars.
 */

export const AVATAR_SEED = /^[a-z0-9]{6,24}$/;

/** A fresh random seed (10 base-36 characters). */
export function newAvatarSeed() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

/** Public URL of a seed's avatar; the route caches it forever. */
export const avatarUrl = (seed: string) => `/api/avatar/${seed}`;

/** Seeded PRNG: the seed string is hashed into mulberry32's state. */
function random(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Palettes drawn from the studio's gradients: base first, then accents. */
const PALETTES = [
  ["#1b1033", "#ff2d95", "#8a4fff", "#ff8c42"],
  ["#0d1b2a", "#3bc8c0", "#4cc9f0", "#c8f7ff"],
  ["#2b0f0a", "#ff5a2c", "#ffb066", "#ffd8a8"],
  ["#10231a", "#5be39a", "#c6ff6b", "#1a6b7a"],
  ["#160d2e", "#6a5cff", "#ff6bd6", "#ffd36b"],
  ["#2a1b6e", "#8a4fff", "#3bc8c0", "#d65db1"],
  ["#1f0a1a", "#ff4d6d", "#ff9e6b", "#ffe66b"],
  ["#0a1628", "#2f6bff", "#6aa8ff", "#ff6b5e"],
  ["#141210", "#ede7dc", "#ff5a2c", "#8f887d"],
  ["#06201f", "#00c2a8", "#7cf2d1", "#ffd166"],
];

const STYLES = ["mesh", "flute", "ripple", "halftone", "orbit"] as const;
export type AvatarStyle = (typeof STYLES)[number];

const f = (n: number) => +n.toFixed(2);

/** The avatar as an SVG document, 128×128 (scales to any size). */
export function avatarSvg(seed: string, forceStyle?: AvatarStyle) {
  const rnd = random(seed);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
  const range = (a: number, b: number) => a + rnd() * (b - a);

  const palette = pick(PALETTES);
  const [base, ...accents] = palette;
  // Shuffle the accents so the same palette reads differently.
  for (let i = accents.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [accents[i], accents[j]] = [accents[j], accents[i]];
  }
  const style = forceStyle ?? pick(STYLES);
  const angle = Math.round(range(0, 360));

  const defs: string[] = [];
  const body: string[] = [];

  // Every style sits on a mesh of three soft blobs over the base colour.
  defs.push(`<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(range(14, 22))}"/></filter>`);
  body.push(`<rect width="128" height="128" fill="${base}"/>`);
  body.push(
    `<g filter="url(#soft)">${accents
      .map(
        (c) =>
          `<ellipse cx="${f(range(10, 118))}" cy="${f(range(10, 118))}" rx="${f(range(30, 62))}" ry="${f(range(26, 56))}" fill="${c}" opacity="${f(range(0.7, 1))}"/>`,
      )
      .join("")}</g>`,
  );

  if (style === "flute") {
    // Fluted glass: strips that each shift and shade the colours beneath.
    const n = Math.round(range(6, 11));
    const w = 128 / n;
    defs.push(
      `<linearGradient id="strip" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>`,
    );
    body.push(
      `<g transform="rotate(${Math.round(range(-25, 25))} 64 64)">${Array.from(
        { length: n + 4 },
        (_, i) => `<rect x="${f((i - 2) * w)}" y="-40" width="${f(w)}" height="208" fill="url(#strip)"/>`,
      ).join("")}</g>`,
    );
  } else if (style === "ripple") {
    // Ripples spreading from a point, like the studio's pond shader.
    const cx = range(30, 98);
    const cy = range(30, 98);
    const gap = range(7, 12);
    body.push(
      `<g fill="none" stroke-width="${f(gap * 0.42)}">${Array.from({ length: 16 }, (_, i) => {
        const r = (i + 1) * gap;
        return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" stroke="${i % 2 ? "#000" : "#fff"}" stroke-opacity="${f(0.2 - i * 0.008)}"/>`;
      }).join("")}</g>`,
    );
  } else if (style === "halftone") {
    // Dots that grow toward one corner.
    const step = Math.round(range(9, 13));
    const [fx, fy] = [range(0, 128), range(0, 128)];
    const dots: string[] = [];
    for (let y = step / 2; y < 128; y += step) {
      for (let x = step / 2; x < 128; x += step) {
        const d = Math.hypot(x - fx, y - fy) / 181;
        const r = (step / 2) * (1 - d) * 0.95;
        if (r > 0.5) dots.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`);
      }
    }
    body.push(`<g fill="${pick(["#fff", base])}" fill-opacity="${f(range(0.35, 0.6))}">${dots.join("")}</g>`);
  } else if (style === "orbit") {
    // One glassy sphere with a rim light, floating on the mesh.
    const r = range(26, 38);
    const [cx, cy] = [range(44, 84), range(44, 84)];
    defs.push(
      `<radialGradient id="orb" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="0.35" stop-color="${accents[0]}"/><stop offset="1" stop-color="${base}"/></radialGradient>`,
    );
    body.push(
      `<circle cx="${f(cx + r * 0.25)}" cy="${f(cy + r * 0.3)}" r="${f(r)}" fill="#000" opacity="0.35" filter="url(#soft)"/>`,
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#orb)"/>`,
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - 1)}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>`,
    );
  }

  // A light sweep and film grain finish every style.
  defs.push(
    `<linearGradient id="sweep" gradientTransform="rotate(${angle} 0.5 0.5)"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>`,
    `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${Math.round(range(1, 999))}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.55 0"/></filter>`,
  );
  body.push(`<rect width="128" height="128" fill="url(#sweep)"/>`);
  body.push(`<rect width="128" height="128" filter="url(#grain)" opacity="${f(range(0.25, 0.45))}" style="mix-blend-mode:overlay"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><defs>${defs.join("")}</defs>${body.join("")}</svg>`;
}

/** The avatar as a data URI, for instant previews before it is saved. */
export const avatarDataUri = (seed: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(seed))}`;
