/**
 * Personal development data: goals (bucket_goals), milestones, actions,
 * progress history, achievements, experiments and saved reviews.
 * Uses the caller's client so RLS always applies.
 */
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
type Db = SupabaseClient<Database>;
export type Goal = T["bucket_goals"]["Row"];
export type Milestone = T["goal_milestones"]["Row"];
export type GoalAction = T["goal_actions"]["Row"];
export type GoalEvent = T["goal_progress_events"]["Row"];
export type Achievement = T["personal_achievements"]["Row"];
export type ExperimentDef = T["experiment_definitions"]["Row"];
export type UserExperiment = T["user_experiments"]["Row"];
export type ExperimentLog = T["experiment_logs"]["Row"];
export type SavedReview = T["wellness_reviews"]["Row"];

export type GoalStatus = "not_started" | "planned" | "active" | "paused" | "completed" | "cancelled";
export type Measure = "energy" | "stress" | "sleep" | "mood" | "motivation";

/** Light, long-range habit history for analytics (one year). */
export interface HabitHistory {
  rituals: { local_date: string; ritual_id: string }[];
  hydration: { local_date: string; amount_ml: number }[];
  protein: { local_date: string }[];
  breathing: { local_date: string; duration_seconds: number }[];
  personal: { local_date: string; minutes: number }[];
  missions: { local_date: string; mission_id: string }[];
  challenges: { id: string; challenge_id: string | null; custom_title: string | null; status: string; started_on: string; completed_at: string | null }[];
}

export interface DevelopmentData {
  goals: Goal[];
  milestones: Milestone[];
  actions: GoalAction[];
  events: GoalEvent[];
  achievements: Achievement[];
  experimentDefs: ExperimentDef[];
  experiments: UserExperiment[];
  experimentLogs: ExperimentLog[];
  reviews: SavedReview[];
  history: HabitHistory;
}

function ok<R>(res: { data: R | null; error: { message: string } | null }): R {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as R;
}

