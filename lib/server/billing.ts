import "server-only";
import DodoPayments from "dodopayments";
import type { Subscription } from "dodopayments/resources/subscriptions";
import type { Cycle } from "@/lib/pricing";
import { pool } from "./auth-options";

/**
 * Pro subscriptions through Dodo Payments.
 *
 * Checkout tags the session with the user's id (metadata.user_id); the webhook
 * (app/api/billing/webhook) writes every subscription change into the
 * `subscription` table, and isPro() reads that table. Dodo stays the source
 * of truth: nothing here grants Pro without a webhook saying so.
 *
 * Env:
 *   DODO_PAYMENTS_API_KEY        API key (test keys start with dodo_test_)
 *   DODO_PAYMENTS_WEBHOOK_KEY    the webhook endpoint's signing secret
 *   DODO_PAYMENTS_ENVIRONMENT    "test_mode" or "live_mode" (default test_mode)
 *   DODO_PRO_MONTHLY_PRODUCT_ID  subscription product billed monthly
 *   DODO_PRO_YEARLY_PRODUCT_ID   subscription product billed yearly
 */

const globalForDodo = globalThis as unknown as { dodo?: DodoPayments };

export function dodo() {
  globalForDodo.dodo ??= new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });
  return globalForDodo.dodo;
}

const productFor = (cycle: Cycle) =>
  cycle === "yearly" ? process.env.DODO_PRO_YEARLY_PRODUCT_ID : process.env.DODO_PRO_MONTHLY_PRODUCT_ID;

const cycleOf = (productId: string): Cycle | null =>
  productId === process.env.DODO_PRO_YEARLY_PRODUCT_ID
    ? "yearly"
    : productId === process.env.DODO_PRO_MONTHLY_PRODUCT_ID
      ? "monthly"
      : null;

export const isCycle = (v: unknown): v is Cycle => v === "monthly" || v === "yearly";

/** Statuses that keep Pro on. past_due is Dodo's grace period after a failed renewal. */
const PRO_STATUSES = ["active", "past_due"];

type BillingUser = { id: string; email: string; name?: string | null };

/** A fresh hosted checkout for Pro on the given cycle. Returns its URL. */
export async function createCheckout(user: BillingUser, cycle: Cycle, origin: string) {
  const productId = productFor(cycle);
  if (!productId) throw new Error(`DODO_PRO_${cycle.toUpperCase()}_PRODUCT_ID is not set`);
  const existing = await customerIdOf(user.id);
  const session = await dodo().checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: existing ? { customer_id: existing } : { email: user.email, name: user.name || user.email },
    return_url: `${origin}/studio?upgraded=1`,
    cancel_url: `${origin}/#pricing`,
    metadata: { user_id: user.id, cycle },
  });
  if (!session.checkout_url) throw new Error("Dodo returned no checkout URL");
  return session.checkout_url;
}

/** Writes a subscription snapshot from a webhook. Safe to replay. */
export async function syncSubscription(sub: Subscription) {
  const userId = await userIdFor(sub);
  if (!userId) {
    console.warn(`[billing] subscription ${sub.subscription_id} has no matching user`);
    return;
  }
  await pool().query(
    `insert into subscription
       (subscription_id, user_id, customer_id, product_id, cycle, status, next_billing_date, cancel_at_period_end, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (subscription_id) do update set
       user_id = excluded.user_id,
       customer_id = excluded.customer_id,
       product_id = excluded.product_id,
       cycle = excluded.cycle,
       status = excluded.status,
       next_billing_date = excluded.next_billing_date,
       cancel_at_period_end = excluded.cancel_at_period_end,
       updated_at = now()`,
    [
      sub.subscription_id,
      userId,
      sub.customer.customer_id,
      sub.product_id,
      cycleOf(sub.product_id),
      sub.status,
      sub.next_billing_date || null,
      sub.cancel_at_next_billing_date,
    ],
  );
}

/** metadata.user_id from checkout, else the account with the customer's email. */
async function userIdFor(sub: Subscription) {
  const fromMeta = sub.metadata?.user_id;
  if (fromMeta) {
    const { rowCount } = await pool().query(`select 1 from "user" where id = $1`, [fromMeta]);
    if (rowCount) return fromMeta;
  }
  const { rows } = await pool().query<{ id: string }>(`select id from "user" where lower(email) = lower($1) limit 1`, [
    sub.customer.email,
  ]);
  return rows[0]?.id ?? null;
}

async function customerIdOf(userId: string) {
  const { rows } = await pool().query<{ customer_id: string }>(
    `select customer_id from subscription where user_id = $1 order by updated_at desc limit 1`,
    [userId],
  );
  return rows[0]?.customer_id ?? null;
}

export type Billing = {
  plan: "free" | "pro";
  cycle: Cycle | null;
  status: string | null;
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  /** True once they've had a subscription, so the billing portal has something to show. */
  hasCustomer: boolean;
};

/** The user's plan, from their latest subscription. */
export async function billingOf(userId: string): Promise<Billing> {
  const { rows } = await pool().query<{
    cycle: Cycle | null;
    status: string;
    next_billing_date: Date | null;
    cancel_at_period_end: boolean;
  }>(
    `select cycle, status, next_billing_date, cancel_at_period_end from subscription
      where user_id = $1
      order by (status = any($2)) desc, updated_at desc
      limit 1`,
    [userId, PRO_STATUSES],
  );
  const s = rows[0];
  if (!s) return { plan: "free", cycle: null, status: null, renewsAt: null, cancelAtPeriodEnd: false, hasCustomer: false };
  return {
    plan: PRO_STATUSES.includes(s.status) ? "pro" : "free",
    cycle: s.cycle,
    status: s.status,
    renewsAt: s.next_billing_date?.toISOString() ?? null,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    hasCustomer: true,
  };
}

export async function isPro(userId: string) {
  return (await billingOf(userId)).plan === "pro";
}

/** A one-off link to Dodo's customer portal (cancel, change card, invoices), or null with no customer yet. */
export async function portalLink(userId: string) {
  const customerId = await customerIdOf(userId);
  if (!customerId) return null;
  const { link } = await dodo().customers.customerPortal.create(customerId);
  return link;
}
