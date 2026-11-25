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

export type Plan = "free" | "pro";
export type ExportKind = "image" | "video";

/**
 * What each plan may export. The single source for the studio's export panel
 * (which locks what a plan can't use) and the server (lib/server/exports, which
 * refuses it). Sizes are the long side in pixels; exports are counted over a
 * rolling 24 hours, null meaning unlimited.
 */
export const PLAN_LIMITS = {
  free: { exportsPerDay: 10, longSide: { image: 1080, video: 1280 }, embed: false },
  pro: { exportsPerDay: null, longSide: { image: 3840, video: 3840 }, embed: true },
} as const satisfies Record<
  Plan,
  { exportsPerDay: number | null; longSide: Record<ExportKind, number>; embed: boolean }
>;

export const FREE_LIMITS = PLAN_LIMITS.free;

/** Whether `plan` may export a `kind` at width × height. */
export const sizeAllowed = (plan: Plan, kind: ExportKind, width: number, height: number) =>
  Math.max(width, height) <= PLAN_LIMITS[plan].longSide[kind];

/** Starts a Dodo checkout for Pro (app/api/billing/checkout); redirects once signed in. */
export const checkoutHref = (cycle: Cycle, from = "/#pricing") =>
  `/api/billing/checkout?cycle=${cycle}&from=${encodeURIComponent(from)}`;

export { EFFECT_COUNT };

export type Feature = { text: string; off?: boolean };

export const FREE_FEATURES: Feature[] = [
  { text: `${FREE_LIMITS.exportsPerDay} exports a day with a free account` },
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
