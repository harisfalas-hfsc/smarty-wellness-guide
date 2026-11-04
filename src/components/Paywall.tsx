import { useState } from "react";
import { Lock } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PlanCard } from "@/components/PlanCard";
import { MembershipCheckout } from "@/components/MembershipCheckout";
import { paymentsConfigured } from "@/lib/stripe";

/** Shown in place of any members-only page for visitors and non-members. */
export function Paywall() {
  const [checkout, setCheckout] = useState(false);
  return (
    <PageShell width="xl">
      <div className="mb-6 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-primary">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold uppercase tracking-tight">Members only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This part of Smarty Wellness is included in the membership. Join to unlock everything.
        </p>
      </div>
      {checkout && paymentsConfigured() ? <MembershipCheckout /> : <PlanCard onSubscribe={() => setCheckout(true)} />}
    </PageShell>
  );
}
