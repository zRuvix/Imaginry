import type { DragEvent } from "react";

/** Drag payload type for a preset dragged out of the library. */
export const PRESET_MIME = "application/x-imaginry-preset";

export const isPresetDrag = (e: DragEvent) => e.dataTransfer.types.includes(PRESET_MIME);
