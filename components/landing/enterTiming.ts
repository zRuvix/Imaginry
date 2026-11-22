/**
 * Hero entrance timings (tasteskill motion spec), shared by the server-rendered
 * hero and the client entrance components.
 */
export const EASE_ENTER = [0.22, 1, 0.36, 1] as const;
export const LINE_GAP = 0.08;
export const LINE_DUR = 0.7;

/** When the copy after a headline of `lines` lines starts: the last line half way up. */
export const afterLines = (lines: number) => (lines - 1) * LINE_GAP + LINE_DUR / 2;
