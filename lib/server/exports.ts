import "server-only";
import { FREE_LIMITS } from "@/lib/pricing";
import { pool } from "./auth-options";
import { isPro } from "./billing";
import { recordEvent } from "./events";

/** File exports that count toward the Free plan's daily allowance. */
export const QUOTA_KINDS = ["export_png", "export_video"] as const;
export type QuotaKind = (typeof QUOTA_KINDS)[number];
export const isQuotaKind = (k: unknown): k is QuotaKind => QUOTA_KINDS.includes(k as QuotaKind);

export type ExportQuota = {
  plan: "free" | "pro";
  /** Exports left in the rolling window; null on Pro (unlimited). */
  remaining: number | null;
  /** When the oldest counted export drops out of the window, so one frees up. */
  resetsAt: string | null;
};

async function freeQuota(userId: string): Promise<ExportQuota> {
  const { rows } = await pool().query<{ n: number; oldest: Date | null }>(
    `select count(*)::int as n, min(at) as oldest from event
      where user_id = $1 and kind = any($2) and at > now() - interval '1 day'`,
    [userId, QUOTA_KINDS],
  );
  const used = rows[0]?.n ?? 0;
  const oldest = rows[0]?.oldest;
  return {
    plan: "free",
    remaining: Math.max(0, FREE_LIMITS.exportsPerDay - used),
    resetsAt: oldest ? new Date(oldest.getTime() + 864e5).toISOString() : null,
  };
}

export async function quotaOf(userId: string): Promise<ExportQuota> {
  if (await isPro(userId)) return { plan: "pro", remaining: null, resetsAt: null };
  return freeQuota(userId);
}

/**
 * Uses one export. On Free it refuses once the day's allowance is spent and
 * refuses sizes above the Free caps. The event row it writes is both the
 * usage record for the admin dashboard and the quota counter.
 */
export async function claimExport(
  userId: string,
  kind: QuotaKind,
  opts: { request: Request; width: number; height: number; preview: boolean; meta?: unknown },
): Promise<{ ok: true; quota: ExportQuota } | { ok: false; error: string; quota: ExportQuota }> {
  let quota = await quotaOf(userId);
  if (quota.plan === "free") {
    const cap = kind === "export_png" ? FREE_LIMITS.imageLongSide : FREE_LIMITS.videoLongSide;
    if (!opts.preview && Math.max(opts.width, opts.height) > cap) {
      return { ok: false, error: "That size needs Pro", quota };
    }
    if ((quota.remaining ?? 0) <= 0) {
      return { ok: false, error: "Today's free export is used. Upgrade to Pro for unlimited exports.", quota };
    }
  }
  await recordEvent(kind, { request: opts.request, userId, meta: opts.meta });
  if (quota.plan === "free") quota = await freeQuota(userId);
  return { ok: true, quota };
}
