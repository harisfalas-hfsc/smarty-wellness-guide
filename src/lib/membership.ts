// Central membership configuration. Change prices/benefits here only;
// the amount charged is defined in the payments catalog under the same price id.
export const PREMIUM_PLAN = {
  priceId: "premium_monthly",
  name: "Smarty Wellness Premium",
  amountLabel: "€19.99",
  periodLabel: "month",
  benefits: [
    "Morning Activation, Midday Reset and Evening Unwind",
    "Daily check-ins with a clear plan for the day",
    "Smarty Coach, your personal wellness guide",
    "Missions, challenges and habit tracking",
    "Goals, bucket list and wellness experiments",
    "Insights, journey history and PDF reports",
  ],
} as const;

/** Pages anyone can open without a membership. */
export const FREE_PATHS = [
  "/", "/auth", "/reset-password", "/privacy", "/terms", "/disclaimer",
  "/pricing", "/account", "/checkout/return",
];

export type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  price_id: string;
};

/** Mirrors public.has_active_subscription. */
export function isSubscriptionActive(sub: SubscriptionRow | null | undefined, now = new Date()): boolean {
  if (!sub) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
  if (["active", "trialing", "past_due"].includes(sub.status)) return !end || end > now;
  if (sub.status === "canceled") return !!end && end > now;
  return false;
}
