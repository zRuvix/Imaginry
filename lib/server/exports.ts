import "server-only";
import type { PoolClient } from "pg";
import { PLAN_LIMITS, sizeAllowed, type ExportKind, type Plan } from "@/lib/pricing";
import { pool } from "./auth-options";
import { billingOf } from "./billing";
import { cleanMeta, visitorKey } from "./events";

/** File exports, by the event kind that records them. They count toward the daily allowance. */
export const QUOTA_KINDS = { export_png: "image", export_video: "video" } as const satisfies Record<string, ExportKind>;
export type QuotaKind = keyof typeof QUOTA_KINDS;
export const isQuotaKind = (k: unknown): k is QuotaKind => typeof k === "string" && k in QUOTA_KINDS;

export type ExportQuota = {
  plan: Plan;
  /** Exports left in the rolling 24 hours; null when the plan is unlimited. */
  remaining: number | null;
  /** When the oldest counted export leaves the window, so one frees up. */
  resetsAt: string | null;
};

async function countQuota(db: Pick<PoolClient, "query">, userId: string, plan: Plan): Promise<ExportQuota> {
  const perDay = PLAN_LIMITS[plan].exportsPerDay;
  if (perDay === null) return { plan, remaining: null, resetsAt: null };
  const { rows } = await db.query<{ n: number; oldest: Date | null }>(
    `select count(*)::int as n, min(at) as oldest from event
      where user_id = $1 and kind = any($2) and at > now() - interval '1 day'`,
    [userId, Object.keys(QUOTA_KINDS)],
  );
  const oldest = rows[0]?.oldest;
  return {
    plan,
    remaining: Math.max(0, perDay - (rows[0]?.n ?? 0)),
    resetsAt: oldest ? new Date(oldest.getTime() + 864e5).toISOString() : null,
  };
}

export async function quotaOf(userId: string): Promise<ExportQuota> {
  return countQuota(pool(), userId, (await billingOf(userId)).plan);
}

export type Claim = { ok: true; quota: ExportQuota } | { ok: false; error: string; quota: ExportQuota };

/**
 * Uses one export, or refuses it when the user's plan doesn't allow the size
 * or the day's allowance is spent. The count and the insert run under a
 * per-user lock, so parallel requests can't both take the last export. The
 * event row is both the usage record for the admin dashboard and the counter.
 */
export async function claimExport(
  userId: string,
  kind: QuotaKind,
  opts: { request: Request; width: number; height: number; meta?: unknown },
): Promise<Claim> {
  const { plan } = await billingOf(userId);
  const db = await pool().connect();
  try {
    await db.query("begin");
    await db.query("select pg_advisory_xact_lock(hashtext($1))", [`export:${userId}`]);
    const quota = await countQuota(db, userId, plan);
    const refuse = (error: string): Claim => ({ ok: false, error, quota });

    if (!sizeAllowed(plan, QUOTA_KINDS[kind], opts.width, opts.height)) {
      await db.query("rollback");
      return refuse(plan === "free" ? "That size is on Pro" : "That size is too large");
    }
    if (quota.remaining !== null && quota.remaining <= 0) {
      await db.query("rollback");
      return refuse("Today's free export is used. Pro has unlimited exports.");
    }

    await db.query(`insert into event (kind, user_id, visitor, meta) values ($1, $2, $3, $4)`, [
      kind,
      userId,
      visitorKey(opts.request),
      JSON.stringify(cleanMeta(opts.meta)),
    ]);
    const after = await countQuota(db, userId, plan);
    await db.query("commit");
    return { ok: true, quota: after };
  } catch (e) {
    await db.query("rollback").catch(() => {});
    throw e;
  } finally {
    db.release();
  }
}
