/**
 * Daily wellness experience data: rituals, period check-ins, breathing,
 * hydration, protein, personal time, preferences and challenge participation.
 * Browser client under RLS; user_id is set explicitly AND enforced by policy.
 */
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Period = "morning" | "midday" | "evening";
export type PersonalCategory = "reading" | "hobbies" | "relaxation" | "outdoor" | "learning" | "development" | "alone" | "other";

export type Preferences = T["wellness_preferences"]["Row"];
export type RitualDef = T["ritual_definitions"]["Row"];
export type RitualActivityDef = T["ritual_activity_definitions"]["Row"];
export type PeriodCheckIn = T["period_check_ins"]["Row"];
export type BreathingSession = T["breathing_sessions"]["Row"];
export type HydrationEntry = T["hydration_entries"]["Row"];
export type ProteinEntry = T["protein_entries"]["Row"];
export type PersonalTimeEntry = T["personal_time_entries"]["Row"];
export type UserChallenge = T["user_challenges"]["Row"] & { days: string[] };

export interface DailyData {
  prefs: Preferences | null;
  rituals: RitualDef[];
  activities: RitualActivityDef[];
  activityDone: T["ritual_activity_completions"]["Row"][];
  ritualDone: T["ritual_completions"]["Row"][];
  periodCheckIns: PeriodCheckIn[];
  breathing: BreathingSession[];
  hydration: HydrationEntry[];
  protein: ProteinEntry[];
  personal: PersonalTimeEntry[];
  userChallenges: UserChallenge[];
}

type Db = SupabaseClient<Database>;

function ok<R>(res: { data: R | null; error: { message: string } | null }): R {
  if (res.error) throw new Error(res.error.message);
  return res.data as R;
}

export const RITUAL_ID: Record<Period, string> = { morning: "r-morning", midday: "r-midday", evening: "r-evening" };

export async function loadDaily(userId: string, since: string, db: Db = supabase): Promise<DailyData> {
  const [prefs, rituals, activities, aDone, rDone, pci, br, hy, pr, pt, uc, ucd] = await Promise.all([
    db.from("wellness_preferences").select("*").eq("user_id", userId).maybeSingle(),
    db.from("ritual_definitions").select("*").order("sort_order"),
    db.from("ritual_activity_definitions").select("*").order("sort_order"),
    db.from("ritual_activity_completions").select("*").eq("user_id", userId).gte("local_date", since),
    db.from("ritual_completions").select("*").eq("user_id", userId).gte("local_date", since),
    db.from("period_check_ins").select("*").eq("user_id", userId).gte("local_date", since).order("local_date", { ascending: false }),
    db.from("breathing_sessions").select("*").eq("user_id", userId).gte("local_date", since).order("completed_at", { ascending: false }),
    db.from("hydration_entries").select("*").eq("user_id", userId).gte("local_date", since).order("created_at", { ascending: false }),
    db.from("protein_entries").select("*").eq("user_id", userId).gte("local_date", since).order("created_at", { ascending: false }),
    db.from("personal_time_entries").select("*").eq("user_id", userId).gte("local_date", since).order("created_at", { ascending: false }),
    db.from("user_challenges").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    db.from("user_challenge_days").select("user_challenge_id, local_date").eq("user_id", userId),
  ]);
  const days = ok(ucd);
  return {
    prefs: ok(prefs),
    rituals: ok(rituals),
    activities: ok(activities),
    activityDone: ok(aDone),
    ritualDone: ok(rDone),
    periodCheckIns: ok(pci),
    breathing: ok(br),
    hydration: ok(hy),
    protein: ok(pr),
    personal: ok(pt),
    userChallenges: ok(uc).map((c) => ({ ...c, days: days.filter((d) => d.user_challenge_id === c.id).map((d) => d.local_date) })),
  };
}

export const daily = {
  async savePrefs(userId: string, values: Partial<T["wellness_preferences"]["Insert"]>) {
    ok(await supabase.from("wellness_preferences").upsert({ ...values, user_id: userId }, { onConflict: "user_id" }));
  },
  async savePeriodCheckIn(userId: string, date: string, period: Period, answers: Record<string, Json>) {
    ok(await supabase.from("period_check_ins").upsert({ user_id: userId, local_date: date, period, answers }, { onConflict: "user_id,local_date,period" }));
  },
  async completeActivity(userId: string, date: string, activityId: string, durationSeconds?: number) {
    ok(await supabase.from("ritual_activity_completions").upsert(
      { user_id: userId, activity_id: activityId, local_date: date, duration_seconds: durationSeconds ?? null },
      { onConflict: "user_id,activity_id,local_date", ignoreDuplicates: true }));
  },
  async undoActivity(userId: string, date: string, activityId: string) {
    ok(await supabase.from("ritual_activity_completions").delete().eq("user_id", userId).eq("activity_id", activityId).eq("local_date", date));
  },
  async completeRitual(userId: string, date: string, period: Period, closingMessage: string) {
    ok(await supabase.from("ritual_completions").upsert(
      { user_id: userId, ritual_id: RITUAL_ID[period], local_date: date, closing_message: closingMessage, completed_at: new Date().toISOString() },
      { onConflict: "user_id,ritual_id,local_date" }));
  },
  async logBreathing(userId: string, date: string, pattern: string, durationSeconds: number, slot?: Period | null) {
    ok(await supabase.from("breathing_sessions").insert({ user_id: userId, local_date: date, pattern, duration_seconds: durationSeconds, ritual_slot: slot ?? null }));
  },
  async logWater(userId: string, date: string, ml: number) {
    ok(await supabase.from("hydration_entries").insert({ user_id: userId, local_date: date, amount_ml: ml }));
  },
  async logProtein(userId: string, date: string, grams: number, label?: string) {
    ok(await supabase.from("protein_entries").insert({ user_id: userId, local_date: date, grams, label: label || null }));
  },
  async logPersonal(userId: string, date: string, category: PersonalCategory, minutes: number, note?: string) {
    ok(await supabase.from("personal_time_entries").insert({ user_id: userId, local_date: date, category, minutes, note: note || null }));
  },
  async deleteEntry(userId: string, table: "hydration_entries" | "protein_entries" | "personal_time_entries" | "breathing_sessions", id: string) {
    ok(await supabase.from(table).delete().eq("user_id", userId).eq("id", id));
  },
  async joinChallenge(userId: string, challengeId: string | null, start: string, end: string, targetDays: number, custom?: { title: string; detail?: string }) {
    ok(await supabase.from("user_challenges").insert({
      user_id: userId, challenge_id: challengeId, started_on: start, ends_on: end, target_days: targetDays,
      custom_title: custom?.title ?? null, custom_detail: custom?.detail ?? null,
    }));
  },
  async markChallengeDay(userId: string, userChallengeId: string, date: string) {
    ok(await supabase.from("user_challenge_days").upsert({ user_id: userId, user_challenge_id: userChallengeId, local_date: date }, { onConflict: "user_challenge_id,local_date", ignoreDuplicates: true }));
  },
  async unmarkChallengeDay(userId: string, userChallengeId: string, date: string) {
    ok(await supabase.from("user_challenge_days").delete().eq("user_id", userId).eq("user_challenge_id", userChallengeId).eq("local_date", date));
  },
  async leaveChallenge(userId: string, userChallengeId: string) {
    ok(await supabase.from("user_challenges").update({ status: "abandoned" }).eq("user_id", userId).eq("id", userChallengeId));
  },
};
