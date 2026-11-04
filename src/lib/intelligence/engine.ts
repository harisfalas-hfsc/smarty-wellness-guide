/**
 * Smarty Wellness intelligence engine — pure functions, no I/O.
 *
 * One engine feeds every surface (Today, Insights, Weekly Review, Missions,
 * Challenges and Smarty Coach) so they can never contradict each other.
 *
 * Rules baked in:
 *  - "Stated" (what the user told us), "observed" (calculated from records)
 *    and "suggested" (what we recommend) are kept separate.
 *  - Missing records are "not enough information", never "not doing it".
 *  - Relationships are described as associations, never causes, and only
 *    with a minimum number of days on each side.
 */
import type { DailyData } from "@/lib/data/daily-repo";
import type { CheckIn, Challenge, Mission, MoodKey, WellnessState } from "@/lib/wellness-types";
import { addDays, lastDays } from "@/lib/daily-metrics";

// ───────────────────────── Types ─────────────────────────

export type Area =
  | "sleep" | "stress" | "energy" | "movement" | "hydration" | "nutrition"
  | "personal-time" | "social" | "routine";

export const AREA_LABEL: Record<Area, string> = {
  sleep: "Sleep", stress: "Stress", energy: "Energy", movement: "Movement",
  hydration: "Hydration", nutrition: "Nutrition", "personal-time": "Personal time",
  social: "Social connection", routine: "Daily routine",
};

export interface DaySignal {
  date: string;
  checkIn: CheckIn | null;
  mood: number | null;
  waterMl: number;
  proteinG: number;
  breathingMin: number;
  personalMin: number;
  rituals: { morning: boolean; midday: boolean; evening: boolean };
  missionsDone: number;
  /** Anything at all was recorded this day. */
  active: boolean;
}

export interface Fact { label: string; value: string }
export interface Observation { label: string; value: string; evidence: string }

export interface PersonalContext {
  stated: Fact[];
  observed: Observation[];
  /** How many of the last 14 days have any record. */
  activeDays14: number;
  checkInDays14: number;
  limitations: string;
  isNewUser: boolean;
  /** Days since the last record before today; null when there is none. */
  daysSinceLastActivity: number | null;
}

export type GapStatus = "gap" | "on-track" | "not-enough-data";
export type Priority = "high" | "medium" | "low";

export interface LifeGap {
  area: Area;
  objective: string;
  objectiveSource: "your goals" | "your check-ins" | "your habit targets" | "general wellbeing";
  observed: string;
  difference: string;
  evidence: string[];
  status: GapStatus;
  priority: Priority;
  /** 0 = aligned … 3 = large gap; null when there is not enough data. Explained in `difference`. */
  gapLevel: 0 | 1 | 2 | 3 | null;
  nextAction: string;
}

export interface Pattern {
  id: string;
  kind: "trend" | "association";
  title: string;
  detail: string;
  evidence: string;
  strength: "possible" | "worth monitoring";
}

export interface RecommendationCandidate {
  key: string;
  area: Area;
  headline: string;
  action: string;
  why: string;
  minutes: number;
  difficulty: "easy" | "moderate" | "stretch";
  benefit: string;
  /** In-app page that helps do it. */
  to: string;
  score: number;
}

export interface RecOutcome {
  rec_key: string | null;
  status: string;
  local_date: string | null;
  postponed_until: string | null;
}

export type MissionAdvice =
  | { kind: "ready"; message: string }
  | { kind: "easier"; message: string }
  | { kind: "returning"; message: string }
  | { kind: "steady"; message: string }
  | { kind: "new"; message: string };

export interface WeeklyReview {
  start: string;
  end: string;
  activeDays: number;
  checkInDays: number;
  averages: { mood: number | null; energy: number | null; stress: number | null; sleep: number | null };
  previousAverages: { mood: number | null; energy: number | null; stress: number | null; sleep: number | null };
  rituals: { morning: number; midday: number; evening: number };
  hydrationDays: number;
  waterTargetDays: number | null;
  proteinDays: number;
  breathingSessions: number;
  breathingMinutes: number;
  personalMinutes: number;
  missionCompletions: number;
  challengesActive: number;
  challengesCompleted: number;
  wentWell: string[];
  toImprove: string[];
  nextPriority: string;
  enoughData: boolean;
}

export interface Intelligence {
  today: string;
  days: DaySignal[];
  context: PersonalContext;
  gaps: LifeGap[];
  patterns: Pattern[];
  recommendations: RecommendationCandidate[];
  primary: RecommendationCandidate | null;
  secondary: RecommendationCandidate | null;
  overview: string;
  focus: string;
  suggestedChallenge: Challenge | null;
  missionAdvice: Record<string, MissionAdvice>;
}

// ───────────────────────── Helpers ─────────────────────────

const MOOD_SCORE: Record<MoodKey, number> = { great: 5, good: 4, okay: 3, "not-great": 2, bad: 1 };

const avg = (xs: number[]): number | null =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;

const has = (s: string | undefined) => Boolean(s && s.trim());

function textMatches(text: string, words: string[]) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

// ───────────────────────── Signals ─────────────────────────

