/**
 * Gives an account Pro without a Dodo payment (a comp), by writing a
 * subscription row that billingOf() reads as active. Safe to re-run: it
 * updates the same "manual_<user id>" row.
 *
 *   node --env-file-if-exists=.env.local scripts/grant-pro.ts <email> [monthly|yearly]
 *
 * Nothing expires the row on its own: next_billing_date is shown as the
 * renewal date, but Pro stays on until the row's status is changed.
 * To revoke: update subscription set status = 'cancelled' where subscription_id = 'manual_<user id>';
 */
import pg from "pg";

const [email, cycle = "yearly"] = process.argv.slice(2);
if (!email || (cycle !== "monthly" && cycle !== "yearly")) {
  console.error("Usage: grant-pro.ts <email> [monthly|yearly]");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DB_URL });
try {
  const { rows } = await pool.query<{ id: string }>(`select id from "user" where lower(email) = lower($1) limit 1`, [email]);
  const userId = rows[0]?.id;
  if (!userId) throw new Error(`No account with email ${email}. They need to sign in once first.`);

  const productId =
    (cycle === "yearly" ? process.env.DODO_PRO_YEARLY_PRODUCT_ID : process.env.DODO_PRO_MONTHLY_PRODUCT_ID) ?? "manual";
  const interval = cycle === "yearly" ? "1 year" : "1 month";

  const { rows: out } = await pool.query(
    `insert into subscription
       (subscription_id, user_id, customer_id, product_id, cycle, status, next_billing_date, cancel_at_period_end, updated_at)
     values ($1, $2, 'manual', $3, $4, 'active', now() + $5::interval, false, now())
     on conflict (subscription_id) do update set
       product_id = excluded.product_id,
       cycle = excluded.cycle,
       status = 'active',
       next_billing_date = excluded.next_billing_date,
       cancel_at_period_end = false,
       updated_at = now()
     returning subscription_id, cycle, status, next_billing_date`,
    [`manual_${userId}`, userId, productId, cycle, interval],
  );
  console.log(`Pro (${cycle}) granted to ${email}:`, out[0]);
} finally {
  await pool.end();
}
