/**
 * Typed data access for Smarty Wellness. Uses the browser client, so every
 * query runs under RLS as the signed-in user. user_id is never sent from the
 * client for inserts: the database defaults it to auth.uid().
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  BucketGoal,
  Challenge,
  CheckIn,
  CoachMessage,
  Experiment,
  Mission,
  WellnessProfile,
  WellnessState,
} from "@/lib/wellness-types";

type WPRow = Database["public"]["Tables"]["wellness_profiles"]["Row"];
type WPInsert = Database["public"]["Tables"]["wellness_profiles"]["Insert"];

/** Maps profile section/field → wellness_profiles column. */
export const PROFILE_COLUMNS = {
  personal: {
    name: "name", age: "age", gender: "gender", relationship: "relationship",
    children: "children", interests: "interests", goals: "personal_goals",
  },
  dailyLife: {
    occupation: "occupation", workingHours: "working_hours", commute: "commute",
    responsibilities: "responsibilities", typicalSchedule: "typical_schedule",
    freeTime: "free_time", familyResponsibilities: "family_responsibilities",
  },
  physical: {
    activityLevel: "activity_level", trainingExperience: "training_experience",
    fitnessLevel: "fitness_level", limitations: "limitations", pain: "pain", energy: "physical_energy",
  },
  nutrition: {
    habits: "nutrition_habits", preferences: "nutrition_preferences", goals: "nutrition_goals",
    restrictions: "nutrition_restrictions", consistency: "nutrition_consistency",
  },
  mental: {
    stress: "stress", mood: "mood", motivation: "motivation", socialConnection: "social_connection",
    outdoor: "outdoor", hobbies: "hobbies", reading: "reading", entertainment: "entertainment",
    personalTime: "personal_time", sleepRoutine: "sleep_routine",
  },
} as const satisfies { [S in keyof WellnessProfile]: Record<keyof WellnessProfile[S], keyof WPRow> };

export function rowToProfile(row: Partial<WPRow> | null): WellnessProfile {
  const out = {} as Record<string, Record<string, string>>;
  for (const [section, fields] of Object.entries(PROFILE_COLUMNS)) {
    out[section] = {};
    for (const [field, col] of Object.entries(fields)) {
      out[section]![field] = (row?.[col as keyof WPRow] as string | undefined) ?? "";
    }
  }
  return out as unknown as WellnessProfile;
}

