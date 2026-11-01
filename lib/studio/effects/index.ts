/**
 * The effect registry. Every effect is a file in a category folder; this list
 * is their natural stacking order (bottom to top), which is also where a new
 * layer slots into the stack by default.
 */
import adjust from "./color/adjust";
import gradient from "./color/gradient";
import gradientmap from "./color/gradient-map";
import image from "./color/image";
import iridescent from "./color/iridescent";
import posterize from "./color/posterize";
import solarize from "./color/solarize";
import splittone from "./color/split-tone";
import bulge from "./distort/bulge";
import glitch from "./distort/glitch";
import kaleido from "./distort/kaleidoscope";
import mirror from "./distort/mirror";
import polar from "./distort/polar";
import shatter from "./distort/shatter";
import tile from "./distort/tile";
import twirl from "./distort/twirl";
import waves from "./distort/waves";
import glass from "./glass/glass";
import motionblur from "./glass/motion-blur";
import optics from "./glass/optics";
import rgbshift from "./glass/rgb-split";
import tiltshift from "./glass/tilt-shift";
import zoomblur from "./glass/zoom-blur";
import bloom from "./light/bloom";
import bokeh from "./light/bokeh";
import flare from "./light/flare";
import godrays from "./light/god-rays";
import light from "./light/light";
import lightleak from "./light/light-leak";
import sparkle from "./light/sparkle";
import ascii from "./stylize/ascii";
import bricks from "./stylize/bricks";
import crosshatch from "./stylize/crosshatch";
import crt from "./stylize/crt";
import dither from "./stylize/dither";
import edges from "./stylize/edges";
import emboss from "./stylize/emboss";
import engrave from "./stylize/engrave";
import halftone from "./stylize/halftone";
import led from "./stylize/led";
import mosaic from "./stylize/mosaic";
import oilpaint from "./stylize/oil-paint";
import pixelate from "./stylize/pixelate";
import threshold from "./stylize/threshold";
import blobs from "./texture/blobs";
import filmdust from "./texture/film-dust";
import grain from "./texture/grain";
import noise from "./texture/noise";
import paper from "./texture/paper";
import pattern from "./texture/pattern";
import plaid from "./texture/plaid";
import type { EffectDefinition } from "./define";

export const EFFECTS = [
  // sources
  image,
  gradient,
  // things drawn over the source
  noise,
  blobs,
  light,
  bokeh,
  sparkle,
  flare,
  lightleak,
  plaid,
  pattern,
  paper,
  // reshape what's there
  mirror,
  kaleido,
  tile,
  polar,
  twirl,
  bulge,
  waves,
  shatter,
  // lenses and blur
  glass,
  zoomblur,
  motionblur,
  tiltshift,
  rgbshift,
  optics,
  bloom,
  godrays,
  // grade
  adjust,
  splittone,
  iridescent,
  gradientmap,
  posterize,
  solarize,
  // stylize
  mosaic,
  oilpaint,
  edges,
  emboss,
  pixelate,
  bricks,
  led,
  halftone,
  engrave,
  crosshatch,
  ascii,
  threshold,
  dither,
  // finishing
  glitch,
  crt,
  filmdust,
  grain,
] as const;

export type EffectKey = (typeof EFFECTS)[number]["key"];

export const EFFECTS_BY_KEY = Object.fromEntries(EFFECTS.map((e) => [e.key, e])) as unknown as Record<
  EffectKey,
  EffectDefinition<EffectKey>
>;

// Preset ids are stored in saved designs, so they must stay unique.
if (process.env.NODE_ENV !== "production") {
  const seen = new Set<string>();
  for (const e of EFFECTS) {
    for (const preset of e.presets?.list ?? []) {
      if (seen.has(preset.id)) console.warn(`Duplicate preset id "${preset.id}" in ${e.key}`);
      seen.add(preset.id);
    }
  }
}
