import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Download, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/use-subscription";
import { PREMIUM_PLAN } from "@/lib/membership";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { createPortalSession, deleteMyAccount, getPaymentHistory } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My account | SmartyWellness" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

const EXPORT_TABLES = [
  "profiles", "wellness_profiles", "wellness_preferences", "check_ins", "period_check_ins", "ritual_completions",
  "ritual_activity_completions", "breathing_sessions", "hydration_entries", "protein_entries", "personal_time_entries",
  "mission_completions", "user_mission_progress", "mission_progress_events", "challenge_completions", "user_challenges",
  "user_challenge_days", "bucket_goals", "goal_milestones", "goal_actions", "goal_progress_events", "personal_achievements",
  "user_experiments", "experiment_logs", "recommendations", "insight_snapshots", "wellness_reviews", "coach_conversations",
  "coach_messages", "report_exports", "subscriptions",
] as const;

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "—";

function Account() {
  const { user, signOut } = useAuth();
  const { subscription, isActive } = useSubscription();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");

  const history = useQuery({
    queryKey: ["payment-history", user?.id],
    enabled: !!user && paymentsConfigured() && !!subscription,
    queryFn: async () => {
      const r = await getPaymentHistory({ data: { environment: getStripeEnvironment() } });
      if ("error" in r) throw new Error(r.error);
      return r.invoices;
    },
  });

  if (!user) {
    return (
      <PageShell width="xl">
        <PageHeader title="My account" />
        <p className="text-center">
          <Link to="/auth" search={{ mode: "signin" }} className="font-bold text-primary underline">Sign in</Link> to see your account.
        </p>
      </PageShell>
    );
  }

  const openPortal = async () => {
    setBusy("portal");
    try {
      const r = await createPortalSession({ data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/account` } });
      if ("error" in r) throw new Error(r.error);
      window.open(r.url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const exportData = async () => {
    setBusy("export");
    try {
      const out: Record<string, unknown> = { exported_at: new Date().toISOString(), email: user.email };
      for (const t of EXPORT_TABLES) {
        const { data } = await supabase.from(t).select("*");
        out[t] = data ?? [];
      }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `smarty-wellness-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    setBusy("delete");
    try {
      const r = await deleteMyAccount({ data: { confirm } });
      if ("error" in r) throw new Error(r.error);
      await qc.cancelQueries();
      qc.clear();
      await signOut();
      toast.success("Your account and all data were deleted.");
      await navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  const status = !subscription
    ? "No membership"
    : isActive
      ? subscription.cancel_at_period_end || subscription.status === "canceled"
        ? "Cancelled — access until end of period"
        : subscription.status === "past_due"
          ? "Payment problem — please update your card"
          : "Active"
      : "Expired";

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Account" title="My account" />
      <div className="space-y-5">
        <section className="rounded-3xl border-2 border-primary bg-card p-5">
          <h2 className="flex items-center gap-2 font-bold"><User className="h-4 w-4" /> Account details</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Email</dt><dd className="font-semibold">{user.email}</dd></div>
            <div><dt className="text-muted-foreground">Member since</dt><dd className="font-semibold">{fmtDate(user.created_at)}</dd></div>
          </dl>
          <Link to="/settings" className="mt-3 inline-block text-sm font-bold text-primary underline">Settings & preferences</Link>
        </section>

        <section className="rounded-3xl border-2 border-calm bg-card p-5">
          <h2 className="flex items-center gap-2 font-bold"><CreditCard className="h-4 w-4" /> Membership</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">Plan</dt><dd className="font-semibold">{subscription ? `${PREMIUM_PLAN.name}` : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Status</dt><dd className="font-semibold">{status}</dd></div>
            <div>
              <dt className="text-muted-foreground">{subscription?.cancel_at_period_end || subscription?.status === "canceled" ? "Access ends" : "Next renewal"}</dt>
              <dd className="font-semibold">{fmtDate(subscription?.current_period_end)}</dd>
            </div>
          </dl>
          {subscription && <p className="mt-2 text-sm text-muted-foreground">{PREMIUM_PLAN.amountLabel} per {PREMIUM_PLAN.periodLabel}, renews automatically.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {subscription ? (
              <button onClick={openPortal} disabled={busy === "portal"} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
                {busy === "portal" ? "Opening…" : isActive && !subscription.cancel_at_period_end ? "Cancel or manage membership" : "Manage billing / renew"}
              </button>
            ) : (
              <Link to="/pricing" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground no-underline">Become a member</Link>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Cancelling stops future payments. You keep access until the end of the month you've paid for. Your wellness records are always kept unless you delete your account.
          </p>
          {subscription && (
            <div className="mt-4">
              <h3 className="text-sm font-bold">Payment history</h3>
              {history.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : history.error ? (
                <p className="text-sm text-muted-foreground">Couldn't load payment history.</p>
              ) : (history.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="mt-2 divide-y text-sm">
                  {history.data!.map((i) => (
                    <li key={i.id} className="flex items-center justify-between py-2">
                      <span>{fmtDate(i.created)}</span>
                      <span className="font-semibold">{i.amount.toFixed(2)} {i.currency.toUpperCase()}</span>
                      <span className="capitalize text-muted-foreground">{i.status}</span>
                      {i.url ? <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Receipt</a> : <span />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <NotificationSettings userId={user.id} />

        <section className="rounded-3xl border-2 border-mind bg-card p-5">
          <h2 className="flex items-center gap-2 font-bold"><Download className="h-4 w-4" /> Download my data</h2>
          <p className="mt-2 text-sm text-muted-foreground">Get a copy of everything Smarty Wellness stores about you.</p>
          <button onClick={exportData} disabled={busy === "export"} className="mt-3 rounded-full border-2 border-primary px-5 py-2 text-sm font-bold text-primary disabled:opacity-60">
            {busy === "export" ? "Preparing…" : "Download data"}
          </button>
        </section>

        <section className="rounded-3xl border-2 border-coral bg-card p-5">
          <h2 className="flex items-center gap-2 font-bold"><Trash2 className="h-4 w-4" /> Delete account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This cancels any membership immediately and permanently deletes your account and all wellness records. This cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type DELETE"
              aria-label="Type DELETE to confirm"
              className="h-10 rounded-full border-2 border-coral px-4 text-sm"
            />
            <button onClick={deleteAccount} disabled={confirm !== "DELETE" || busy === "delete"} className="rounded-full bg-destructive px-5 py-2 text-sm font-bold text-destructive-foreground disabled:opacity-50">
              {busy === "delete" ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function NotificationSettings({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notif-prefs", userId],
    queryFn: async () => {
      const { data } = await supabase.from("wellness_preferences").select("daily_messages").eq("user_id", userId).maybeSingle();
      return data?.daily_messages ?? true;
    },
  });
  const set = async (v: boolean) => {
    const { error } = await supabase.from("wellness_preferences").upsert({ user_id: userId, daily_messages: v }, { onConflict: "user_id" });
    if (error) { toast.error("Could not save"); return; }
    void qc.invalidateQueries({ queryKey: ["notif-prefs", userId] });
  };
  return (
    <section className="rounded-3xl border-2 border-sun bg-card p-5">
      <h2 className="font-bold">Notifications</h2>
      <label className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span>
          <span className="block font-semibold">Daily coaching message</span>
          <span className="text-muted-foreground">One short, practical note each morning in your <Link to="/messages" className="underline">message center</Link>.</span>
        </span>
        <input type="checkbox" className="h-5 w-5 accent-primary" checked={data ?? true} onChange={(e) => void set(e.target.checked)} />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">Ritual and habit reminders can be set in <Link to="/settings" className="underline">Settings</Link>. Billing receipts are always sent by email by our payment provider.</p>
    </section>
  );
}
