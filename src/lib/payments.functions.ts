import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

const validEnv = (e: unknown): StripeEnv => {
  if (e !== "sandbox" && e !== "live") throw new Error("Invalid environment");
  return e;
};

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId?: string | undefined },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    const f = found.data[0]; if (f) return f.id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.['userId'] !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return { ...data, environment: validEnv(data.environment) };
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const { userId, supabase } = context;
      const { data: active } = await supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: data.environment });
      if (active) return { error: "You already have an active membership." };
      const { data: u } = await supabase.auth.getUser();
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0];
      if (!price) throw new Error("Price not found");
      // EU consumer prices are shown VAT-inclusive (€19.99 is the total the member pays).
      if (price.tax_behavior === "unspecified" || price.tax_behavior == null) {
        await stripe.prices.update(price.id, { tax_behavior: "inclusive" });
      }
      const customerId = await resolveOrCreateCustomer(stripe, { email: u.user?.email ?? undefined, userId });
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        allow_promotion_codes: true,
        managed_payments: { enabled: true },
        metadata: { userId, managed_payments: "true" },
        subscription_data: { metadata: { userId } },
      } as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => ({ ...data, environment: validEnv(data.environment) }))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No membership found." };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: data.returnUrl });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export type InvoiceRow = { id: string; status: string | null; amount: number; currency: string; created: string | null; url: string | null };

export const getPaymentHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => ({ environment: validEnv(data.environment) }))
  .handler(async ({ data, context }): Promise<{ invoices: InvoiceRow[] } | { error: string }> => {
    const { data: subs } = await context.supabase
      .from("subscriptions").select("stripe_customer_id")
      .eq("user_id", context.userId).eq("environment", data.environment);
    const ids = [...new Set((subs ?? []).map((s) => s.stripe_customer_id))];
    if (!ids.length) return { invoices: [] };
    try {
      const stripe = createStripeClient(data.environment);
      const out: InvoiceRow[] = [];
      for (const customer of ids) {
        const list = await stripe.invoices.list({ customer, limit: 50 });
        for (const inv of list.data) {
          out.push({
            id: inv.id ?? "",
            status: inv.status ?? null,
            amount: (inv.amount_paid ?? 0) / 100,
            currency: inv.currency,
            created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
            url: inv.hosted_invoice_url ?? null,
          });
        }
      }
      return { invoices: out.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? "")) };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Permanently deletes the account: cancels any running membership, then removes the user (data cascades). */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { confirm: string }) => {
    if (data.confirm !== "DELETE") throw new Error("Type DELETE to confirm");
    return data;
  })
  .handler(async ({ context }): Promise<{ ok: true } | { error: string }> => {
    const { data: subs } = await context.supabase
      .from("subscriptions").select("stripe_subscription_id, environment, status")
      .eq("user_id", context.userId);
    try {
      for (const s of subs ?? []) {
        if (s.status === "canceled" || s.status === "incomplete_expired") continue;
        const stripe = createStripeClient(validEnv(s.environment));
        await stripe.subscriptions.cancel(s.stripe_subscription_id).catch(() => undefined);
      }
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) return { error: error.message };
    return { ok: true };
  });
