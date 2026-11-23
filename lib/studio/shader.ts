import { EFFECTS } from "./effects";
import { COMMON_HEAD, VERTEX_SHADER } from "./effects/common";
import type { SectionKey } from "./schema";

export { VERTEX_SHADER };

/**
 * One small fragment shader per effect: the shared header plus the effect's
 * own uniforms and main(). The renderer draws visible layers bottom to top,
 * each reading the layer below from `uInput`.
 */
export const LAYER_SHADERS = Object.fromEntries(
  EFFECTS.map((e) => [e.key, `${COMMON_HEAD}\n${withMotion(e.glsl)}\n`]),
) as Record<SectionKey, string>;

/**
 * Routes an effect's pixel position and its reads of the layer below through
 * the layer-motion helpers in the header, so any effect can drift, sway, spin
 * or orbit without its own code knowing about it.
 */
function withMotion(glsl: string) {
  return glsl.replace(/\bgl_FragCoord\b/g, "motionFC()").replace(/\btexture\(\s*uInput\s*,/g, "inputTex(");
}