export function buildDaySignals(state: WellnessState, daily: DailyData | null, today: string, n = 28): DaySignal[] {
  const ciByDate = new Map(state.checkIns.map((c) => [c.date, c]));
  const missionDates = new Map<string, number>();
  for (const m of state.missions) for (const d of m.completionDates ?? []) missionDates.set(d, (missionDates.get(d) ?? 0) + 1);

  return lastDays(today, n).map((date) => {
    const ci = ciByDate.get(date) ?? null;
    const sum = <R extends { local_date: string }>(rows: R[] | undefined, v: (r: R) => number) =>
      (rows ?? []).reduce((a, r) => (r.local_date === date ? a + Number(v(r)) : a), 0);
    const ritualIds = new Set((daily?.ritualDone ?? []).filter((r) => r.local_date === date).map((r) => r.ritual_id));
    const sig: DaySignal = {
      date,
      checkIn: ci,
      mood: ci ? MOOD_SCORE[ci.mood] : null,
      waterMl: sum(daily?.hydration, (r) => r.amount_ml),
      proteinG: sum(daily?.protein, (r) => r.grams as number),
      breathingMin: Math.round(sum(daily?.breathing, (r) => r.duration_seconds) / 60),
      personalMin: sum(daily?.personal, (r) => r.minutes),
      rituals: { morning: ritualIds.has("r-morning"), midday: ritualIds.has("r-midday"), evening: ritualIds.has("r-evening") },
      missionsDone: missionDates.get(date) ?? 0,
      active: false,
    };
    sig.active = Boolean(
      ci || sig.waterMl || sig.proteinG || sig.breathingMin || sig.personalMin || sig.missionsDone ||
      sig.rituals.morning || sig.rituals.midday || sig.rituals.evening,
    );
    return sig;
  });
}

// ───────────────────────── Personal context ─────────────────────────

export function buildPersonalContext(state: WellnessState, daily: DailyData | null, days: DaySignal[]): PersonalContext {
  const p = state.profile;
  const stated: Fact[] = [];
  const add = (label: string, v: string) => { if (has(v)) stated.push({ label, value: v.trim() }); };
  add("Name", p.personal.name);
  add("Age", p.personal.age);
  add("Goals", p.personal.goals);
  add("Interests", p.personal.interests);
  add("Children", p.personal.children);
  add("Occupation", p.dailyLife.occupation);
  add("Working hours", p.dailyLife.workingHours);
  add("Responsibilities", p.dailyLife.responsibilities);
  add("Family responsibilities", p.dailyLife.familyResponsibilities);
  add("Free time", p.dailyLife.freeTime);
  add("Activity level", p.physical.activityLevel);
  add("Training experience", p.physical.trainingExperience);
  add("Physical limitations", p.physical.limitations);
  add("Pain", p.physical.pain);
  add("Nutrition habits", p.nutrition.habits);
  add("Nutrition goals", p.nutrition.goals);
  add("Dietary restrictions", p.nutrition.restrictions);
  add("Usual stress", p.mental.stress);
  add("Sleep routine", p.mental.sleepRoutine);
  add("Personal time", p.mental.personalTime);
  add("Social connection", p.mental.socialConnection);
  add("Hobbies", p.mental.hobbies);
  const prefs = daily?.prefs;
  if (prefs?.water_target_ml) stated.push({ label: "Daily water target", value: `${prefs.water_target_ml} ml` });
  if (prefs?.protein_target_g) stated.push({ label: "Daily protein target", value: `${prefs.protein_target_g} g (${prefs.protein_target_source === "professional" ? "set by a professional" : "your own"})` });
  if (prefs?.personal_time_goal_min) stated.push({ label: "Personal time goal", value: `${prefs.personal_time_goal_min} min per ${prefs.personal_time_goal_period === "weekly" ? "week" : "day"}` });

  const last14 = days.slice(0, 14);
  const cis = last14.filter((d) => d.checkIn);
  const observed: Observation[] = [];
  const obs = (label: string, values: number[], fmt: (a: number) => string) => {
    const a = avg(values);
    if (a !== null && values.length >= 3) observed.push({ label, value: fmt(a), evidence: `${values.length} check-ins in the last 14 days` });
  };
  obs("Average energy", cis.map((d) => d.checkIn!.energy), (a) => `${a} / 5`);
  obs("Average stress", cis.map((d) => d.checkIn!.stress), (a) => `${a} / 5`);
  obs("Average sleep quality", cis.map((d) => d.checkIn!.sleep), (a) => `${a} / 5`);
  obs("Average mood", cis.map((d) => d.mood!), (a) => `${a} / 5`);
  const waterDays = last14.filter((d) => d.waterMl > 0).length;
  if (waterDays) observed.push({ label: "Water logged", value: `${waterDays} of 14 days`, evidence: "hydration entries" });
  const personal = last14.reduce((a, d) => a + d.personalMin, 0);
  if (personal) observed.push({ label: "Personal time logged", value: `${personal} min in 14 days`, evidence: "personal time entries" });
  const morning = last14.filter((d) => d.rituals.morning).length;
  if (last14.some((d) => d.active)) observed.push({ label: "Morning Activation completed", value: `${morning} of 14 days`, evidence: "ritual completions" });

  const activeDays14 = last14.filter((d) => d.active).length;
  const lastActive = days.slice(1).find((d) => d.active);
  const daysSinceLastActivity = lastActive ? days.indexOf(lastActive) : null;
  return {
    stated, observed, activeDays14, checkInDays14: cis.length,
    limitations: [p.physical.limitations, p.physical.pain].filter(has).join("; "),
    isNewUser: days.filter((d) => d.active).length < 3,
    daysSinceLastActivity,
  };
}

// ───────────────────────── Life Gap Engine ─────────────────────────

