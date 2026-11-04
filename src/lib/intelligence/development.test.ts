import { describe, expect, it } from "vitest";
import type { DevelopmentData, Goal, Milestone, UserExperiment, ExperimentLog } from "@/lib/data/development-repo";
import type { CheckIn, WellnessState } from "@/lib/wellness-types";
import { addDays } from "@/lib/daily-metrics";
import { analyseExperiment, devReview, goalPatterns, goalProgress, journeyEvents } from "./development";

const TODAY = "2026-11-04";
const state = (over: Partial<WellnessState> = {}) => ({ onboarded: true, profile: {} as WellnessState["profile"], checkIns: [], missions: [], challenges: [], bucketList: [], experiments: [], coachMessages: [], completedActions: [], ...over }) as WellnessState;
const dev = (over: Partial<DevelopmentData> = {}): DevelopmentData => ({
  goals: [], milestones: [], actions: [], events: [], achievements: [], experimentDefs: [], experiments: [], experimentLogs: [], reviews: [],
  history: { rituals: [], hydration: [], protein: [], breathing: [], personal: [], missions: [], challenges: [] }, ...over,
});
const goal = (over: Partial<Goal> = {}): Goal => ({
  id: "g1", user_id: "u", title: "Get fitter", why: "", description: "", category: "Health and fitness", target_date: "", target_on: null,
  progress: 0, completed_at: null, legacy_id: null, created_at: `${addDays(TODAY, -30)}T08:00:00Z`, updated_at: "", priority: "medium",
  status: "active", notes: "", obstacles: "", linked_areas: [], progress_mode: "milestones", ...over,
});
const ms = (id: string, done: boolean, over: Partial<Milestone> = {}): Milestone => ({ id, user_id: "u", goal_id: "g1", title: id, target_on: null, done_at: done ? `${TODAY}T09:00:00Z` : null, sort_order: 0, source: "user", created_at: "", ...over });
const ci = (date: string, sleep: number): CheckIn => ({ id: date, date, mood: "okay", energy: 3, stress: 3, motivation: 3, sleep: sleep as CheckIn["sleep"], needs: [] });

describe("goal progress", () => {
  it("is the share of completed milestones", () => {
    const p = goalProgress(goal(), [ms("a", true), ms("b", false), ms("c", false), ms("d", true)], [], state(), dev(), TODAY);
    expect(p.pct).toBe(50);
  });
  it("does not move because of unrelated or linked activity", () => {
    const s = state({ missions: [{ id: "m", title: "Walk", detail: "", area: "movement", step: 1, totalSteps: 3, target: "", completed: true, completionDates: [TODAY, addDays(TODAY, -1)] }] });
    const p = goalProgress(goal({ linked_areas: ["movement"] }), [ms("a", false)], [], s, dev(), TODAY);
    expect(p.pct).toBe(0);
    expect(p.contribution[0]).toEqual({ label: "related mission completions", count: 2 });
  });
  it("uses the user's own value in manual mode", () => {
    expect(goalProgress(goal({ progress_mode: "manual", progress: 35 }), [], [], state(), dev(), TODAY).pct).toBe(35);
  });
});

describe("goal patterns", () => {
  it("flags goals created 3+ weeks ago with no first step", () => {
    const d = dev({ goals: [goal({ id: "a" }), goal({ id: "b" }), goal({ id: "c", created_at: `${TODAY}T08:00:00Z` })] });
    const p = goalPatterns(d, TODAY);
    expect(p.stalled.map((g) => g.id)).toEqual(["a", "b"]);
    expect(p.message).toContain("2 goals");
  });
});

describe("experiment analysis", () => {
  const exp = (over: Partial<UserExperiment> = {}): UserExperiment => ({
    id: "e", user_id: "u", experiment_id: null, custom_title: "Bedtime", custom_hypothesis: null, reason: "", target_behaviour: "",
    duration_days: 7, measure: "sleep", status: "active", start_date: addDays(TODAY, -6), end_date: null, days_done: 0,
    result_summary: null, baseline: {}, evaluation: {}, paused_at: null, created_at: "", updated_at: "", ...over,
  });
  const log = (date: string, done = true): ExperimentLog => ({ id: date, user_id: "u", user_experiment_id: "e", local_date: date, done, measurements: {}, note: null, created_at: "" });
  it("separates completion from success and never claims cause", () => {
    const start = addDays(TODAY, -6);
    const cis = [...[1, 2, 3, 4].map((i) => ci(addDays(start, -i), 2)), ...[0, 1, 2, 3].map((i) => ci(addDays(start, i), 4))];
    const logs = [0, 1, 2, 3].map((i) => log(addDays(start, i)));
    const a = analyseExperiment(exp(), logs, cis, null, TODAY);
    expect(a.readyToFinish).toBe(true);
    expect(a.daysDone).toBe(4);
    expect(a.change).toBe(2);
    expect(a.cannotConclude.join(" ")).toContain("can't prove");
  });
  it("says it cannot compare without enough check-ins", () => {
    const a = analyseExperiment(exp(), [], [], null, TODAY);
    expect(a.change).toBeNull();
    expect(a.cannotConclude[0]).toContain("Not enough check-ins");
  });
});

describe("journey and reviews", () => {
  it("is empty for a new user", () => {
    expect(journeyEvents(state(), dev())).toEqual([]);
  });
  it("monthly review lists real achievements with dates and no invented ones", () => {
    const d = dev({ goals: [goal({ status: "completed", completed_at: `${addDays(TODAY, -3)}T10:00:00Z` })] });
    const r = devReview(state(), d, "monthly", TODAY);
    expect(r.achievements).toHaveLength(1);
    expect(r.achievements[0]).toContain("Get fitter");
    expect(devReview(state(), dev(), "yearly", TODAY).achievements).toEqual([]);
  });
});
