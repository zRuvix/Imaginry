import "server-only";
import { MOTIONS, type MotionType, motionOf } from "@/lib/studio/motion";
import { SITE_URL } from "@/lib/seo";
import { fitSize, PNG_MAX_SIDE, renderPng } from "@/lib/server/png";
import { allowRequest, createShortLink, resolveShortLink } from "@/lib/server/shortlinks";
import { CHANNELS, formatCurves, MAX_POINTS, parseCurves, type CurvePoint } from "@/lib/studio/curves";
import { htmlEmbed, lookFor, reactEmbed } from "@/lib/studio/embed";
import { GALLERY, GALLERY_TAGS, stateForLook } from "@/lib/studio/looks";
import { GROUPS, PALETTES, PRESETS_BY_ID } from "@/lib/studio/presets";
import {
  addLayer,
  BLEND_MODES,
  CATEGORIES,
  emptyState,
  SCHEMA,
  SCHEMA_BY_KEY,
  SECTION_KEYS,
  type Control,
  type SectionKey,
  type SectionState,
  type StudioState,
  type Value,
} from "@/lib/studio/schema";
import { decodeShare, encodeShare } from "@/lib/studio/storage";

/**
 * Tools the public MCP endpoint (/mcp) offers to AI agents: browse the effect
 * catalogue and premade looks, build a design from layers, read one back, and
 * get embed code. Everything runs on the same schema the studio uses, so a
 * link made here opens in the studio exactly as described.
 */

export class ToolError extends Error {}

/** A tool result with its own content blocks (e.g. an image), plus structured data. */
export class ToolContent {
  constructor(
    public content: Record<string, unknown>[],
    public structured?: Record<string, unknown>,
  ) {}
}

type Args = Record<string, unknown>;
/** `origin` is this site's own base URL for the request, used to reach /render. */
export type ToolContext = { caller: string; origin: string };

export type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  run: (args: Args, ctx: ToolContext) => Promise<unknown> | unknown;
};

/** Image layers need a photo uploaded in the studio, which a link can't carry. */
const BUILDABLE: SectionKey[] = SECTION_KEYS.filter((k) => k !== "image");

/** Long side of the preview image render_png sends inline. */
const PREVIEW_SIDE = 800;

const studioUrl = (design: string) => `${SITE_URL}/studio#${design}`;