/** Desired areas from the user's own words (goals, interests) and recurring check-in needs. */
export function desiredAreas(state: WellnessState, days: DaySignal[]): Map<Area, LifeGap["objectiveSource"]> {
  const p = state.profile;
  const goals = [p.personal.goals, p.nutrition.goals, p.mental.stress, p.mental.sleepRoutine, p.mental.personalTime].join(" ");
  const out = new Map<Area, LifeGap["objectiveSource"]>();
  const kw: [Area, string[]][] = [
    ["sleep", ["sleep", "rest", "tired"]],
    ["stress", ["stress", "calm", "anxious", "relax", "balance"]],
    ["energy", ["energy", "tired", "fatigue"]],
    ["movement", ["move", "active", "fit", "walk", "run", "train", "exercise", "weight"]],
    ["nutrition", ["eat", "nutrition", "diet", "protein", "food", "meal"]],
    ["personal-time", ["time for me", "personal time", "me time", "balance", "hobby", "read"]],
    ["social", ["friend", "family", "social", "connect"]],
  ];
  for (const [area, words] of kw) if (textMatches(goals, words)) out.set(area, "your goals");
  const needs = days.slice(0, 14).flatMap((d) => d.checkIn?.needs ?? []);
  const count = (k: string) => needs.filter((n) => n === k).length;
  if (count("calm") + count("switch-off") >= 3 && !out.has("stress")) out.set("stress", "your check-ins");
  if (count("move") >= 3 && !out.has("movement")) out.set("movement", "your check-ins");
  if (count("connect") >= 2 && !out.has("social")) out.set("social", "your check-ins");
  return out;
}

export function lifeGaps(state: WellnessState, daily: DailyData | null, days: DaySignal[]): LifeGap[] {
  const desired = desiredAreas(state, days);
  const last14 = days.slice(0, 14);
  const cis = last14.filter((d) => d.checkIn).map((d) => d.checkIn!);
  const prefs = daily?.prefs;
  const gaps: LifeGap[] = [];
  const noData = (area: Area, objective: string, src: LifeGap["objectiveSource"], need: string, next: string): LifeGap => ({
    area, objective, objectiveSource: src, observed: "Not enough records yet.",
    difference: `We can't tell yet — ${need}. Missing records are not treated as a problem.`,
    evidence: [], status: "not-enough-data", priority: "low", gapLevel: null, nextAction: next,
  });
  const scaleGap = (
    area: Area, objective: string, src: LifeGap["objectiveSource"], values: number[], higherIsBetter: boolean,
    word: string, next: string,
  ) => {
    if (values.length < 3) { gaps.push(noData(area, objective, src, "check in on at least 3 days", "Do today's check-in.")); return; }
    const a = avg(values)!;
    const bad = higherIsBetter ? values.filter((v) => v <= 2).length : values.filter((v) => v >= 4).length;
    const share = bad / values.length;
    const level = (share >= 0.6 ? 3 : share >= 0.4 ? 2 : share >= 0.2 ? 1 : 0) as 0 | 1 | 2 | 3;
    gaps.push({
      area, objective, objectiveSource: src,
      observed: `Average ${word} ${a} / 5 across ${values.length} check-ins.`,
      difference: level === 0
        ? `Your ${word} is mostly where you want it.`
        : `${bad} of ${values.length} check-ins reported ${higherIsBetter ? "low" : "high"} ${word}.`,
      evidence: [`${values.length} check-ins in the last 14 days`],
      status: level === 0 ? "on-track" : "gap",
      priority: level >= 2 ? "high" : level === 1 ? "medium" : "low",
      gapLevel: level, nextAction: next,
    });
  };

  if (desired.has("sleep") || cis.some((c) => c.sleep <= 2))
    scaleGap("sleep", "Better sleep", desired.get("sleep") ?? "your check-ins", cis.map((c) => c.sleep), true, "sleep quality",
      "Screens off 30 minutes before bed tonight and complete Evening Unwind.");
  if (desired.has("stress") || cis.some((c) => c.stress >= 4))
    scaleGap("stress", "Less stress", desired.get("stress") ?? "your check-ins", cis.map((c) => c.stress), false, "stress",
      "A 3-minute Relax breathing session at midday.");
  if (desired.has("energy") || cis.some((c) => c.energy <= 2))
    scaleGap("energy", "More energy", desired.get("energy") ?? "your check-ins", cis.map((c) => c.energy), true, "energy",
      "A 10-minute walk outside after lunch.");

  // Personal time — compare to the user's own goal; otherwise to stated wish.
  const ptWanted = desired.get("personal-time") ?? (prefs?.personal_time_goal_min ? "your habit targets" : null);
  if (ptWanted) {
    const total = last14.reduce((a, d) => a + d.personalMin, 0);
    const daysWith = last14.filter((d) => d.personalMin > 0).length;
    if (daysWith === 0 && last14.filter((d) => d.active).length < 5) {
      gaps.push(noData("personal-time", "More time for yourself", ptWanted, "log personal time on the Habits page", "Reserve 15 minutes for something you enjoy and log it."));
    } else {
      const goal = prefs?.personal_time_goal_min ?? 15;
      const weekly = prefs?.personal_time_goal_period === "weekly";
      const metDays = weekly ? null : last14.filter((d) => d.personalMin >= goal).length;
      const level = (weekly
        ? (total / 2 >= goal ? 0 : total / 2 >= goal / 2 ? 1 : total > 0 ? 2 : 3)
        : metDays! >= 10 ? 0 : metDays! >= 6 ? 1 : metDays! >= 2 ? 2 : 3) as 0 | 1 | 2 | 3;
      gaps.push({
        area: "personal-time", objective: weekly ? `${goal} min of personal time per week` : `${goal} min of personal time per day`,
        objectiveSource: ptWanted, observed: `${total} min logged on ${daysWith} of the last 14 days.`,
        difference: level === 0 ? "You're protecting time for yourself." : weekly
          ? `About ${Math.round(total / 2)} min per week against a goal of ${goal}.`
          : `Goal met on ${metDays} of 14 days.`,
        evidence: ["personal time entries, last 14 days"], status: level === 0 ? "on-track" : "gap",
        priority: level >= 2 ? "high" : level === 1 ? "medium" : "low", gapLevel: level,
        nextAction: "Reserve 15 minutes today for reading, a hobby or time outdoors.",
      });
    }
  }

  // Hydration — only against the user's own target.
  if (prefs?.water_target_ml) {
    const logged = last14.filter((d) => d.waterMl > 0);
    if (logged.length < 3) gaps.push(noData("hydration", `${prefs.water_target_ml} ml water a day`, "your habit targets", "log water on at least 3 days", "Log each glass of water today."));
    else {
      const met = logged.filter((d) => d.waterMl >= prefs.water_target_ml!).length;
      const share = met / logged.length;
      const level = (share >= 0.8 ? 0 : share >= 0.5 ? 1 : share >= 0.2 ? 2 : 3) as 0 | 1 | 2 | 3;
      gaps.push({
        area: "hydration", objective: `${prefs.water_target_ml} ml water a day`, objectiveSource: "your habit targets",
        observed: `Target reached on ${met} of ${logged.length} days you logged water.`,
        difference: level === 0 ? "You're consistently reaching your target." : `Average on logged days: ${Math.round(logged.reduce((a, d) => a + d.waterMl, 0) / logged.length)} ml.`,
        evidence: [`${logged.length} days with water entries`], status: level === 0 ? "on-track" : "gap",
        priority: level >= 2 ? "medium" : "low", gapLevel: level,
        nextAction: "Keep a glass of water next to you and drink one with each meal.",
      });
    }
  }

  if (desired.has("movement")) {
    const walk = state.missions.find((m) => m.area === "movement" || m.area === "training");
    const done = state.missions.filter((m) => m.area === "movement" || m.area === "training")
      .flatMap((m) => m.completionDates ?? []).filter((d) => d >= days[13]!.date).length;
    if (done === 0 && last14.filter((d) => d.active).length < 5) gaps.push(noData("movement", "Move more", desired.get("movement")!, "complete movement missions or check in a few times", "Walk for 10 minutes today."));
    else {
      const level = (done >= 8 ? 0 : done >= 4 ? 1 : done >= 1 ? 2 : 3) as 0 | 1 | 2 | 3;
      gaps.push({
        area: "movement", objective: "Move more", objectiveSource: desired.get("movement")!,
        observed: `${done} movement mission completion${done === 1 ? "" : "s"} in 14 days.`,
        difference: level === 0 ? "Movement is a regular part of your days." : "Movement isn't showing up regularly in your records yet.",
        evidence: ["movement and training mission completions"], status: level === 0 ? "on-track" : "gap",
        priority: level >= 2 ? "medium" : "low", gapLevel: level,
        nextAction: walk ? `Mission: ${walk.title} — ${walk.target}.` : "Walk for 10 minutes today.",
      });
    }
  }

  if (desired.has("social")) {
    const connectNeeds = days.slice(0, 14).filter((d) => d.checkIn?.needs.includes("connect")).length;
    gaps.push({
      area: "social", objective: "Stronger connection with people", objectiveSource: desired.get("social")!,
      observed: connectNeeds ? `You asked for connection on ${connectNeeds} check-ins.` : "No connection-related records yet.",
      difference: connectNeeds >= 2 ? "Connection keeps coming up as a need." : "Not enough records to judge.",
      evidence: connectNeeds ? ["check-in needs"] : [], status: connectNeeds >= 2 ? "gap" : "not-enough-data",
      priority: connectNeeds >= 3 ? "medium" : "low", gapLevel: connectNeeds >= 2 ? (connectNeeds >= 4 ? 2 : 1) : null,
      nextAction: "Call or message one person you haven't spoken to this week.",
    });
  }

  const rank = { high: 0, medium: 1, low: 2 } as const;
  const statusRank = { gap: 0, "not-enough-data": 1, "on-track": 2 } as const;
  return gaps.sort((a, b) => statusRank[a.status] - statusRank[b.status] || rank[a.priority] - rank[b.priority] || (b.gapLevel ?? -1) - (a.gapLevel ?? -1));
}

