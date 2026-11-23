/** Press feedback for inactive options in the landing page selectors. */
export const BTN_MOTION =
  "cursor-pointer active:translate-y-px motion-safe:transition-transform motion-safe:duration-100";

/** A linked card: lifts 2px on a fine pointer (180ms in), nothing else moves. */
export const CARD_MOTION =
  "transition-transform duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-0.5";

/** A photograph inside a linked frame: zooms to 1.03 over 600ms, the frame never grows. */
export const ZOOM_MOTION =
  "transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03]";
