/**
 * The one button motion (tasteskill spec): on a fine pointer the button steps
 * up 1px over 150ms; a press sinks it 1px below rest and scales .985 in 90ms.
 * Transform and colour only; one UI ease, no overshoot.
 */
export const BTN_MOTION =
  "cursor-pointer transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px active:translate-y-px active:scale-[0.985] active:duration-[90ms]";

/** A linked card: lifts 2px on a fine pointer (180ms in), nothing else moves. */
export const CARD_MOTION =
  "transition-transform duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-0.5";

/** A photograph inside a linked frame: zooms to 1.03 over 600ms, the frame never grows. */
export const ZOOM_MOTION =
  "transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03]";
