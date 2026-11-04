import { describe, expect, it } from "vitest";
import { isSubscriptionActive, PREMIUM_PLAN, FREE_PATHS } from "./membership";

const now = new Date("2026-11-04T10:00:00Z");
const future = "2026-12-04T10:00:00Z";
const past = "2026-10-01T10:00:00Z";

describe("membership", () => {
  it("costs €19.99 per month", () => {
    expect(PREMIUM_PLAN.amountLabel).toBe("€19.99");
    expect(PREMIUM_PLAN.periodLabel).toBe("month");
  });
  it("active subscription grants access", () => {
    expect(isSubscriptionActive({ status: "active", current_period_end: future, cancel_at_period_end: false, price_id: "premium_monthly" }, now)).toBe(true);
  });
  it("cancelled keeps access until the paid period ends, then stops", () => {
    expect(isSubscriptionActive({ status: "canceled", current_period_end: future, cancel_at_period_end: true, price_id: "x" }, now)).toBe(true);
    expect(isSubscriptionActive({ status: "canceled", current_period_end: past, cancel_at_period_end: true, price_id: "x" }, now)).toBe(false);
  });
  it("no subscription or unpaid means no access", () => {
    expect(isSubscriptionActive(null, now)).toBe(false);
    expect(isSubscriptionActive({ status: "unpaid", current_period_end: future, cancel_at_period_end: false, price_id: "x" }, now)).toBe(false);
  });
  it("no free trial and core features are not free", () => {
    expect(FREE_PATHS).not.toContain("/today");
    expect(FREE_PATHS).not.toContain("/coach");
  });
});
