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
  /** Moods for the gallery filter. */
  tags?: GalleryTag[];
};

export const GALLERY_TAGS = ["Warm", "Cool", "Neon", "Mono", "Retro", "Organic", "Glass", "Graphic"] as const;
export type GalleryTag = (typeof GALLERY_TAGS)[number];

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

/** Moods for the landing-page looks, which are also in the gallery. */
const CURATED_TAGS: Record<string, GalleryTag[]> = {
  "Ember Reeds": ["Warm", "Glass"],
  "Cobalt Bloom": ["Cool", "Organic"],
  "Pearl Screen": ["Cool", "Graphic"],
  "Moss Haze": ["Organic", "Glass"],
  "Lilac Static": ["Neon", "Retro"],
  "Night Weave": ["Cool", "Graphic"],
  "Acid Ripple": ["Warm", "Glass"],
  "Ice Lens": ["Cool", "Glass"],
  "Gold Dust": ["Warm", "Organic"],
  "Violet Signal": ["Neon", "Retro"],
  "Rust Columns": ["Warm", "Glass"],
  "Spectrum Grid": ["Neon", "Glass"],
};

/** Premade designs for the gallery page and the studio's Gallery tab. */
export const GALLERY: CuratedLook[] = [
  ...CURATED.map((look) => ({ ...look, tags: CURATED_TAGS[look.name] ?? [] })),
  { name: "Opal Drift", recipe: "Iridescent & grain", presets: ["g-lilac", "ir-opal", "gr-fine"], seed: 2.2, ratio: 4 / 5, tags: ["Cool", "Organic"] },
  { name: "Oil Slick", recipe: "Iridescent & waves", presets: ["g-nebula", "w-liquid", "ir-oil", "gr-fine"], seed: 6.4, ratio: 1, tags: ["Neon", "Organic"] },
  { name: "Sunday Matinee", recipe: "Film dust & light leak", presets: ["g-gold", "lk-burn", "fd-reel", "gr-film"], seed: 3.9, ratio: 16 / 9, tags: ["Warm", "Retro"] },
  { name: "Cathedral", recipe: "God rays & grid", presets: ["g-violet", "pt-grid", "gr-over", "gr-fine"], seed: 8.8, ratio: 3 / 4, tags: ["Cool", "Graphic"] },
  { name: "After Hours", recipe: "Bokeh & flare", presets: ["g-nebula", "bk-city", "fl-ana", "gr-fine"], seed: 5.5, ratio: 4 / 3, tags: ["Cool", "Neon"] },
  { name: "Wishing Well", recipe: "Twirl & glass", presets: ["g-teal", "tw-whirl", "gl-rings"], seed: 1.3, ratio: 1, tags: ["Cool", "Glass"] },
  { name: "Planetoid", recipe: "Polar & bloom", presets: ["g-sunset", "po-planet", "bl-soft", "gr-fine"], seed: 9.1, ratio: 1, tags: ["Warm", "Organic"] },
  { name: "Corrupted", recipe: "Glitch & CRT", presets: ["g-spectrum", "gl-heavy", "crt-classic"], seed: 4.7, ratio: 16 / 9, tags: ["Neon", "Retro"] },
  { name: "Broken Mirror", recipe: "Shatter & split tone", presets: ["g-ice", "sh-glass", "st-dusk", "gr-fine"], seed: 7.2, ratio: 4 / 5, tags: ["Cool", "Glass"] },
  { name: "Wallpaper No. 4", recipe: "Tile & posterize", presets: ["g-acid", "ti-wall", "po-5"], seed: 2.9, ratio: 1, tags: ["Warm", "Graphic"] },
  { name: "Gallery Oil", recipe: "Oil paint & paper", presets: ["g-ember", "b-lava", "op-brush", "pa-cotton"], seed: 10.6, ratio: 4 / 5, tags: ["Warm", "Organic"] },
  { name: "Field Notes", recipe: "Cross-hatch", presets: ["g-magenta", "b-duo", "ch-sepia"], seed: 3.3, ratio: 3 / 4, tags: ["Mono", "Graphic"] },
  { name: "Brass Plate", recipe: "Emboss & split tone", presets: ["g-mono", "pt-diamonds", "em-metal", "st-teal"], seed: 6.1, ratio: 4 / 3, tags: ["Mono", "Graphic"] },
  { name: "Photocopy", recipe: "Threshold & grain", presets: ["g-violet", "b-swarm", "th-copy", "gr-film"], seed: 11.8, ratio: 3 / 4, tags: ["Mono", "Retro"] },
  { name: "Riso Print", recipe: "Threshold & paper", presets: ["g-ember", "w-liquid", "th-risograph", "pa-wash"], seed: 0.8, ratio: 4 / 5, tags: ["Warm", "Retro"] },
  { name: "Toy Box", recipe: "Bricks", presets: ["g-spectrum", "b-lava", "br-toy"], seed: 5.9, ratio: 1, tags: ["Neon", "Graphic"] },
  { name: "Stadium", recipe: "LED wall & bloom", presets: ["g-acid", "w-swirl", "le-stadium", "bl-hot"], seed: 12.2, ratio: 16 / 9, tags: ["Neon", "Retro"] },
  { name: "Marble Hall", recipe: "Ridged noise & gradient map", presets: ["g-mono", "nz-marble", "gm-sepia", "gr-fine"], seed: 4.1, ratio: 3 / 4, tags: ["Mono", "Organic"] },
  { name: "Warp Speed", recipe: "Zoom blur & sparkle", presets: ["g-nebula", "sp-stars", "zb-warp"], seed: 8.4, ratio: 16 / 9, tags: ["Cool", "Neon"] },
  { name: "Model Town", recipe: "Tilt-shift & dots", presets: ["g-teal", "pt-dots", "ts-mini"], seed: 1.7, ratio: 4 / 3, tags: ["Cool", "Graphic"] },
  { name: "Solar Print", recipe: "Solarize & halftone", presets: ["g-sunset", "so-classic", "h-coarse"], seed: 9.6, ratio: 3 / 4, tags: ["Warm", "Retro"] },
  { name: "Lagoon Lens", recipe: "Bulge & glass", presets: ["g-teal", "bu-bubble", "gl-lens", "gr-fine"], seed: 2.6, ratio: 1, tags: ["Cool", "Glass"] },
  { name: "Neon Contour", recipe: "Edges & bloom", presets: ["g-magenta", "gl-wavy", "ed-neon", "bl-dream"], seed: 7.7, ratio: 4 / 5, tags: ["Neon", "Glass"] },
  { name: "Kodachrome", recipe: "Split tone & dust", presets: ["g-sunset", "st-teal", "fd-light", "gr-film"], seed: 6.9, ratio: 4 / 3, tags: ["Warm", "Retro"] },
];