export function sectionToColumns<S extends keyof WellnessProfile>(
  section: S,
  values: Partial<WellnessProfile[S]>,
): WPInsert {
  const map = PROFILE_COLUMNS[section] as Record<string, string>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    const col = map[k];
    if (col && typeof v === "string") out[col] = v;
  }
  return out as WPInsert;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function loadWellnessState(userId: string): Promise<WellnessState> {
  const [profile, wp, checkIns, mDefs, mProg, mDone, cDefs, cDone, goals, eDefs, uExp, conv] =
    await Promise.all([
      supabase.from("profiles").select("onboarded_at").eq("id", userId).maybeSingle(),
      supabase.from("wellness_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("check_ins").select("*").eq("user_id", userId).order("local_date", { ascending: false }).limit(400),
      supabase.from("mission_definitions").select("*").eq("active", true).order("sort_order"),
      supabase.from("user_mission_progress").select("*").eq("user_id", userId),
      supabase.from("mission_completions").select("mission_id, local_date").eq("user_id", userId).order("local_date", { ascending: false }),
      supabase.from("challenge_definitions").select("*").eq("active", true).order("sort_order"),
      supabase.from("challenge_completions").select("challenge_id, local_date").eq("user_id", userId).order("local_date", { ascending: false }),
      supabase.from("bucket_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("experiment_definitions").select("*").eq("active", true).order("sort_order"),
      supabase.from("user_experiments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("coach_conversations").select("id").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1),
    ]);

  const convId = check(conv)[0]?.id;
  const msgs = convId
    ? check(await supabase.from("coach_messages").select("id, role, text, created_at").eq("conversation_id", convId).order("created_at"))
    : [];

  const latestMission = new Map<string, string>();
  for (const r of check(mDone)) if (!latestMission.has(r.mission_id)) latestMission.set(r.mission_id, r.local_date);
  const latestChallenge = new Map<string, string>();
  for (const r of check(cDone)) if (!latestChallenge.has(r.challenge_id)) latestChallenge.set(r.challenge_id, r.local_date);
  const progress = new Map(check(mProg).map((p) => [p.mission_id, p.step]));

  const missions: Mission[] = check(mDefs).map((d) => {
    const step = progress.get(d.id) ?? 1;
    const date = latestMission.get(d.id);
    return {
      id: d.id, title: d.title, detail: d.detail, area: d.area as Mission["area"],
      step, totalSteps: d.total_steps,
      target: d.step_targets[step - 1] ?? d.step_targets[d.step_targets.length - 1] ?? "",
      completed: Boolean(date), ...(date ? { completedDate: date } : {}),
    };
  });
  const challenges: Challenge[] = check(cDefs).map((d) => {
    const date = latestChallenge.get(d.id);
    return { id: d.id, title: d.title, detail: d.detail, completed: Boolean(date), ...(date ? { completedDate: date } : {}) };
  });
  const userExp = check(uExp);
  const experiments: Experiment[] = check(eDefs).map((d) => {
    const u = userExp.find((x) => x.experiment_id === d.id);
    return {
      id: d.id, title: d.title, hypothesis: d.hypothesis, days: d.days, measures: d.measures,
      daysDone: u?.days_done ?? 0,
      status: u ? (u.status === "completed" ? "completed" : "active") : "available",
    };
  });

  return {
    onboarded: Boolean(check(profile)?.onboarded_at),
    profile: rowToProfile(check(wp)),
    checkIns: check(checkIns).map((c) => ({
      id: c.id, date: c.local_date, mood: c.mood as CheckIn["mood"],
      energy: c.energy as CheckIn["energy"], stress: c.stress as CheckIn["stress"],
      motivation: c.motivation as CheckIn["motivation"], sleep: c.sleep as CheckIn["sleep"],
      needs: c.needs as CheckIn["needs"], ...(c.note ? { note: c.note } : {}),
    })),
    missions,
    challenges,
    bucketList: check(goals).map((g): BucketGoal => ({
      id: g.id, title: g.title, why: g.why, category: g.category, targetDate: g.target_date, progress: g.progress,
    })),
    experiments,
    coachMessages: msgs.map((m): CoachMessage => ({
      id: m.id, role: m.role === "user" ? "user" : "coach", text: m.text, at: m.created_at,
    })),
    completedActions: [
      ...missions.filter((m) => m.completed).map((m) => m.id),
      ...challenges.filter((c) => c.completed).map((c) => c.id),
    ],
  };
}

export async function upsertCheckIn(userId: string, date: string, c: Omit<CheckIn, "id" | "date">) {
  check(await supabase.from("check_ins").upsert(
    { user_id: userId, local_date: date, mood: c.mood, energy: c.energy, stress: c.stress,
      motivation: c.motivation, sleep: c.sleep, needs: c.needs, note: c.note ?? null },
    { onConflict: "user_id,local_date" },
  ));
}

export async function upsertProfileSection<S extends keyof WellnessProfile>(
  userId: string, section: S, values: Partial<WellnessProfile[S]>,
) {
  check(await supabase.from("wellness_profiles").upsert({ ...sectionToColumns(section, values), user_id: userId }, { onConflict: "user_id" }));
}

export async function setOnboarded(userId: string, timeZone: string | null) {
  check(await supabase.from("profiles").update({ onboarded_at: new Date().toISOString(), ...(timeZone ? { timezone: timeZone } : {}) }).eq("id", userId));
}

export async function setMissionDone(userId: string, missionId: string, date: string, done: boolean) {
  if (done) check(await supabase.from("mission_completions").upsert({ user_id: userId, mission_id: missionId, local_date: date }, { onConflict: "user_id,mission_id,local_date" }));
  else check(await supabase.from("mission_completions").delete().eq("user_id", userId).eq("mission_id", missionId).eq("local_date", date));
}

export async function setChallengeDone(userId: string, challengeId: string, date: string, done: boolean) {
  if (done) check(await supabase.from("challenge_completions").upsert({ user_id: userId, challenge_id: challengeId, local_date: date }, { onConflict: "user_id,challenge_id,local_date" }));
  else check(await supabase.from("challenge_completions").delete().eq("user_id", userId).eq("challenge_id", challengeId).eq("local_date", date));
}

export async function insertBucketGoal(userId: string, g: Omit<BucketGoal, "id">) {
  return check(await supabase.from("bucket_goals").insert({
    user_id: userId, title: g.title, why: g.why, category: g.category, target_date: g.targetDate, progress: g.progress,
  }).select("id").single()).id;
}

export async function deleteBucketGoal(userId: string, id: string) {
  check(await supabase.from("bucket_goals").delete().eq("user_id", userId).eq("id", id));
}

export async function insertCoachMessage(userId: string, m: Omit<CoachMessage, "id" | "at">) {
  const existing = check(await supabase.from("coach_conversations").select("id").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1));
  const conversationId = existing[0]?.id
    ?? check(await supabase.from("coach_conversations").insert({ user_id: userId }).select("id").single()).id;
  check(await supabase.from("coach_messages").insert({ user_id: userId, conversation_id: conversationId, role: m.role, text: m.text }));
  check(await supabase.from("coach_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId));
}

/** Deletes all of the signed-in user's wellness records (keeps the account). */
export async function clearAllWellnessData(userId: string) {
  const tables = [
    "coach_messages", "coach_conversations", "recommendations", "experiment_logs", "user_experiments",
    "mission_completions", "user_mission_progress", "challenge_completions", "ritual_completions",
    "bucket_goals", "wellness_reviews", "check_ins", "wellness_profiles",
  ] as const;
  for (const t of tables) check(await supabase.from(t).delete().eq("user_id", userId));
  check(await supabase.from("profiles").update({ onboarded_at: null }).eq("id", userId));
}
