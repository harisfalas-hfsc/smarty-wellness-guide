import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function rowFrom(subscription: any) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  return {
    stripe_subscription_id: subscription.id as string,
    stripe_customer_id: (typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id) as string,
    product_id: (productId ?? "") as string,
    price_id: (priceId ?? "") as string,
    status: subscription.status as string,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: !!(subscription.cancel_at_period_end || subscription.cancel_at),
    updated_at: new Date().toISOString(),
  };
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  const db = await admin();
  if (!userId) {
    // Fall back to update-only when metadata is missing.
    await db.from("subscriptions").update(rowFrom(subscription)).eq("stripe_subscription_id", subscription.id).eq("environment", env);
    return;
  }
  const { error } = await db.from("subscriptions").upsert(
    { ...rowFrom(subscription), user_id: userId, environment: env },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw new Error(error.message);
}

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const db = await admin();
  // Idempotency: skip events already processed.
  const { error: dup } = await db.from("stripe_webhook_events").insert({ id: event.id, type: event.type, environment: env });
  if (dup) {
    if (dup.code === "23505") return;
    throw new Error(dup.message);
  }
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await db.from("subscriptions")
          .update({ ...rowFrom(event.data.object), status: "canceled" })
          .eq("stripe_subscription_id", event.data.object.id).eq("environment", env);
        break;
      case "invoice.payment_failed":
        console.warn("Membership payment failed", event.data.object.id);
        break;
      default:
        break;
    }
  } catch (e) {
    // Allow Stripe to retry this event.
    await db.from("stripe_webhook_events").delete().eq("id", event.id);
    throw e;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handle(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
