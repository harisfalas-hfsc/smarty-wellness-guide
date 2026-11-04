/**
 * One-time, user-confirmed import of the old device-only data
 * (localStorage "smarty-wellness:v1") into the signed-in account.
 * Never runs automatically; never deletes the original browser data.
 * Re-running is safe: every write is an upsert keyed on natural keys, and
 * legacy_imports records a fingerprint so a finished import isn't repeated.
 */
import { supabase } from "@/integrations/supabase/client";
import { sectionToColumns } from "./data/wellness-repo";
import type { WellnessProfile } from "./wellness-types";

export const LEGACY_KEY = "smarty-wellness:v1";
const MOODS = ["great", "good", "okay", "not-great", "bad"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface LegacyCheckIn {
  id: string; date: string; mood: string; energy: number; stress: number;
  motivation: number; sleep: number; needs: string[]; note?: string;
}
export interface LegacyData {
  onboarded: boolean;
  profile: Partial<WellnessProfile>;
  checkIns: LegacyCheckIn[];
  missionCompletions: { id: string; date: string }[];
  challengeCompletions: { id: string; date: string }[];
  bucketList: { id: string; title: string; why: string; category: string; targetDate: string; progress: number }[];
  skipped: number;
}

const isScale = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Validates raw legacy JSON. Invalid records are skipped and counted. */
export function parseLegacy(raw: string | null): LegacyData | null {
  if (!raw) return null;
  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    data = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  let skipped = 0;
  const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

  const checkIns: LegacyCheckIn[] = [];
  const seen = new Set<string>();
  for (const c of arr(data["checkIns"])) {
    const date = str(c["date"]);
    const needs = Array.isArray(c["needs"]) ? (c["needs"] as unknown[]).filter((n): n is string => typeof n === "string")
      : typeof c["need"] === "string" ? [c["need"] as string] : [];
    if (!DATE_RE.test(date) || seen.has(date) || !MOODS.includes(str(c["mood"])) ||
      !isScale(c["energy"]) || !isScale(c["stress"]) || !isScale(c["motivation"]) || !isScale(c["sleep"])) {
      skipped++;
      continue;
    }
    seen.add(date);
    checkIns.push({ id: str(c["id"]), date, mood: str(c["mood"]), energy: c["energy"] as number, stress: c["stress"] as number,
      motivation: c["motivation"] as number, sleep: c["sleep"] as number, needs, ...(c["note"] ? { note: str(c["note"]) } : {}) });
  }

  const completions = (v: unknown) =>
    arr(v).filter((x) => x["completed"] === true && typeof x["id"] === "string")
      .map((x) => ({ id: x["id"] as string, date: DATE_RE.test(str(x["completedDate"])) ? str(x["completedDate"]) : "" }))
      .filter((x) => x.date !== "");

  const bucketList = arr(data["bucketList"]).flatMap((g) => {
    if (!str(g["title"]).trim()) { skipped++; return []; }
    const p = Number(g["progress"]);
    return [{ id: str(g["id"]), title: str(g["title"]), why: str(g["why"]), category: str(g["category"]),
      targetDate: str(g["targetDate"]), progress: Number.isFinite(p) ? Math.min(100, Math.max(0, Math.round(p))) : 0 }];
  });

  const profile = (data["profile"] && typeof data["profile"] === "object" ? data["profile"] : {}) as Partial<WellnessProfile>;
  const hasProfile = Object.values(profile).some((s) => s && Object.values(s).some((v) => typeof v === "string" && v.trim()));

  const result: LegacyData = {
    onboarded: data["onboarded"] === true,
    profile: hasProfile ? profile : {},
    checkIns,
    missionCompletions: completions(data["missions"]),
    challengeCompletions: completions(data["challenges"]),
    bucketList,
    skipped,
  };
  const empty = !result.onboarded && !hasProfile && !checkIns.length && !bucketList.length &&
    !result.missionCompletions.length && !result.challengeCompletions.length;
  return empty ? null : result;
}

export function fingerprint(raw: string): string {
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  return `${raw.length}-${(h >>> 0).toString(36)}`;
}

/** Has this exact browser data already been imported into this account? */
export async function legacyAlreadyImported(userId: string, raw: string) {
  const { data } = await supabase.from("legacy_imports").select("status")
    .eq("user_id", userId).eq("source_key", LEGACY_KEY).eq("fingerprint", fingerprint(raw)).maybeSingle();
  return data?.status === "completed";
}

/** Dates where the account already has a check-in (kept; legacy one skipped). */
export async function findConflicts(userId: string, data: LegacyData) {
  const { data: rows } = await supabase.from("check_ins").select("local_date").eq("user_id", userId)
    .in("local_date", data.checkIns.map((c) => c.date));
  return new Set((rows ?? []).map((r) => r.local_date));
}

export async function runLegacyImport(userId: string, raw: string, data: LegacyData) {
  const fp = fingerprint(raw);
  const must = <T extends { error: { message: string } | null }>(r: T) => { if (r.error) throw new Error(r.error.message); return r; };
  must(await supabase.from("legacy_imports").upsert(
    { user_id: userId, source_key: LEGACY_KEY, fingerprint: fp, status: "started", error: null },
    { onConflict: "user_id,source_key,fingerprint" }));
  try {
    const conflicts = await findConflicts(userId, data);
    const checkIns = data.checkIns.filter((c) => !conflicts.has(c.date));
    if (checkIns.length) must(await supabase.from("check_ins").upsert(checkIns.map((c) => ({
      user_id: userId, local_date: c.date, mood: c.mood, energy: c.energy, stress: c.stress, motivation: c.motivation,
      sleep: c.sleep, needs: c.needs, note: c.note ?? null, legacy_id: c.id })), { onConflict: "user_id,local_date", ignoreDuplicates: true }));

    for (const section of Object.keys(data.profile) as (keyof WellnessProfile)[]) {
      const cols = sectionToColumns(section, data.profile[section] ?? {});
      if (Object.keys(cols).length) must(await supabase.from("wellness_profiles").upsert({ ...cols, user_id: userId }, { onConflict: "user_id" }));
    }
    const { data: mDefs } = await supabase.from("mission_definitions").select("id");
    const { data: cDefs } = await supabase.from("challenge_definitions").select("id");
    const mIds = new Set((mDefs ?? []).map((d) => d.id));
    const cIds = new Set((cDefs ?? []).map((d) => d.id));
    const ms = data.missionCompletions.filter((m) => mIds.has(m.id));
    if (ms.length) must(await supabase.from("mission_completions").upsert(ms.map((m) => ({ user_id: userId, mission_id: m.id, local_date: m.date })), { onConflict: "user_id,mission_id,local_date", ignoreDuplicates: true }));
    const cs = data.challengeCompletions.filter((c) => cIds.has(c.id));
    if (cs.length) must(await supabase.from("challenge_completions").upsert(cs.map((c) => ({ user_id: userId, challenge_id: c.id, local_date: c.date })), { onConflict: "user_id,challenge_id,local_date", ignoreDuplicates: true }));

    const { data: existingGoals } = await supabase.from("bucket_goals").select("legacy_id").eq("user_id", userId).not("legacy_id", "is", null);
    const have = new Set((existingGoals ?? []).map((g) => g.legacy_id));
    const goals = data.bucketList.filter((g) => !have.has(g.id));
    if (goals.length) must(await supabase.from("bucket_goals").insert(goals.map((g) => ({ user_id: userId, title: g.title, why: g.why, category: g.category, target_date: g.targetDate, progress: g.progress, legacy_id: g.id }))));

    if (data.onboarded) must(await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", userId).is("onboarded_at", null));

    const counts = { checkIns: checkIns.length, conflicts: conflicts.size, missions: ms.length, challenges: cs.length, goals: goals.length, skipped: data.skipped };
    must(await supabase.from("legacy_imports").update({ status: "completed", counts, completed_at: new Date().toISOString() })
      .eq("user_id", userId).eq("source_key", LEGACY_KEY).eq("fingerprint", fp));
    return counts;
  } catch (err) {
    await supabase.from("legacy_imports").update({ status: "failed", error: err instanceof Error ? err.message : String(err) })
      .eq("user_id", userId).eq("source_key", LEGACY_KEY).eq("fingerprint", fp);
    throw err;
  }
}
