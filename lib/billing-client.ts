"use client";

import { authClient } from "@/lib/auth-client";
import { checkoutHref, type Cycle } from "@/lib/pricing";

/** Mirrors lib/server/billing's Billing. */
export type Billing = {
  plan: "free" | "pro";
  cycle: Cycle | null;
  status: string | null;
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
};

export type Invoice = {
  id: string;
  date: string;
  /** In the currency's smallest unit. */
  amount: number;
  currency: string;
  status: string;
  url: string;
};

export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await fetch("/api/billing/invoices", { cache: "no-store" });
  if (!res.ok) throw new Error("invoices");
  return (await res.json()).invoices;
}

export async function fetchBilling(): Promise<Billing> {
  const res = await fetch("/api/billing", { cache: "no-store" });
  if (!res.ok) throw new Error("billing");
  return (await res.json()).billing;
}

/**
 * Sends the browser to Dodo checkout for Pro. Signed out, it signs in with
 * Google first and comes back through the checkout route. `from` is the path
 * checkout's Back returns to. Resolves with an error message only when it
 * couldn't leave the page.
 */
export async function startCheckout(cycle: Cycle, from: string): Promise<string | null> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cycle, from }),
  }).catch(() => null);
  if (res?.status === 401) {
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: checkoutHref(cycle, from) });
    return error ? "Couldn't open Google sign-in. Try again." : null;
  }
  const data = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (data?.url) {
    window.location.assign(data.url);
    return null;
  }
  return data?.error ?? "Couldn't open checkout. Try again.";
}
