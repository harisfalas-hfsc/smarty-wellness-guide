import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { PlanCard } from "@/components/PlanCard";
import { MembershipCheckout } from "@/components/MembershipCheckout";
import { useSubscription } from "@/lib/use-subscription";
import { paymentsConfigured } from "@/lib/stripe";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Membership | SmartyWellness" },
      { name: "description", content: "One simple Smarty Wellness membership: €19.99 per month for rituals, check-ins, Smarty Coach, goals and insights. Cancel anytime." },
      { property: "og:title", content: "Smarty Wellness Membership" },
      { property: "og:description", content: "Everything in Smarty Wellness for €19.99 per month. Cancel anytime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const [checkout, setCheckout] = useState(false);
  const { isActive } = useSubscription();
  return (
    <PageShell width="xl">
      <PageHeader eyebrow="Membership" title="One plan. Everything included." subtitle="Your personal guide to a healthier, more balanced, and more fulfilling life." />
      {isActive ? (
        <div className="rounded-3xl border-2 border-calm bg-card p-6 text-center">
          <p className="font-bold">You're a member. Thank you!</p>
          <Link to="/account" className="mt-3 inline-block font-bold text-primary underline">Manage membership</Link>
        </div>
      ) : checkout && paymentsConfigured() ? (
        <MembershipCheckout />
      ) : (
        <PlanCard onSubscribe={() => setCheckout(true)} />
      )}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices include applicable VAT where required. Your membership renews automatically each month until you cancel.
        If you cancel, you keep access until the end of the paid month and your wellness records are never deleted.
        See our <Link to="/terms" className="underline">Terms</Link>.
      </p>
    </PageShell>
  );
}
