import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useSubscription } from "@/lib/use-subscription";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof s['session_id'] === "string" ? s['session_id'] : undefined,
  }),
  head: () => ({ meta: [{ title: "Welcome to Smarty Wellness" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { isActive, refetch } = useSubscription();
  const [tries, setTries] = useState(0);
  // Access is confirmed only once the payment provider has notified us.
  useEffect(() => {
    if (isActive || tries > 20) return;
    const t = setTimeout(() => { void refetch(); setTries((n) => n + 1); }, 1500);
    return () => clearTimeout(t);
  }, [isActive, tries, refetch]);

  return (
    <PageShell width="xl">
      <div className="rounded-3xl border-2 border-calm bg-card p-8 text-center">
        {isActive ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-calm-deep" />
            <h1 className="mt-3 text-2xl font-extrabold">Welcome, member!</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your membership is active. Let's start your day.</p>
            <Link to="/today" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground no-underline">Go to Today</Link>
          </>
        ) : tries > 20 ? (
          <>
            <h1 className="text-xl font-extrabold">Still confirming your payment</h1>
            <p className="mt-2 text-sm text-muted-foreground">This can take a minute. Check your account page shortly.</p>
            <Link to="/account" className="mt-4 inline-block font-bold text-primary underline">Open my account</Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 font-bold">Confirming your payment…</p>
          </>
        )}
      </div>
    </PageShell>
  );
}