export async function loadDevelopment(userId: string, since: string, db: Db = supabase): Promise<DevelopmentData> {
  const q = await Promise.all([
    db.from("bucket_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("goal_milestones").select("*").eq("user_id", userId).order("sort_order"),
    db.from("goal_actions").select("*").eq("user_id", userId).order("created_at"),
    db.from("goal_progress_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
    db.from("personal_achievements").select("*").eq("user_id", userId).order("achieved_on", { ascending: false }),
    db.from("experiment_definitions").select("*").eq("active", true).order("sort_order"),
    db.from("user_experiments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("experiment_logs").select("*").eq("user_id", userId).order("local_date"),
    db.from("wellness_reviews").select("*").eq("user_id", userId).order("period_start", { ascending: false }).limit(60),
    db.from("ritual_completions").select("local_date, ritual_id").eq("user_id", userId).gte("local_date", since),
    db.from("hydration_entries").select("local_date, amount_ml").eq("user_id", userId).gte("local_date", since),
    db.from("protein_entries").select("local_date").eq("user_id", userId).gte("local_date", since),
    db.from("breathing_sessions").select("local_date, duration_seconds").eq("user_id", userId).gte("local_date", since),
    db.from("personal_time_entries").select("local_date, minutes").eq("user_id", userId).gte("local_date", since),
    db.from("mission_completions").select("local_date, mission_id").eq("user_id", userId).gte("local_date", since),
    db.from("user_challenges").select("id, challenge_id, custom_title, status, started_on, completed_at").eq("user_id", userId),
  ]);
  return {
    goals: ok(q[0]), milestones: ok(q[1]), actions: ok(q[2]), events: ok(q[3]), achievements: ok(q[4]),
    experimentDefs: ok(q[5]), experiments: ok(q[6]), experimentLogs: ok(q[7]), reviews: ok(q[8]),
    history: {
      rituals: ok(q[9]), hydration: ok(q[10]), protein: ok(q[11]), breathing: ok(q[12]),
      personal: ok(q[13]), missions: ok(q[14]), challenges: ok(q[15]),
    },
  };
}

const now = () => new Date().toISOString();

export const dev = {
  async createGoal(uid: string, g: { title: string; description?: string; why?: string; category: string; priority: string; target_on: string | null; status: GoalStatus; linked_areas: string[] }) {
    const r = await supabase.from("bucket_goals").insert({ user_id: uid, ...g, target_date: g.target_on ?? "" }).select("id").single();
    if (r.error) throw new Error(r.error.message);
    return r.data.id;
  },
  async updateGoal(uid: string, id: string, patch: T["bucket_goals"]["Update"]) {
    const extra: T["bucket_goals"]["Update"] = { updated_at: now() };
    if (patch.status === "completed") { extra.completed_at = now(); }
    else if (patch.status) extra.completed_at = null;
    if (patch.target_on !== undefined) extra.target_date = patch.target_on ?? "";
    ok(await supabase.from("bucket_goals").update({ ...patch, ...extra }).eq("user_id", uid).eq("id", id));
  },
  async deleteGoal(uid: string, id: string) { ok(await supabase.from("bucket_goals").delete().eq("user_id", uid).eq("id", id)); },
  async addMilestone(uid: string, goalId: string, title: string, target_on: string | null, source: "user" | "coach", sort: number) {
    ok(await supabase.from("goal_milestones").insert({ user_id: uid, goal_id: goalId, title, target_on, source, sort_order: sort }));
    ok(await supabase.from("goal_progress_events").insert({ user_id: uid, goal_id: goalId, kind: "milestone_added", detail: title }));
  },
  async toggleMilestone(uid: string, m: Milestone) {
    const done = !m.done_at;
    ok(await supabase.from("goal_milestones").update({ done_at: done ? now() : null }).eq("user_id", uid).eq("id", m.id));
    ok(await supabase.from("goal_progress_events").insert({ user_id: uid, goal_id: m.goal_id, kind: done ? "milestone_done" : "milestone_undone", detail: m.title }));
  },
  async deleteMilestone(uid: string, id: string) { ok(await supabase.from("goal_milestones").delete().eq("user_id", uid).eq("id", id)); },
  async addAction(uid: string, goalId: string, title: string, milestoneId: string | null, source: "user" | "coach") {
    ok(await supabase.from("goal_actions").insert({ user_id: uid, goal_id: goalId, title, milestone_id: milestoneId, source }));
  },
  async toggleAction(uid: string, a: GoalAction) {
    ok(await supabase.from("goal_actions").update({ done_at: a.done_at ? null : now() }).eq("user_id", uid).eq("id", a.id));
    if (!a.done_at) ok(await supabase.from("goal_progress_events").insert({ user_id: uid, goal_id: a.goal_id, kind: "action_done", detail: a.title }));
  },
  async deleteAction(uid: string, id: string) { ok(await supabase.from("goal_actions").delete().eq("user_id", uid).eq("id", id)); },
  async addAchievement(uid: string, a: { title: string; note: string; achieved_on: string; category: string; goal_id: string | null }) {
    ok(await supabase.from("personal_achievements").insert({ user_id: uid, ...a }));
  },
  async deleteAchievement(uid: string, id: string) { ok(await supabase.from("personal_achievements").delete().eq("user_id", uid).eq("id", id)); },

  async startExperiment(uid: string, e: { experiment_id: string | null; custom_title?: string; custom_hypothesis?: string; reason: string; target_behaviour: string; duration_days: number; measure: Measure; start_date: string; baseline: Json }) {
    ok(await supabase.from("user_experiments").insert({ user_id: uid, status: "active", ...e }));
  },
  async setExperimentStatus(uid: string, id: string, status: "active" | "paused" | "abandoned", today: string) {
    ok(await supabase.from("user_experiments").update({ status, paused_at: status === "paused" ? today : null, end_date: status === "abandoned" ? today : null, updated_at: now() }).eq("user_id", uid).eq("id", id));
  },
  async logExperimentDay(uid: string, expId: string, date: string, done: boolean, note: string | null) {
    ok(await supabase.from("experiment_logs").upsert({ user_id: uid, user_experiment_id: expId, local_date: date, done, note }, { onConflict: "user_experiment_id,local_date" }));
    const { count } = await supabase.from("experiment_logs").select("id", { count: "exact", head: true }).eq("user_experiment_id", expId).eq("done", true);
    ok(await supabase.from("user_experiments").update({ days_done: count ?? 0, updated_at: now() }).eq("user_id", uid).eq("id", expId));
  },
  async completeExperiment(uid: string, id: string, today: string, evaluation: Json, summary: string) {
    ok(await supabase.from("user_experiments").update({ status: "completed", end_date: today, evaluation, result_summary: summary, updated_at: now() }).eq("user_id", uid).eq("id", id));
  },
  async saveReview(uid: string, r: { period_type: string; period_start: string; period_end: string; summary: string; trends: Json; reflection?: string }) {
    ok(await supabase.from("wellness_reviews").upsert({ user_id: uid, ...r }, { onConflict: "user_id,period_type,period_start" }));
  },
  async recordExport(uid: string, start: string, end: string) {
    ok(await supabase.from("report_exports").insert({ user_id: uid, period_start: start, period_end: end }));
  },
};