// ───────────────────────── Patterns ─────────────────────────

const MIN_GROUP = 4;

function compare(
  days: DaySignal[], id: string, title: string,
  split: (d: DaySignal) => boolean | null, measure: (d: DaySignal) => number | null,
  yesLabel: string, noLabel: string, measureLabel: string, higherIsBetter: boolean,
): Pattern | null {
  const yes: number[] = []; const no: number[] = [];
  for (const d of days) {
    const s = split(d); const m = measure(d);
    if (s === null || m === null) continue;
    (s ? yes : no).push(m);
  }
  if (yes.length < MIN_GROUP || no.length < MIN_GROUP) return null;
  const a = avg(yes)!; const b = avg(no)!;
  const diff = Math.round((a - b) * 10) / 10;
  if (Math.abs(diff) < 0.5) return null;
  const better = higherIsBetter ? diff > 0 : diff < 0;
  return {
    id, kind: "association", title,
    detail: `On ${yesLabel}, your ${measureLabel} averaged ${a} / 5, compared with ${b} / 5 on ${noLabel}. ${better ? "This appears to coincide with feeling better" : "This appears to coincide with feeling worse"} — it's an association, not proof of cause.`,
    evidence: `${yes.length} days vs ${no.length} days in the last 28`,
    strength: Math.abs(diff) >= 1 && yes.length + no.length >= 12 ? "worth monitoring" : "possible",
  };
}

