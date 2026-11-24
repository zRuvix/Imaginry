import { EFFECT_COUNT } from "./studio/effects";

/**
 * Plans for the studio. The export panel's size tiers live in
 * components/studio/ExportPanel.tsx; keep the limits here in step with them.
 */

export type Cycle = "monthly" | "yearly";

/** Pro, per month, by billing cycle (USD). */
export const PRO_PRICE: Record<Cycle, number> = { monthly: 8.99, yearly: 6.5 };

/** What a year of Pro costs on each cycle. */
export const yearTotal = (c: Cycle) => Math.round(PRO_PRICE[c] * 12 * 100) / 100;

/** Percent saved per month by paying yearly. */
export const YEARLY_SAVING = Math.round((1 - PRO_PRICE.yearly / PRO_PRICE.monthly) * 100);

export const FREE_LIMITS = { exportsPerWeek: 3 } as const;

/** Where "Get Pro" leads. Checkout isn't wired yet; point this at it when it is. */
export const PRO_HREF = "/studio?plan=pro";

export { EFFECT_COUNT };

export type Feature = { text: string; off?: boolean };

export const FREE_FEATURES: Feature[] = [
  { text: `${FREE_LIMITS.exportsPerWeek} exports a week with a free account` },
  { text: "Images at preview or Small, 1080px" },
  { text: "Video at preview or 720p" },
  { text: `All ${EFFECT_COUNT} effects, plus Surprise me` },
  { text: "Embed as code", off: true },
];

export const PRO_FEATURES: Feature[] = [
  { text: "Unlimited exports" },
  { text: "Images up to 4K, 3840px" },
  { text: "Video up to 4K" },
  { text: "Embed as code for Framer, React and HTML" },
  { text: "Everything in Free" },
];
