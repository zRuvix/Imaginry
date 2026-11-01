import { EFFECTS } from "./effects";
import { COMMON_HEAD, VERTEX_SHADER } from "./effects/common";
import type { SectionKey } from "./schema";

export { VERTEX_SHADER };

/**
 * One small fragment shader per effect: the shared header plus the effect's
 * own uniforms and main(). The renderer draws visible layers bottom to top,
 * each reading the layer below from `uInput`.
 */
export const LAYER_SHADERS = Object.fromEntries(EFFECTS.map((e) => [e.key, `${COMMON_HEAD}\n${e.glsl}\n`])) as Record<
  SectionKey,
  string
>;
