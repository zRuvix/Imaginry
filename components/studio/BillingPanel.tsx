"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Check } from "@/components/icons";
import { fetchBilling, fetchInvoices, startCheckout, type Billing, type Invoice } from "@/lib/billing-client";
import { FREE_LIMITS, PRO_FEATURES, PRO_PRICE, YEARLY_SAVING, yearTotal, type Cycle } from "@/lib/pricing";

const money = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

/** The panel's main action: solid bone, like the reference's dark pill on light. */
const SOLID =
  "press flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-bone px-4 text-[13px] font-semibold text-[#141210] hover:bg-white disabled:cursor-wait disabled:opacity-60";
const SOFT =
  "press flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-bone/85 hover:bg-white/[0.14] hover:text-bone";

/** Where checkout's Back returns: the studio, with this panel open on Plan & billing. */
export const BILLING_RETURN = "/studio?account=billing";

/** Polls a few times after checkout, since the webhook can land a moment after the redirect. */
const WAIT_TRIES = 6;
const WAIT_MS = 2000;

/**
 * The account panel's Plan & billing section: the current plan, when it
 * renews or ends, a way into Dodo's portal (card, invoices, cancel), and
 * checkout for Free accounts.
 */
export default function BillingPanel({ justUpgraded = false }: { justUpgraded?: boolean }) {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(justUpgraded);

  useEffect(() => {
    let live = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const load = () =>
      fetchBilling()
        .then((b) => {
          if (!live) return;
          setBilling(b);
          if (justUpgraded && b.plan !== "pro" && ++tries < WAIT_TRIES) timer = setTimeout(load, WAIT_MS);
          else setWaiting(false);
        })
        .catch(() => {
          if (!live) return;
          setError("Couldn’t load your billing.");
          setWaiting(false);
        });
    load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [justUpgraded]);

  if (error) return <p className="frost-well rounded-[18px] p-5 text-[13px] text-[#ff6b70]">{error}</p>;
  if (!billing || (waiting && billing.plan !== "pro"))
    return (
      <div className="space-y-3">
        <div className="skeleton h-[96px] rounded-[18px]" />
        {waiting && <p className="text-[12.5px] text-bone/55">Confirming your payment with Dodo…</p>}
      </div>
    );

  return billing.plan === "pro" ? <ProPlan billing={billing} welcome={justUpgraded} /> : <FreePlan billing={billing} />;
}

/** "Current plan" card: label, plan name, an action on the right. */
function CurrentPlan({ name, badge, action }: { name: string; badge?: ReactNode; action: ReactNode }) {
  return (
    <div className="frost-well flex items-center gap-4 rounded-[18px] p-5">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-bone/50">Current plan</p>
        <p className="mt-1 flex items-center gap-2.5 text-[20px] leading-tight">
          {name}
          {badge}
        </p>
      </div>
      {action}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 text-[13px]">
      <dt className="text-bone/50">{label}</dt>
      <dd className="text-right text-bone/90">{children}</dd>
    </div>
  );
}

function Features() {
  return (
    <ul className="space-y-2.5">
      {PRO_FEATURES.slice(0, 4).map((f) => (
        <li key={f.text} className="flex items-center gap-2.5 text-[13px] text-bone/80">
          <Check size={14} className="shrink-0 text-bone/60" />
          {f.text}
        </li>
      ))}
    </ul>
  );
}

function ProPlan({ billing, welcome }: { billing: Billing; welcome: boolean }) {
  const cycle = billing.cycle ?? "monthly";
  const pastDue = billing.status === "past_due";
  const when = billing.renewsAt ? date(billing.renewsAt) : null;

  return (
    <div className="space-y-5">
      {welcome && (
        <p className="anim-pop flex items-center gap-2 rounded-[14px] bg-white/[0.08] px-4 py-3 text-[13px] text-bone">
          <Check size={15} /> You’re on Pro. Thanks for backing the studio.
        </p>
      )}

      <CurrentPlan
        name="Pro"
        badge={<StatusPill billing={billing} />}
        action={
          // A plain link: the route redirects to a one-off portal URL.
          <a href="/api/billing/portal" className={SOLID}>
            {pastDue ? "Update card" : "Manage billing"}
          </a>
        }
      />

      {pastDue && (
        <p className="rounded-[14px] bg-[#e5484d]/15 px-4 py-3 text-[12.5px] leading-relaxed text-bone/85">
          Your last payment didn’t go through. Update your card to keep Pro.
        </p>
      )}

      <dl className="divide-y divide-white/[0.07] px-1">
        <Row label="Billing">{cycle === "yearly" ? "Yearly" : "Monthly"}</Row>
        <Row label="Price">
          ${money(cycle === "yearly" ? yearTotal("yearly") : PRO_PRICE.monthly)} {cycle === "yearly" ? "a year" : "a month"}
        </Row>
        {when && <Row label={billing.cancelAtPeriodEnd ? "Ends on" : "Renews on"}>{when}</Row>}
      </dl>

      <div className="px-1">
        <p className="mb-3 text-[12px] text-bone/50">Included</p>
        <Features />
      </div>

      <Invoices />

      <p className="px-1 text-[12px] leading-relaxed text-bone/40">Card changes and cancelling are handled by Dodo Payments.</p>
    </div>
  );
}

function FreePlan({ billing }: { billing: Billing }) {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lapsed = billing.status && billing.status !== "pending";

  const upgrade = async () => {
    setBusy(true);
    setError(null);
    const failed = await startCheckout(cycle, BILLING_RETURN);
    if (failed) {
      setError(failed);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <CurrentPlan
        name="Free"
        badge={lapsed ? <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] text-bone/70">Pro {billing.status}</span> : null}
        action={
          <button type="button" onClick={upgrade} disabled={busy} className={SOLID}>
            {busy ? "Opening…" : "Upgrade to Pro"}
          </button>
        }
      />
      {error && (
        <p role="alert" className="-mt-2 px-1 text-[12px] text-[#ff9c8a]">
          {error}
        </p>
      )}

      <p className="px-1 text-[12.5px] leading-relaxed text-bone/50">
        {FREE_LIMITS.exportsPerWeek} exports a week, images up to 1080px and video up to 720p.
      </p>

      <div className="rounded-[18px] border border-white/[0.07] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px]">Pro</p>
          <div role="radiogroup" aria-label="Billing" className="flex gap-0.5 rounded-full bg-black/25 p-0.5">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cycle === c}
                onClick={() => setCycle(c)}
                className={`press h-7 rounded-full px-3 text-[12px] capitalize transition-colors ${
                  cycle === c ? "bg-white/[0.16] text-bone" : "text-bone/55 hover:text-bone"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[28px] leading-none">${money(PRO_PRICE[cycle])}</span>
          <span className="text-[12.5px] text-bone/55">a month</span>
        </p>
        <p className="mt-1.5 text-[12px] text-bone/45">
          {cycle === "yearly" ? `Billed $${money(yearTotal("yearly"))} a year, save ${YEARLY_SAVING}%` : "Billed monthly, cancel anytime"}
        </p>
        <div className="mt-4 border-t border-white/[0.07] pt-4">
          <Features />
        </div>
      </div>

      {billing.hasCustomer && <Invoices />}
    </div>
  );
}

const amountOf = (i: Invoice) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: i.currency }).format(i.amount / 100);
  } catch {
    return `${(i.amount / 100).toFixed(2)} ${i.currency}`;
  }
};
const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const STATUS: Record<string, { label: string; tone: string }> = {
  succeeded: { label: "Paid", tone: "text-[#4cc38a]" },
  failed: { label: "Failed", tone: "text-[#ff6b70]" },
  refunded: { label: "Refunded", tone: "text-bone/50" },
};

/** Subscription payments, newest first, each opening its invoice PDF. */
function Invoices() {
  const [items, setItems] = useState<Invoice[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    fetchInvoices()
      .then((v) => live && setItems(v))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="px-1">
      <p className="mb-2 text-[12px] text-bone/50">Invoices</p>
      {error ? (
        <p className="py-3 text-[12.5px] text-bone/45">
          Couldn’t load invoices.{" "}
          <a href="/api/billing/portal" className="underline underline-offset-2 hover:text-bone">
            Open them on Dodo
          </a>
          .
        </p>
      ) : !items ? (
        <div className="space-y-2">
          <div className="skeleton h-11 rounded-[12px]" />
          <div className="skeleton h-11 rounded-[12px]" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-3 text-[12.5px] text-bone/45">No payments yet.</p>
      ) : (
        <ul className="divide-y divide-white/[0.07]">
          {items.map((i) => {
            const st = STATUS[i.status] ?? { label: i.status, tone: "text-bone/50" };
            return (
              <li key={i.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                <span className="w-[104px] shrink-0 text-bone/80">{shortDate(i.date)}</span>
                <span className="min-w-0 flex-1 tabular-nums text-bone/90">{amountOf(i)}</span>
                <span className={`shrink-0 text-[12px] ${st.tone}`}>{st.label}</span>
                <a
                  href={i.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12px] text-bone/80 hover:bg-white/[0.14] hover:text-bone"
                >
                  PDF <ArrowUpRight size={11} />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ billing }: { billing: Billing }) {
  const pastDue = billing.status === "past_due";
  const ending = billing.cancelAtPeriodEnd;
  const label = pastDue ? "Payment due" : ending ? "Ending" : "Active";
  const tone = pastDue ? "bg-[#ff6b70]" : ending ? "bg-[#f5b544]" : "bg-[#4cc38a]";
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11.5px] text-bone/80">
      <span className={`size-1.5 rounded-full ${tone}`} />
      {label}
    </span>
  );
}