export function findPatterns(days: DaySignal[]): Pattern[] {
  const out: Pattern[] = [];
  const thisWeek = days.slice(0, 7); const lastWeek = days.slice(7, 14);
  const trend = (label: string, f: (d: DaySignal) => number | null, higherIsBetter: boolean) => {
    const a = thisWeek.map(f).filter((x): x is number => x !== null);
    const b = lastWeek.map(f).filter((x): x is number => x !== null);
    if (a.length < 3 || b.length < 3) return;
    const diff = Math.round((avg(a)! - avg(b)!) * 10) / 10;
    if (Math.abs(diff) < 0.5) return;
    const improving = higherIsBetter ? diff > 0 : diff < 0;
    out.push({
      id: `trend-${label}`, kind: "trend",
      title: `${label[0]!.toUpperCase()}${label.slice(1)} ${improving ? "is improving" : "has dipped"}`,
      detail: `Your ${label} averaged ${avg(a)} / 5 this week, compared with ${avg(b)} / 5 the week before.`,
      evidence: `${a.length} + ${b.length} check-ins`, strength: Math.abs(diff) >= 1 ? "worth monitoring" : "possible",
    });
  };
  trend("mood", (d) => d.mood, true);
  trend("energy", (d) => d.checkIn?.energy ?? null, true);
  trend("stress", (d) => d.checkIn?.stress ?? null, false);
  trend("sleep quality", (d) => d.checkIn?.sleep ?? null, true);

  const p = [
    compare(days, "sleep-energy", "Sleep and energy",
      (d) => (d.checkIn ? d.checkIn.sleep >= 4 : null), (d) => d.checkIn?.energy ?? null,
      "days after good sleep", "other days", "energy", true),
    compare(days, "morning-motivation", "Morning Activation and motivation",
      (d) => (d.checkIn ? d.rituals.morning : null), (d) => d.checkIn?.motivation ?? null,
      "days you completed Morning Activation", "days you didn't", "motivation", true),
    compare(days, "personal-stress", "Personal time and stress",
      (d) => (d.checkIn ? d.personalMin >= 15 : null), (d) => d.checkIn?.stress ?? null,
      "days with 15+ minutes of personal time", "other days", "stress", false),
    compare(days, "water-energy", "Hydration tracking and energy",
      (d) => (d.checkIn ? d.waterMl > 0 : null), (d) => d.checkIn?.energy ?? null,
      "days you logged water", "days you didn't", "energy", true),
    compare(days, "breathing-stress", "Breathing and stress",
      (d) => (d.checkIn ? d.breathingMin > 0 : null), (d) => d.checkIn?.stress ?? null,
      "days with a breathing session", "days without", "stress", false),
  ];
  for (const x of p) if (x) out.push(x);
  return out;
}

// ───────────────────────── Missions ─────────────────────────

/** Progression advice from actual recorded behaviour — never from elapsed time alone. */
export function adviseMission(m: Mission, today: string): MissionAdvice {
  const dates = m.completionDates ?? [];
  if (m.status !== "active") return { kind: "new", message: "Start when it fits — you begin at the first step." };
  const last14 = dates.filter((d) => d > addDays(today, -14)).length;
  const last = dates[0];
  const per = m.daysPerStep ?? 3;
  if (last && last <= addDays(today, -14)) {
    return { kind: "returning", message: `Welcome back. It's been a while since you last did this${m.step > 1 ? " — you can restart one step lower to ease back in" : ""}.` };
  }
  const startedDaysAgo = m.startedAt ? Math.floor((Date.parse(today) - Date.parse(m.startedAt.slice(0, 10))) / 86_400_000) : 0;
  if (startedDaysAgo >= 10 && last14 <= 1) {
    return m.step > 1
      ? { kind: "easier", message: "This step seems hard to fit in right now. A smaller target is still progress." }
      : { kind: "easier", message: "This hasn't fitted into your days yet. Try doing just part of it — any amount counts." };
  }
  if ((m.stepDays ?? 0) >= per - 1 && last14 >= per) {
    return { kind: "ready", message: `You've been consistent — one more completion moves you to the next level.` };
  }
  return { kind: "steady", message: `${m.stepDays ?? 0} of ${per} completions at this level. The next level unlocks when you've done it ${per} times.` };
}

// ───────────────────────── Challenges ─────────────────────────

const STRENUOUS = ["stairs", "run", "train", "walk"];

export function suggestChallenge(
  state: WellnessState, daily: DailyData | null, gaps: LifeGap[], limitations: string, today: string,
): Challenge | null {
  const active = (daily?.userChallenges ?? []).filter((u) => u.status === "active");
  if (active.length >= 3) return null; // don't overload
  const joined = new Set(active.map((u) => u.challenge_id));
  const recentlyFinished = new Set((daily?.userChallenges ?? [])
    .filter((u) => u.status !== "active" && u.ends_on >= addDays(today, -14)).map((u) => u.challenge_id));
  const areaWords: Partial<Record<Area, string[]>> = {
    stress: ["outside", "phone", "breath", "calm", "relax"], sleep: ["sleep", "bed", "screen", "phone"],
    energy: ["outside", "walk", "water"], "personal-time": ["read", "pages", "hobby", "outside"],
    hydration: ["water", "hydrat"], movement: ["walk", "stairs", "move"], social: ["call", "friend"],
    nutrition: ["cook", "meal", "protein"],
  };
  const topAreas = gaps.filter((g) => g.status === "gap").map((g) => g.area);
  const candidates = state.challenges.filter((c) =>
    !joined.has(c.id) && !recentlyFinished.has(c.id) && !(c.completed && c.completedDate === today) &&
    !(limitations && textMatches(`${c.title} ${c.detail}`, STRENUOUS)),
  );
  for (const area of topAreas) {
    const words = areaWords[area] ?? [];
    const hit = candidates.find((c) => textMatches(`${c.title} ${c.detail} ${c.category ?? ""}`, words));
    if (hit) return hit;
  }
  return candidates.find((c) => c.cadence === "daily" || !c.cadence) ?? null;
}

// ───────────────────────── Recommendations ─────────────────────────