function describeControl(c: Control) {
  switch (c.type) {
    case "slider":
      return { key: c.key, label: c.label, type: "number", min: c.min, max: c.max, step: c.step };
    case "select":
      return { key: c.key, label: c.label, type: "option", options: c.options };
    case "color":
      return { key: c.key, label: c.label, type: "color", format: "#rrggbb" };
    case "colors":
      return { key: c.key, label: c.label, type: "colors", format: "array of #rrggbb", maxItems: c.max };
    case "toggle":
      return { key: c.key, label: c.label, type: "boolean" };
    case "curves":
      return {
        key: c.key,
        label: c.label,
        type: "curves",
        format:
          'object { rgb, red, green, blue }, each an array of [x, y] points on 0..255 (omitted channels stay straight), e.g. { "rgb": [[0,0],[64,40],[192,216],[255,255]] }',
      };
  }
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const hex = (v: unknown) => {
  const s = String(v).trim();
  return HEX.test(s) ? `#${s.replace("#", "").toLowerCase()}` : null;
};

/** Checks one control value from an agent and coerces it to what the studio stores. */
function coerce(effect: string, c: Control, raw: unknown, warnings: string[]): Value {
  const where = `${effect}.${c.key}`;
  switch (c.type) {
    case "slider": {
      const v = Number(raw);
      if (!Number.isFinite(v)) throw new ToolError(`${where} must be a number between ${c.min} and ${c.max}`);
      const clamped = Math.min(c.max, Math.max(c.min, v));
      if (clamped !== v) warnings.push(`${where}: ${v} is outside ${c.min}..${c.max}, used ${clamped}`);
      return clamped;
    }
    case "select": {
      const match = c.options.find((o) => o.toLowerCase() === String(raw).toLowerCase());
      if (!match) throw new ToolError(`${where} must be one of: ${c.options.join(", ")}`);
      return match;
    }
    case "color": {
      const v = hex(raw);
      if (!v) throw new ToolError(`${where} must be a hex color like #ff5a2c`);
      return v;
    }
    case "colors": {
      if (!Array.isArray(raw) || raw.length === 0) throw new ToolError(`${where} must be an array of hex colors`);
      const list = raw.map(hex);
      if (list.some((v) => !v)) throw new ToolError(`${where} must only contain hex colors like #ff5a2c`);
      if (list.length > c.max) warnings.push(`${where}: only the first ${c.max} colors are used`);
      return list.slice(0, c.max) as string[];
    }
    case "toggle":
      return raw === true || raw === "true" || raw === 1;
    case "curves": {
      if (typeof raw === "string") return formatCurves(parseCurves(raw));
      if (!raw || typeof raw !== "object") throw new ToolError(`${where} must be an object of point lists like { "rgb": [[0,0],[255,255]] }`);
      const input = raw as Record<string, unknown>;
      const out = parseCurves("");
      for (const ch of CHANNELS) {
        const pts = input[ch];
        if (pts === undefined) continue;
        if (!Array.isArray(pts) || pts.some((pt) => !Array.isArray(pt) || pt.length !== 2 || !pt.every((v) => Number.isFinite(Number(v)))))
          throw new ToolError(`${where}.${ch} must be an array of [x, y] points on 0..255`);
        if (pts.length > MAX_POINTS) warnings.push(`${where}.${ch}: only the first ${MAX_POINTS} points are used`);
        out[ch] = (pts as unknown[][]).map((pt) => [Number(pt[0]), Number(pt[1])] as CurvePoint);
      }
      return formatCurves(out);
    }
  }
}

/** A layer's motion and tempo for describeState, left out when they're at rest. */
function motionSummary(s: SectionState) {
  const m = motionOf(s);
  return {
    ...(m.type === "off" ? {} : { motion: { type: m.type, angle: m.angle, speed: m.speed, distance: m.distance, scatter: m.scatter } }),
    ...(m.tempo === 1 ? {} : { tempo: m.tempo }),
  };
}

/** A finished state as plain layers, top first, with every setting spelled out. */
function describeState(state: StudioState) {
  return {
    seed: state.seed,
    layers: state.order.map((key) => {
      const s = state.sections[key];
      const schema = SCHEMA_BY_KEY[key];
      return {
        effect: key,
        preset: s.preset,
        hidden: !s.enabled,
        opacity: Number(s.layerOpacity ?? 1),
        blend: String(s.layerBlend ?? "normal"),
        ...(s.animated ? {} : { frozen_time: Number(s.frozenTime) || 0 }),
        ...motionSummary(s),
        values: Object.fromEntries(schema.controls.map((c) => [c.key, s[c.key]])),
      };
    }),
  };
}

/** Reads a design from a studio link, a /s/ short link or a bare design string. */
async function resolveDesign(input: unknown): Promise<StudioState> {
  if (typeof input !== "string" || !input.trim()) throw new ToolError("design is required");
  let text = input.trim();
  const short = text.match(/\/s\/([0-9A-Za-z]{5,16})(?:[/?#]|$)/);
  if (short) {
    let stored: string | null = null;
    try {
      stored = await resolveShortLink(short[1]);
    } catch {
      throw new ToolError("The short link service is unavailable right now; pass the full studio link instead");
    }
    if (!stored) throw new ToolError(`Short link ${short[1]} was not found`);
    text = stored;
  } else if (text.includes("#")) {
    text = text.slice(text.indexOf("#") + 1);
  }
  const state = decodeShare(`#${text}`);
  if (!state || state.order.length === 0) throw new ToolError("That doesn't look like an Imaginry design");
  return state;
}

function buildState(args: Args, warnings: string[]): StudioState {
  const layers = args.layers;
  if (!Array.isArray(layers) || layers.length === 0) throw new ToolError("layers must be a non-empty array");
  if (layers.length > 16) throw new ToolError("Use at most 16 layers");
  const seed = args.seed === undefined ? Math.round(Math.random() * 1000) / 100 : Number(args.seed);
  if (!Number.isFinite(seed)) throw new ToolError("seed must be a number");

  const state = emptyState(seed);
  for (const [i, raw] of layers.entries()) {
    if (!raw || typeof raw !== "object") throw new ToolError(`layers[${i}] must be an object`);
    const layer = raw as Args;
    const use = String(layer.use ?? layer.preset ?? layer.effect ?? "");
    const preset = PRESETS_BY_ID[use];
    const key = (preset?.section ?? (SECTION_KEYS.includes(use as SectionKey) ? use : null)) as SectionKey | null;
    if (!key) throw new ToolError(`layers[${i}]: "${use}" is not an effect key or preset id (see list_effects)`);
    if (!BUILDABLE.includes(key)) throw new ToolError(`layers[${i}]: image layers need a photo uploaded in the studio`);
    if (state.order.includes(key)) throw new ToolError(`layers[${i}]: each effect can appear once; "${key}" is repeated`);

    const schema = SCHEMA_BY_KEY[key];
    const section: SectionState = {
      ...state.sections[key],
      ...(preset ? structuredClone(preset.values) : {}),
      enabled: layer.hidden !== true,
      preset: preset ? preset.id : null,
    };
    const values = (layer.values ?? {}) as Args;
    if (typeof values !== "object" || Array.isArray(values)) throw new ToolError(`layers[${i}].values must be an object`);
    for (const [k, v] of Object.entries(values)) {
      const control = schema.controls.find((c) => c.key === k);
      if (!control) {
        warnings.push(`${key}.${k} is not a setting of ${key}; ignored (valid: ${schema.controls.map((c) => c.key).join(", ")})`);
        continue;
      }
      section[k] = coerce(key, control, v, warnings);
    }
    if (layer.opacity !== undefined) {
      const o = Number(layer.opacity);
      if (!Number.isFinite(o)) throw new ToolError(`layers[${i}].opacity must be a number from 0 to 1`);
      section.layerOpacity = Math.min(1, Math.max(0, o));
    }
    if (layer.blend !== undefined) {
      const blend = BLEND_MODES.find((b) => b === String(layer.blend).toLowerCase());
      if (!blend) throw new ToolError(`layers[${i}].blend must be one of: ${BLEND_MODES.join(", ")}`);
      section.layerBlend = blend;
    }
    if (layer.motion !== undefined) {
      const motion = layer.motion as Args;
      if (!motion || typeof motion !== "object") throw new ToolError(`layers[${i}].motion must be an object`);
      const type = String(motion.type ?? "drift") as MotionType;
      if (!MOTIONS.includes(type)) throw new ToolError(`layers[${i}].motion.type must be one of: ${MOTIONS.join(", ")}`);
      section.motion = type;
      for (const [field, k, min, max] of [
        ["angle", "motionAngle", -180, 180],
        ["speed", "motionSpeed", -2, 2],
        ["distance", "motionDistance", 0, 1],
        ["scatter", "motionScatter", 0, 1],
      ] as const) {
        if (motion[field] === undefined) continue;
        const v = Number(motion[field]);
        if (!Number.isFinite(v)) throw new ToolError(`layers[${i}].motion.${field} must be a number`);
        section[k] = Math.min(max, Math.max(min, v));
      }
    }
    if (layer.tempo !== undefined) {
      const v = Number(layer.tempo);
      if (!Number.isFinite(v)) throw new ToolError(`layers[${i}].tempo must be a number from 0 to 3`);
      section.tempo = Math.min(3, Math.max(0, v));
    }
    if (layer.frozen_time !== undefined) {
      section.animated = false;
      section.frozenTime = Number(layer.frozen_time) || 0;
    }
    state.sections[key] = section;
    state.order.push(key);
  }
  if (state.order.every((k) => !state.sections[k].enabled)) warnings.push("Every layer is hidden, so the design renders empty");
  if (!state.order.some((k) => k === "gradient" && state.sections[k].enabled)) {
    warnings.push("There is no visible gradient layer; most effects transform what's below them, so the result may be dark");
  }
  return state;
}

async function shortLinkFor(design: string, ctx: ToolContext) {
  try {
    if (!(await allowRequest(`mcp:${ctx.caller}`))) return { error: "Too many links, try again in a minute" };
    return { url: `${SITE_URL}/s/${await createShortLink(design)}` };
  } catch {
    return { error: "Link service unavailable" };
  }
}

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * Same recipe as the studio's "Surprise me": a gradient preset at the bottom,
 * a few presets from other effects, fine grain on top.
 */
function randomState(args: Args, warnings: string[]): StudioState {
  const count = args.effects === undefined ? 1 + Math.floor(Math.random() * 3) : Number(args.effects);
  if (!Number.isInteger(count) || count < 1 || count > 5) throw new ToolError("effects must be a whole number from 1 to 5");

  let groups = GROUPS.filter((g) => !["gradient", "grain", "image"].includes(g.section));
  if (args.category !== undefined) {
    if (!CATEGORIES.includes(args.category as never)) throw new ToolError(`category must be one of: ${CATEGORIES.join(", ")}`);
    groups = groups.filter((g) => SCHEMA_BY_KEY[g.section].category === args.category);
    if (groups.length < count) warnings.push(`${args.category} has only ${groups.length} effects with presets; used them all`);
  }

  const chosen = [pick(GROUPS.find((g) => g.section === "gradient")!.presets)];
  for (const group of [...groups].sort(() => Math.random() - 0.5).slice(0, count)) chosen.push(pick(group.presets));
  chosen.push(GROUPS.find((g) => g.section === "grain")!.presets[0]);

  const state = emptyState(Math.round(Math.random() * 1000) / 10);
  for (const preset of chosen) {
    state.sections[preset.section] = {
      ...state.sections[preset.section],
      ...structuredClone(preset.values),
      enabled: true,
      preset: preset.id,
    };
    state.order = addLayer(state.order, preset.section);
  }
  if (args.colors !== undefined) {
    const control = SCHEMA_BY_KEY.gradient.controls.find((c) => c.key === "colors")!;
    state.sections.gradient.colors = coerce("gradient", control, args.colors, warnings);
  }
  return state;
}

const layerSchema = {
  type: "object",
  properties: {
    use: {
      type: "string",
      description: 'A preset id (e.g. "g-sunset", "gl-fluted") or an effect key (e.g. "grain") to start from defaults.',
    },
    values: {
      type: "object",
      description: "Settings to change, keyed by control key from get_effect. Colors are #rrggbb.",
      additionalProperties: true,
    },
    opacity: { type: "number", minimum: 0, maximum: 1, description: "Layer opacity, default 1." },
    blend: { type: "string", enum: BLEND_MODES, description: 'Blend over the layer below, default "normal".' },
    hidden: { type: "boolean", description: "Keep the layer in the stack but switched off." },
    frozen_time: { type: "number", description: "Hold this layer still at this time (seconds) while others animate." },
    motion: {
      type: "object",
      description:
        "Move this layer's pattern while the picture below stays put (e.g. glass flutes sliding across the image). Plays when the design animates.",
      properties: {
        type: { type: "string", enum: MOTIONS, description: "drift: steady slide; sway: back and forth; spin: rotate; orbit: circle; random: every patch wanders its own way." },
        angle: { type: "number", minimum: -180, maximum: 180, description: "Direction in degrees for drift and sway; 0 is right, 90 is up." },
        speed: { type: "number", minimum: -2, maximum: 2, description: "Negative runs it the other way. Default 0.5." },
        distance: { type: "number", minimum: 0, maximum: 1, description: "How far sway, orbit and random travel. Default 0.5." },
        scatter: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Random only: 0 moves big swirls together, 1 moves roughly every dot or character on its own. Default 0.6.",
        },
      },
      additionalProperties: false,
    },
    tempo: { type: "number", minimum: 0, maximum: 3, description: "Speed of the effect's own animation, default 1." },
  },
  required: ["use"],
  additionalProperties: false,
};

const designInput = {
  type: "string",
  description: "A studio link (https://imaginry.tech/studio#...), a short link (https://imaginry.tech/s/...) or a bare design string.",
};

export const TOOLS: Tool[] = [
  {
    name: "list_effects",
    title: "List effects",
    description:
      "Lists every effect Imaginry can stack, grouped by category, with a one-line description and its preset ids. Call get_effect for an effect's settings.",
    inputSchema: {
      type: "object",
      properties: { category: { type: "string", enum: [...CATEGORIES], description: "Only this category." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: ({ category }) => {
      if (category !== undefined && !CATEGORIES.includes(category as never)) {
        throw new ToolError(`category must be one of: ${CATEGORIES.join(", ")}`);
      }
      return {
        stacking: "Layers are listed top first. A gradient is usually the bottom layer; grain usually goes on top.",
        categories: CATEGORIES.filter((c) => !category || c === category).map((c) => ({
          category: c,
          effects: SCHEMA.filter((e) => e.category === c && BUILDABLE.includes(e.key)).map((e) => ({
            key: e.key,
            label: e.label,
            description: e.blurb,
            presets: (e.presets?.list ?? []).map((pr) => pr.id),
          })),
        })),
      };
    },
  },
  {
    name: "get_effect",
    title: "Get effect",
    description: "Full details for one effect: its settings with ranges and options, default values, and every preset with its values.",
    inputSchema: {
      type: "object",
      properties: { effect: { type: "string", description: 'Effect key from list_effects, e.g. "gradient".' } },
      required: ["effect"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: ({ effect }) => {
      const schema = SCHEMA_BY_KEY[String(effect) as SectionKey];
      if (!schema) throw new ToolError(`Unknown effect "${effect}". Valid keys: ${BUILDABLE.join(", ")}`);
      return {
        key: schema.key,
        label: schema.label,
        category: schema.category,
        description: schema.blurb,
        ...(schema.info ? { notes: schema.info } : {}),
        controls: schema.controls.map(describeControl),
        defaults: schema.defaults,
        presets: (schema.presets?.list ?? []).map((pr) => ({ id: pr.id, name: pr.name, values: pr.values })),
        ...(schema.controls.some((c) => c.type === "colors") ? { palettes: PALETTES } : {}),
      };
    },
  },
  {
    name: "list_looks",
    title: "List looks",
    description: "Premade designs from the Imaginry gallery, each with its layers and a studio link. Good starting points to remix.",
    inputSchema: {
      type: "object",
      properties: { tag: { type: "string", enum: [...GALLERY_TAGS], description: "Only looks with this mood." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: ({ tag }) => {
      if (tag !== undefined && !GALLERY_TAGS.includes(tag as never)) {
        throw new ToolError(`tag must be one of: ${GALLERY_TAGS.join(", ")}`);
      }
      return GALLERY.filter((look) => !tag || look.tags?.includes(tag as never)).map((look) => {
        const design = encodeShare(stateForLook(look));
        return {
          name: look.name,
          recipe: look.recipe,
          tags: look.tags ?? [],
          presets: look.presets,
          design,
          studio_url: studioUrl(design),
        };
      });
    },
  },
  {
    name: "create_design",
    title: "Create design",
    description:
      "Builds a generative background from a stack of layers (top first) and returns a link that opens it in the Imaginry studio, where it can be tweaked and exported as PNG, MP4/WebM or embed code. Start each layer from a preset id or an effect key, then override settings in values.",
    inputSchema: {
      type: "object",
      properties: {
        layers: {
          type: "array",
          items: layerSchema,
          minItems: 1,
          maxItems: 16,
          description: 'Top layer first, e.g. [{"use":"gr-fine"},{"use":"gl-fluted"},{"use":"g-sunset"}].',
        },
        seed: { type: "number", description: "Random seed for the procedural effects. Omit for a random one." },
        short_link: { type: "boolean", description: "Also make a short https://imaginry.tech/s/... link. Default false." },
      },
      required: ["layers"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    run: async (args, ctx) => {
      const warnings: string[] = [];
      const state = buildState(args, warnings);
      const design = encodeShare(state);
      return {
        studio_url: studioUrl(design),
        ...(args.short_link === true ? { short_link: await shortLinkFor(design, ctx) } : {}),
        design,
        ...describeState(state),
        ...(warnings.length ? { warnings } : {}),
      };
    },
  },
  {
    name: "random_design",
    title: "Random design",
    description:
      'A random generative background, like the studio\'s "Surprise me": a random gradient, a few random effects and fine grain. Returns a studio link and its layers, which can be edited and passed to create_design. Call again for a different one.',
    inputSchema: {
      type: "object",
      properties: {
        effects: { type: "integer", minimum: 1, maximum: 5, description: "How many effects between the gradient and grain. Default 1 to 3." },
        category: { type: "string", enum: [...CATEGORIES], description: "Only pick effects from this category." },
        colors: {
          type: "array",
          items: { type: "string" },
          maxItems: 5,
          description: "Keep the randomness but use these gradient colors (#rrggbb).",
        },
        short_link: { type: "boolean", description: "Also make a short https://imaginry.tech/s/... link. Default false." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    run: async (args, ctx) => {
      const warnings: string[] = [];
      const state = randomState(args, warnings);
      const design = encodeShare(state);
      return {
        studio_url: studioUrl(design),
        ...(args.short_link === true ? { short_link: await shortLinkFor(design, ctx) } : {}),
        design,
        ...describeState(state),
        ...(warnings.length ? { warnings } : {}),
      };
    },
  },
  {
    name: "read_design",
    title: "Read design",
    description: "Turns an Imaginry studio link, short link or design string back into its layers with every setting, so it can be edited and passed to create_design.",
    inputSchema: {
      type: "object",
      properties: { design: designInput },
      required: ["design"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async ({ design }) => {
      const state = await resolveDesign(design);
      const compact = encodeShare(state);
      return { studio_url: studioUrl(compact), design: compact, ...describeState(state) };
    },
  },
  {
    name: "render_png",
    title: "Render PNG",
    description:
      "Renders a design to a PNG. Returns a preview image you can look at, plus a download URL for the full-size PNG (up to 2048px on the long side). Takes a few seconds.",
    inputSchema: {
      type: "object",
      properties: {
        design: designInput,
        width: { type: "integer", minimum: 64, maximum: PNG_MAX_SIDE, description: "Pixels. Default 1600." },
        height: { type: "integer", minimum: 64, maximum: PNG_MAX_SIDE, description: "Pixels. Default 1000." },
        time: { type: "number", minimum: 0, description: "Which moment of the animation to capture, in seconds. Default 0." },
      },
      required: ["design"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, ctx) => {
      const state = await resolveDesign(args.design);
      const design = encodeShare(state);
      const size = fitSize(Number(args.width ?? 1600), Number(args.height ?? 1000));
      const time = Math.min(600, Math.max(0, Number(args.time) || 0));
      try {
        if (!(await allowRequest(`png:${ctx.caller}`, 12))) throw new ToolError("Too many renders, try again in a minute");
      } catch (e) {
        if (e instanceof ToolError) throw e;
      }
      // The preview keeps the shape but stays small enough to send inline.
      const scale = Math.min(1, PREVIEW_SIDE / Math.max(size.width, size.height));
      const preview = { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
      let png: Buffer;
      try {
        png = await renderPng(ctx.origin, design, preview, time);
      } catch (e) {
        console.error("[mcp] render_png", e instanceof Error ? e.message : e);
        throw new ToolError("The renderer is unavailable right now; open the studio link and export from there");
      }
      const query = new URLSearchParams({ d: design, w: String(size.width), h: String(size.height), ...(time ? { t: String(time) } : {}) });
      const info = {
        download_url: `${SITE_URL}/api/png?${query}`,
        width: size.width,
        height: size.height,
        preview_width: preview.width,
        preview_height: preview.height,
        studio_url: studioUrl(design),
      };
      return new ToolContent(
        [
          { type: "image", data: png.toString("base64"), mimeType: "image/png" },
          { type: "text", text: JSON.stringify(info, null, 2) },
        ],
        info,
      );
    },
  },
  {
    name: "get_embed_code",
    title: "Get embed code",
    description:
      "Self-contained code that renders a design live on a WebGL2 canvas, with no dependency on Imaginry: plain HTML or a React component. The canvas fills its parent box.",
    inputSchema: {
      type: "object",
      properties: {
        design: designInput,
        format: { type: "string", enum: ["html", "react"], description: 'Default "html".' },
        animate: { type: "boolean", description: "Animate the design. Default true; false renders a still frame." },
      },
      required: ["design"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async ({ design, format = "html", animate = true }) => {
      if (format !== "html" && format !== "react") throw new ToolError('format must be "html" or "react"');
      const state = await resolveDesign(design);
      const look = lookFor(state, 0);
      if (look.layers.length === 0) throw new ToolError("The design has no visible layers to embed");
      const on = animate !== false;
      return { format, code: format === "react" ? reactEmbed(look, on) : htmlEmbed(look, on) };
    },
  },
];

export const TOOLS_BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
