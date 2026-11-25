import { dodo, syncSubscription } from "@/lib/server/billing";

/**
 * Dodo Payments webhook. Point the endpoint at /api/billing/webhook in the
 * Dodo dashboard (Developer > Webhooks) and subscribe to the subscription.*
 * events. Every subscription event carries the full subscription, so each one
 * is written as a snapshot; replays and out-of-order retries are harmless.
 */
export async function POST(request: Request) {
  const body = await request.text();
  let event;
  try {
    event = dodo().webhooks.unwrap(body, {
      headers: {
        "webhook-id": request.headers.get("webhook-id") ?? "",
        "webhook-signature": request.headers.get("webhook-signature") ?? "",
        "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
      },
    });
  } catch {
    return Response.json({ error: "Bad signature" }, { status: 401 });
  }

  switch (event.type) {
    case "subscription.active":
    case "subscription.updated":
    case "subscription.renewed":
    case "subscription.plan_changed":
    case "subscription.past_due":
    case "subscription.on_hold":
    case "subscription.paused":
    case "subscription.unpaused":
    case "subscription.cancelled":
    case "subscription.failed":
    case "subscription.expired":
    case "subscription.update_payment_method":
      // A thrown error returns 500 so Dodo retries.
      await syncSubscription(event.data);
  }
  return Response.json({ received: true });
}
