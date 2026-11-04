import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PREMIUM_PLAN } from "@/lib/membership";
import { useAuth } from "@/lib/auth";

export function PlanCard({ onSubscribe }: { onSubscribe?: () => void }) {
  const { session } = useAuth();
  return (
    <div className="rounded-3xl border-2 border-primary bg-card p-6 text-center sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">{PREMIUM_PLAN.name}</p>
      <p className="mt-3 text-4xl font-extrabold">
        {PREMIUM_PLAN.amountLabel}
        <span className="text-base font-semibold text-muted-foreground"> / {PREMIUM_PLAN.periodLabel}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Renews monthly. Cancel anytime from your account.</p>
      <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
        {PREMIUM_PLAN.benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-calm-deep" /> {b}
          </li>
        ))}
      </ul>
      {session ? (
        <button
          type="button"
          onClick={onSubscribe}
          className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:opacity-90"
        >
          Become a member
        </button>
      ) : (
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-6 inline-flex w-full justify-center rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground no-underline hover:opacity-90"
        >
          Create account to join
        </Link>
      )}
    </div>
  );
}