export function buildRecommendations(
  state: WellnessState, daily: DailyData | null, days: DaySignal[], gaps: LifeGap[], ctx: PersonalContext,
  outcomes: RecOutcome[], today: string,
): RecommendationCandidate[] {
  const ci = days[0]?.checkIn ?? null;
  const out: RecommendationCandidate[] = [];
  const push = (c: RecommendationCandidate) => out.push(c);
  const recentStress = days.slice(0, 3).filter((d) => d.checkIn && d.checkIn.stress >= 4).length;
  const recentPoorSleep = days.slice(0, 3).filter((d) => d.checkIn && d.checkIn.sleep <= 2).length;

  if (!ci) push({
    key: "check-in", area: "routine", headline: "Start with a 1-minute check-in",
    action: "Tell Smarty how you feel today.", why: "Today's guidance depends on how you actually feel, not on guesses.",
    minutes: 1, difficulty: "easy", benefit: "Every recommendation after this fits your day.", to: "/check-in", score: 100,
  });

  if (ci && ci.stress >= 4 && ci.sleep <= 2) push({
    key: "recovery-day", area: "stress", headline: "Make today a lighter, recovery-focused day",
    action: "A 5-minute Relax breathing session now, then keep the rest of the day manageable.",
    why: `You reported high stress (${ci.stress}/5) and poor sleep (${ci.sleep}/5) today${recentStress >= 2 && recentPoorSleep >= 2 ? ", and the same combination on recent days" : ""}.`,
    minutes: 5, difficulty: "easy", benefit: "Lowers the load so tonight's sleep has a better chance.", to: "/breathing", score: 95,
  });
  else if (ci && ci.stress >= 4) push({
    key: "calm-breathing", area: "stress", headline: "Bring your stress down a notch",
    action: "Do a 3-minute Relax breathing session.", why: `You reported high stress (${ci.stress}/5) today.`,
    minutes: 3, difficulty: "easy", benefit: "A short, reliable way to reset during a tense day.", to: "/breathing", score: 85,
  });
  else if (ci && ci.sleep <= 2) push({
    key: "protect-sleep", area: "sleep", headline: "Protect tonight's sleep",
    action: "Screens off 30 minutes before bed and finish Evening Unwind.", why: `You reported poor sleep (${ci.sleep}/5).`,
    minutes: 15, difficulty: "easy", benefit: "Tomorrow's energy starts tonight.", to: "/evening", score: 80,
  });
  if (ci && ci.energy <= 2 && ci.stress < 4) push({
    key: "energy-walk", area: "energy", headline: "Get a little daylight",
    action: "Walk outside for 10 minutes.", why: `Your energy is low (${ci.energy}/5) and stress isn't high, so gentle movement is realistic.`,
    minutes: 10, difficulty: "easy", benefit: "Light movement and daylight often lift energy for a few hours.", to: "/habits", score: 70,
  });
  if (ci && ci.energy >= 4 && ci.motivation >= 4) push({
    key: "use-energy", area: "movement", headline: "You have energy — use it",
    action: "Complete one training session or a 30-minute walk today.", why: `You reported good energy (${ci.energy}/5) and motivation (${ci.motivation}/5).`,
    minutes: 30, difficulty: "moderate", benefit: "Good days are the easiest days to build consistency.", to: "/missions", score: 65,
  });

  // Morning Activation repeatedly skipped while the user is otherwise active.
  const last7 = days.slice(0, 7);
  const activeNoMorning = last7.filter((d) => d.active && !d.rituals.morning).length;
  if (last7.filter((d) => d.active).length >= 4 && activeNoMorning >= 4) push({
    key: "simpler-morning", area: "routine", headline: "Make your morning routine smaller",
    action: "Open Morning Activation, tap Customise and keep only two activities.",
    why: `You've been active on ${last7.filter((d) => d.active).length} days this week but skipped Morning Activation on ${activeNoMorning}. It may be too long for your mornings.`,
    minutes: 3, difficulty: "easy", benefit: "A routine you actually do beats a perfect one you skip.", to: "/morning", score: 60,
  });

  for (const g of gaps.filter((x) => x.status === "gap").slice(0, 3)) {
    const to: Record<Area, string> = {
      sleep: "/evening", stress: "/breathing", energy: "/habits", movement: "/missions", hydration: "/habits",
      nutrition: "/habits", "personal-time": "/habits", social: "/challenges", routine: "/today",
    };
    push({
      key: `gap-${g.area}`, area: g.area, headline: `${AREA_LABEL[g.area]}: close the gap`,
      action: g.nextAction, why: `${g.objective} matters to you (from ${g.objectiveSource}). ${g.observed}`,
      minutes: g.area === "personal-time" ? 15 : 10, difficulty: "easy",
      benefit: "A small, repeatable step towards what you said you want.", to: to[g.area],
      score: g.priority === "high" ? 75 : g.priority === "medium" ? 55 : 35,
    });
  }

  // Consistent user → introduce a next challenge.
  if (ctx.activeDays14 >= 10) push({
    key: "next-challenge", area: "routine", headline: "You've been consistent — try a new challenge",
    action: "Pick one challenge for this week.", why: `You've recorded activity on ${ctx.activeDays14} of the last 14 days.`,
    minutes: 10, difficulty: "moderate", benefit: "Builds on momentum without changing everything.", to: "/challenges", score: 45,
  });

  if (ctx.daysSinceLastActivity !== null && ctx.daysSinceLastActivity >= 7) push({
    key: "welcome-back", area: "routine", headline: "Welcome back — start small",
    action: "Do today's check-in and one 2-minute breathing session. That's enough for today.",
    why: `It's been ${ctx.daysSinceLastActivity} days since your last record. Easing back in works better than catching up.`,
    minutes: 3, difficulty: "easy", benefit: "Restarts the habit without pressure.", to: "/check-in", score: 90,
  });

  // Learn from outcomes: drop anything dismissed/postponed for today; damp keys dismissed often.
  const blocked = new Set(outcomes.filter((o) =>
    (o.status === "dismissed" && o.local_date === today) ||
    (o.status === "postponed" && (o.postponed_until ?? "") > today) ||
    (o.status === "completed" && o.local_date === today),
  ).map((o) => o.rec_key));
  const dismissCount = new Map<string, number>();
  for (const o of outcomes) if (o.status === "dismissed" && o.rec_key) dismissCount.set(o.rec_key, (dismissCount.get(o.rec_key) ?? 0) + 1);
  const completedCount = new Map<string, number>();
  for (const o of outcomes) if (o.status === "completed" && o.rec_key) completedCount.set(o.rec_key, (completedCount.get(o.rec_key) ?? 0) + 1);

  const seen = new Set<string>();
  return out
    .filter((c) => !blocked.has(c.key) || c.key === "check-in")
    .map((c) => ({ ...c, score: c.score - 10 * (dismissCount.get(c.key) ?? 0) + 3 * Math.min(3, completedCount.get(c.key) ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .filter((c) => { if (seen.has(c.area)) return false; seen.add(c.area); return true; });
}

// ───────────────────────── Weekly review ─────────────────────────

export function weeklyReview(state: WellnessState, daily: DailyData | null, today: string, weekOffset = 0): WeeklyReview {
  const all = buildDaySignals(state, daily, today, 35);
  const week = all.slice(weekOffset * 7, weekOffset * 7 + 7);
  const prev = all.slice(weekOffset * 7 + 7, weekOffset * 7 + 14);
  const averages = (ds: DaySignal[]) => {
    const c = ds.filter((d) => d.checkIn);
    return {
      mood: avg(c.map((d) => d.mood!)), energy: avg(c.map((d) => d.checkIn!.energy)),
      stress: avg(c.map((d) => d.checkIn!.stress)), sleep: avg(c.map((d) => d.checkIn!.sleep)),
    };
  };
  const start = week[week.length - 1]!.date; const end = week[0]!.date;
  const target = daily?.prefs?.water_target_ml ?? null;
  const ucs = daily?.userChallenges ?? [];
  const r: WeeklyReview = {
    start, end,
    activeDays: week.filter((d) => d.active).length,
    checkInDays: week.filter((d) => d.checkIn).length,
    averages: averages(week), previousAverages: averages(prev),
    rituals: {
      morning: week.filter((d) => d.rituals.morning).length,
      midday: week.filter((d) => d.rituals.midday).length,
      evening: week.filter((d) => d.rituals.evening).length,
    },
    hydrationDays: week.filter((d) => d.waterMl > 0).length,
    waterTargetDays: target ? week.filter((d) => d.waterMl >= target).length : null,
    proteinDays: week.filter((d) => d.proteinG > 0).length,
    breathingSessions: (daily?.breathing ?? []).filter((b) => b.local_date >= start && b.local_date <= end).length,
    breathingMinutes: week.reduce((a, d) => a + d.breathingMin, 0),
    personalMinutes: week.reduce((a, d) => a + d.personalMin, 0),
    missionCompletions: week.reduce((a, d) => a + d.missionsDone, 0),
    challengesActive: ucs.filter((u) => u.started_on <= end && u.ends_on >= start && u.status === "active").length,
    challengesCompleted: ucs.filter((u) => u.completed_at && u.completed_at.slice(0, 10) >= start && u.completed_at.slice(0, 10) <= end).length,
    wentWell: [], toImprove: [], nextPriority: "", enoughData: false,
  };
  r.enoughData = r.activeDays >= 3;
  const a = r.averages; const p = r.previousAverages;
  if (r.activeDays >= 5) r.wentWell.push(`You recorded something on ${r.activeDays} of 7 days — that consistency is the foundation.`);
  if (a.stress !== null && p.stress !== null && a.stress < p.stress - 0.4) r.wentWell.push(`Stress eased: ${p.stress} → ${a.stress} / 5.`);
  if (a.energy !== null && p.energy !== null && a.energy > p.energy + 0.4) r.wentWell.push(`Energy rose: ${p.energy} → ${a.energy} / 5.`);
  if (a.sleep !== null && p.sleep !== null && a.sleep > p.sleep + 0.4) r.wentWell.push(`Sleep quality improved: ${p.sleep} → ${a.sleep} / 5.`);
  if (r.rituals.evening >= 4) r.wentWell.push(`Evening Unwind on ${r.rituals.evening} evenings.`);
  if (r.breathingSessions >= 3) r.wentWell.push(`${r.breathingSessions} breathing sessions (${r.breathingMinutes} min).`);
  if (r.missionCompletions >= 4) r.wentWell.push(`${r.missionCompletions} mission completions.`);
  if (r.waterTargetDays !== null && r.waterTargetDays >= 4) r.wentWell.push(`Water target reached on ${r.waterTargetDays} days.`);

  if (a.stress !== null && a.stress >= 3.5) r.toImprove.push(`Stress averaged ${a.stress} / 5 — a short daily breathing session is a realistic counterweight.`);
  if (a.sleep !== null && a.sleep <= 2.5) r.toImprove.push(`Sleep quality averaged ${a.sleep} / 5 — a calmer last half hour before bed is a good place to start.`);
  if (r.activeDays >= 4 && r.rituals.morning <= 1) r.toImprove.push(`Morning Activation happened on ${r.rituals.morning} day${r.rituals.morning === 1 ? "" : "s"} — consider a shorter version.`);
  if (r.waterTargetDays !== null && r.hydrationDays >= 3 && r.waterTargetDays <= 1) r.toImprove.push("Water is logged but rarely reaches your target.");
  if (r.activeDays >= 3 && r.personalMinutes < 30) r.toImprove.push(`Only ${r.personalMinutes} min of personal time logged.`);
  if (!r.enoughData) r.toImprove.push("Not enough records this week to see patterns — a daily check-in is the simplest way to change that.");

  const gaps = lifeGaps(state, daily, all.slice(weekOffset * 7));
  const top = gaps.find((g) => g.status === "gap");
  r.nextPriority = top ? `${AREA_LABEL[top.area]}: ${top.nextAction}` : r.enoughData ? "Keep the same rhythm — it's working." : "Check in daily so next week's review can say more.";
  return r;
}

// ───────────────────────── Orchestrator ─────────────────────────

export function analyse(state: WellnessState, daily: DailyData | null, today: string, outcomes: RecOutcome[] = []): Intelligence {
  const days = buildDaySignals(state, daily, today);
  const context = buildPersonalContext(state, daily, days);
  const gaps = lifeGaps(state, daily, days);
  const patterns = findPatterns(days);
  const recommendations = buildRecommendations(state, daily, days, gaps, context, outcomes, today);
  const missionAdvice: Record<string, MissionAdvice> = {};
  for (const m of state.missions) missionAdvice[m.id] = adviseMission(m, today);

  const ci = days[0]?.checkIn;
  const topGap = gaps.find((g) => g.status === "gap");
  let overview: string;
  if (context.isNewUser) overview = "You're just getting started. A few days of check-ins will let Smarty understand your patterns.";
  else if (ci) {
    const parts: string[] = [];
    if (ci.stress >= 4) parts.push("stress is high"); else if (ci.stress <= 2) parts.push("stress is low");
    if (ci.energy <= 2) parts.push("energy is low"); else if (ci.energy >= 4) parts.push("energy is good");
    if (ci.sleep <= 2) parts.push("sleep was poor"); else if (ci.sleep >= 4) parts.push("you slept well");
    overview = parts.length ? `Today ${parts.join(", ")}. You've been active on ${context.activeDays14} of the last 14 days.` : `A steady day so far. You've been active on ${context.activeDays14} of the last 14 days.`;
  } else overview = `You've been active on ${context.activeDays14} of the last 14 days. Check in to tailor today.`;
  const primary = recommendations[0] ?? null;
  const focus = primary ? AREA_LABEL[primary.area] : topGap ? AREA_LABEL[topGap.area] : "Consistency";

  return {
    today, days, context, gaps, patterns, recommendations, primary,
    secondary: recommendations[1] ?? null, overview, focus,
    suggestedChallenge: suggestChallenge(state, daily, gaps, context.limitations, today),
    missionAdvice,
  };
}

/** Compact, factual summary for Smarty Coach. Labels separate stated / observed / suggested. */
export function contextForCoach(intel: Intelligence, state: WellnessState): string {
  const L: string[] = [];
  L.push(`Today (user's local date): ${intel.today}`);
  L.push("\n## What the user told us (stated)");
  L.push(intel.context.stated.length ? intel.context.stated.map((f) => `- ${f.label}: ${f.value}`).join("\n") : "- Profile mostly empty.");
  L.push("\n## Recent check-ins (most recent first, scales 1-5; stress 5 = very stressed)");
  const cis = intel.days.filter((d) => d.checkIn).slice(0, 10);
  L.push(cis.length ? cis.map((d) => `- ${d.date}: mood ${d.checkIn!.mood}, energy ${d.checkIn!.energy}, stress ${d.checkIn!.stress}, sleep ${d.checkIn!.sleep}, motivation ${d.checkIn!.motivation}${d.checkIn!.needs.length ? `, needs: ${d.checkIn!.needs.join("/")}` : ""}${d.checkIn!.note ? `, note: "${d.checkIn!.note.slice(0, 200)}"` : ""}`).join("\n") : "- No check-ins recorded in the last 28 days.");
  L.push("\n## Calculated from records (observed)");
  L.push(intel.context.observed.length ? intel.context.observed.map((o) => `- ${o.label}: ${o.value} (${o.evidence})`).join("\n") : "- Too few records to calculate anything yet.");
  L.push(`- Active on ${intel.context.activeDays14} of last 14 days${intel.context.daysSinceLastActivity !== null && intel.context.daysSinceLastActivity > 2 ? `; last activity ${intel.context.daysSinceLastActivity} days ago` : ""}.`);
  L.push("\n## Life gaps (desired vs actual)");
  L.push(intel.gaps.length ? intel.gaps.map((g) => `- ${AREA_LABEL[g.area]} [${g.status}${g.status === "gap" ? `, priority ${g.priority}` : ""}]: wants "${g.objective}" (from ${g.objectiveSource}); observed: ${g.observed} ${g.difference} Next: ${g.nextAction}`).join("\n") : "- No goals stated yet, so no gaps can be assessed.");
  L.push("\n## Possible patterns (associations only, never causes)");
  L.push(intel.patterns.length ? intel.patterns.map((p) => `- ${p.title}: ${p.detail} (${p.evidence})`).join("\n") : "- Not enough data for patterns yet.");
  L.push("\n## Missions");
  const ms = state.missions.filter((m) => m.status === "active" || m.status === "paused");
  L.push(ms.length ? ms.map((m) => `- ${m.title} [${m.status}] level ${m.step}/${m.totalSteps}, target "${m.target}", ${m.totalCompletions ?? 0} completions total. Advice: ${intel.missionAdvice[m.id]?.message ?? ""}`).join("\n") : "- No active missions.");
  L.push("\n## App's current suggestions (suggested)");
  if (intel.primary) L.push(`- Primary: ${intel.primary.action} — why: ${intel.primary.why}`);
  if (intel.secondary) L.push(`- Secondary: ${intel.secondary.action} — why: ${intel.secondary.why}`);
  if (intel.suggestedChallenge) L.push(`- Suggested challenge: ${intel.suggestedChallenge.title}`);
  return L.join("\n");
}
