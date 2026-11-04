import { describe, expect, it } from "vitest";
import type { DailyData } from "@/lib/data/daily-repo";
import type { CheckIn, Mission, WellnessState } from "@/lib/wellness-types";
import { addDays } from "@/lib/daily-metrics";
import { adviseMission, analyse, findPatterns, buildDaySignals, lifeGaps, suggestChallenge } from "./engine";

const TODAY = "2026-11-04";
const emptyProfile = {
  personal: { name: "", age: "", gender: "", relationship: "", children: "", interests: "", goals: "" },
  dailyLife: { occupation: "", workingHours: "", commute: "", responsibilities: "", typicalSchedule: "", freeTime: "", familyResponsibilities: "" },
  physical: { activityLevel: "", trainingExperience: "", fitnessLevel: "", limitations: "", pain: "", energy: "" },
  nutrition: { habits: "", preferences: "", goals: "", restrictions: "", consistency: "" },
  mental: { stress: "", mood: "", motivation: "", socialConnection: "", outdoor: "", hobbies: "", reading: "", entertainment: "", personalTime: "", sleepRoutine: "" },
};
function state(over: Partial<WellnessState> = {}): WellnessState {
  return { onboarded: true, profile: structuredClone(emptyProfile), checkIns: [], missions: [], challenges: [], bucketList: [], experiments: [], coachMessages: [], completedActions: [], ...over };
}
function daily(over: Partial<DailyData> = {}): DailyData {
  return { prefs: null, rituals: [], activities: [], activityDone: [], ritualDone: [], periodCheckIns: [], breathing: [], hydration: [], protein: [], personal: [], userChallenges: [], ...over };
}
const ci = (daysAgo: number, v: Partial<CheckIn>): CheckIn => ({
  id: `c${daysAgo}`, date: addDays(TODAY, -daysAgo), mood: "okay", energy: 3, stress: 3, motivation: 3, sleep: 3, needs: [], ...v,
});

describe("new user with no data", () => {
  it("asks for a check-in first and reports no gaps as facts", () => {
    const intel = analyse(state(), daily(), TODAY);
    expect(intel.context.isNewUser).toBe(true);
    expect(intel.primary?.key).toBe("check-in");
    expect(intel.gaps.every((g) => g.status !== "gap")).toBe(true);
    expect(intel.patterns).toEqual([]);
  });
});

describe("high stress and poor sleep", () => {
  it("prioritises a recovery-focused day", () => {
    const s = state({ checkIns: [ci(0, { stress: 5, sleep: 1 }), ci(1, { stress: 4, sleep: 2 }), ci(2, { stress: 5, sleep: 2 })] });
    const intel = analyse(s, daily(), TODAY);
    expect(intel.primary?.key).toBe("recovery-day");
    expect(intel.primary?.why).toContain("recent days");
    const stress = intel.gaps.find((g) => g.area === "stress")!;
    expect(stress.status).toBe("gap");
    expect(stress.priority).toBe("high");
  });
  it("drops a recommendation dismissed today", () => {
    const s = state({ checkIns: [ci(0, { stress: 5, sleep: 1 })] });
    const intel = analyse(s, daily(), TODAY, [{ rec_key: "recovery-day", status: "dismissed", local_date: TODAY, postponed_until: null }]);
    expect(intel.recommendations.find((r) => r.key === "recovery-day")).toBeUndefined();
  });
});

describe("missing data is not low performance", () => {
  it("marks personal time as not-enough-data when nothing is logged and few active days", () => {
    const s = state({ profile: { ...structuredClone(emptyProfile), personal: { ...emptyProfile.personal, goals: "more personal time and balance" } } });
    const gap = lifeGaps(s, daily(), buildDaySignals(s, daily(), TODAY)).find((g) => g.area === "personal-time")!;
    expect(gap.status).toBe("not-enough-data");
    expect(gap.gapLevel).toBeNull();
  });
  it("flags a real personal-time gap when the user is active but logs none against a daily goal", () => {
    const s = state({ checkIns: Array.from({ length: 8 }, (_, i) => ci(i, {})) });
    const d = daily({ prefs: { personal_time_goal_min: 15, personal_time_goal_period: "daily" } as DailyData["prefs"], personal: [{ id: "p", user_id: "u", local_date: TODAY, minutes: 5, category: "reading", note: null, created_at: "" }] });
    const gap = lifeGaps(s, d, buildDaySignals(s, d, TODAY)).find((g) => g.area === "personal-time")!;
    expect(gap.status).toBe("gap");
    expect(gap.gapLevel).toBe(3);
  });
});

describe("patterns", () => {
  it("needs at least 4 days on each side before reporting an association", () => {
    const s = state({ checkIns: [ci(0, { sleep: 5, energy: 5 }), ci(1, { sleep: 1, energy: 1 })] });
    expect(findPatterns(buildDaySignals(s, daily(), TODAY)).filter((p) => p.kind === "association")).toEqual([]);
  });
  it("describes sleep/energy as an association, never a cause", () => {
    const cis = Array.from({ length: 10 }, (_, i) => (i % 2 ? ci(i, { sleep: 5, energy: 5 }) : ci(i, { sleep: 1, energy: 2 })));
    const p = findPatterns(buildDaySignals(state({ checkIns: cis }), daily(), TODAY)).find((x) => x.id === "sleep-energy")!;
    expect(p.detail).toContain("association, not proof of cause");
  });
});

describe("mission progression", () => {
  const base: Mission = { id: "m", title: "Read", detail: "", area: "personal", step: 2, totalSteps: 4, target: "10 min", completed: false, status: "active", daysPerStep: 3, stepDays: 0 };
  it("suggests an easier step when a mission hasn't fitted in for 10+ days", () => {
    expect(adviseMission({ ...base, startedAt: addDays(TODAY, -12), completionDates: [] }, TODAY).kind).toBe("easier");
  });
  it("does not level up just because time passed", () => {
    expect(adviseMission({ ...base, startedAt: addDays(TODAY, -60), completionDates: [addDays(TODAY, -1), addDays(TODAY, -3)], stepDays: 1 }, TODAY).kind).toBe("steady");
  });
  it("welcomes a returning user after 14+ days away", () => {
    expect(adviseMission({ ...base, completionDates: [addDays(TODAY, -20)] }, TODAY).kind).toBe("returning");
  });
});

describe("challenge suggestions", () => {
  it("never overloads a user who already has 3 active challenges", () => {
    const uc = (id: string) => ({ id, challenge_id: id, status: "active", started_on: TODAY, ends_on: TODAY, target_days: 1, user_id: "u", created_at: "", completed_at: null, custom_title: null, custom_detail: null, days: [] });
    const s = state({ challenges: [{ id: "x", title: "Read", detail: "", completed: false }] });
    expect(suggestChallenge(s, daily({ userChallenges: [uc("a"), uc("b"), uc("c")] }), [], "", TODAY)).toBeNull();
  });
  it("skips strenuous challenges when the user has a physical limitation", () => {
    const s = state({ challenges: [{ id: "c-stairs", title: "Take the stairs", detail: "", completed: false }, { id: "c-pages", title: "Read five pages", detail: "", completed: false }] });
    expect(suggestChallenge(s, daily(), [], "knee pain", TODAY)?.id).toBe("c-pages");
  });
});
