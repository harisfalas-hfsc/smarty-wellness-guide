/**
 * Personal development engine — pure functions (unit-tested).
 * Goal progress, experiment analysis, journey timeline, long-term analytics
 * and personal development reviews, all computed from real records only.
 */
import type { CheckIn, Mission, MoodKey, WellnessState } from "@/lib/wellness-types";
import type { DevelopmentData, Goal, GoalAction, Milestone, UserExperiment, ExperimentLog, Measure } from "@/lib/data/development-repo";
import { addDays } from "@/lib/daily-metrics";

const MOOD: Record<MoodKey, number> = { great: 5, good: 4, okay: 3, "not-great": 2, bad: 1 };
const avg = (xs: number[]): number | null => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export const GOAL_CATEGORIES = [
  "Physical wellbeing", "Health and fitness", "Personal development", "Learning and education",
  "Family and relationships", "Social connections", "Career and professional", "Travel and experiences",
  "Hobbies and interests", "Financial and lifestyle", "Mental wellbeing", "Other",
] as const;

export const LINKABLE_AREAS = [
  { value: "movement", label: "Movement & training" }, { value: "sleep", label: "Sleep" },
  { value: "stress", label: "Stress & calm" }, { value: "hydration", label: "Hydration" },
  { value: "nutrition", label: "Nutrition" }, { value: "personal-time", label: "Personal time" },
  { value: "social", label: "Social connection" }, { value: "routine", label: "Daily routine" },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started", planned: "Planned", active: "Active", paused: "Paused", completed: "Completed", cancelled: "Cancelled",
};

export const MEASURE_LABEL: Record<Measure, string> = { energy: "Energy", stress: "Stress", sleep: "Sleep quality", mood: "Mood", motivation: "Motivation" };

export function measureOf(c: CheckIn, m: Measure): number {
  return m === "mood" ? MOOD[c.mood] : c[m];
}

// ───────────── Goals ─────────────

const MISSION_AREA: Record<Mission["area"], string> = {
  movement: "movement", training: "movement", sleep: "sleep", mind: "stress", hydration: "hydration",
  nutrition: "nutrition", personal: "personal-time", development: "personal-time", social: "social",
};

export interface GoalProgress {
  pct: number;
  method: string;
  milestonesDone: number;
  milestonesTotal: number;
  actionsDone: number;
  actionsTotal: number;
  /** Relevant recorded activity since the goal was created (does NOT change pct). */
  contribution: { label: string; count: number }[];
  timeElapsedPct: number | null;
  daysLeft: number | null;
  inactiveDays: number;
  nextMilestone: Milestone | null;
}

export function goalProgress(goal: Goal, milestones: Milestone[], actions: GoalAction[], state: WellnessState, dev: DevelopmentData | null, today: string): GoalProgress {
  const ms = milestones.filter((m) => m.goal_id === goal.id);
  const as = actions.filter((a) => a.goal_id === goal.id);
  const mDone = ms.filter((m) => m.done_at).length;
  let pct: number; let method: string;
  if (goal.status === "completed") { pct = 100; method = "Goal marked as completed."; }
  else if (goal.progress_mode === "milestones" && ms.length) {
    pct = Math.round((mDone / ms.length) * 100);
    method = `${mDone} of ${ms.length} milestones completed. Progress only moves when you complete a milestone.`;
  } else if (goal.progress_mode === "milestones") { pct = 0; method = "Add milestones — progress is the share of milestones you complete."; }
  else { pct = goal.progress; method = "You set this progress yourself."; }

  const since = goal.created_at.slice(0, 10);
  const linked = new Set(goal.linked_areas);
  const contribution: GoalProgress["contribution"] = [];
  if (linked.size) {
    const missionCount = state.missions.filter((m) => linked.has(MISSION_AREA[m.area]))
      .reduce((a, m) => a + (m.completionDates ?? []).filter((d) => d >= since).length, 0);
    if (missionCount) contribution.push({ label: "related mission completions", count: missionCount });
    const h = dev?.history;
    if (h && linked.has("stress")) { const n = h.breathing.filter((b) => b.local_date >= since).length; if (n) contribution.push({ label: "breathing sessions", count: n }); }
    if (h && linked.has("hydration")) { const n = new Set(h.hydration.filter((b) => b.local_date >= since).map((b) => b.local_date)).size; if (n) contribution.push({ label: "days with water logged", count: n }); }
    if (h && linked.has("personal-time")) { const n = h.personal.filter((b) => b.local_date >= since).reduce((a, b) => a + b.minutes, 0); if (n) contribution.push({ label: "minutes of personal time", count: n }); }
    if (h && linked.has("routine")) { const n = h.rituals.filter((b) => b.local_date >= since).length; if (n) contribution.push({ label: "rituals completed", count: n }); }
    if (h && linked.has("sleep")) { const n = h.rituals.filter((b) => b.local_date >= since && b.ritual_id === "r-evening").length; if (n) contribution.push({ label: "Evening Unwinds", count: n }); }
  }
  let timeElapsedPct: number | null = null; let daysLeft: number | null = null;
  if (goal.target_on) {
    const total = Math.max(1, dayDiff(since, goal.target_on));
    timeElapsedPct = Math.max(0, Math.min(100, Math.round((dayDiff(since, today) / total) * 100)));
    daysLeft = dayDiff(today, goal.target_on);
  }
  const lastEvent = dev?.events.find((e) => e.goal_id === goal.id)?.created_at.slice(0, 10) ?? since;
  return {
    pct, method, milestonesDone: mDone, milestonesTotal: ms.length,
    actionsDone: as.filter((a) => a.done_at).length, actionsTotal: as.length, contribution,
    timeElapsedPct, daysLeft, inactiveDays: dayDiff(lastEvent, today),
    nextMilestone: ms.filter((m) => !m.done_at).sort((a, b) => (a.target_on ?? "9999").localeCompare(b.target_on ?? "9999"))[0] ?? null,
  };
}

export interface GoalPatterns {
  /** Goals created but never acted on (no milestone done, no action done) for 21+ days. */
  stalled: Goal[];
  /** Active goals untouched for 45+ days — ask if still relevant, never auto-change. */
  inactive: Goal[];
  abandonedCount: number;
  completedCount: number;
  message: string | null;
}

export function goalPatterns(dev: DevelopmentData, today: string): GoalPatterns {
  const live = dev.goals.filter((g) => g.status === "active" || g.status === "planned" || g.status === "not_started");
  const acted = (g: Goal) => dev.milestones.some((m) => m.goal_id === g.id && m.done_at) || dev.actions.some((a) => a.goal_id === g.id && a.done_at) || g.progress > 0;
  const stalled = live.filter((g) => !acted(g) && dayDiff(g.created_at.slice(0, 10), today) >= 21);
  const inactive = dev.goals.filter((g) => g.status === "active" && (() => {
    const last = dev.events.find((e) => e.goal_id === g.id)?.created_at.slice(0, 10) ?? g.created_at.slice(0, 10);
    return dayDiff(last, today) >= 45;
  })());
  const abandonedCount = dev.goals.filter((g) => g.status === "cancelled").length;
  const completedCount = dev.goals.filter((g) => g.status === "completed").length;
  let message: string | null = null;
  if (stalled.length >= 2) message = `${stalled.length} goals haven't had a first step yet. Picking one and adding a single small milestone usually works better than planning all of them.`;
  else if (abandonedCount >= 3 && abandonedCount > completedCount) message = "Several goals have been cancelled. Smaller, shorter goals may be easier to finish — that's not a failure, just a better fit.";
  else if (completedCount >= 2) message = `You've completed ${completedCount} goals. That's real follow-through.`;
  return { stalled, inactive, abandonedCount, completedCount, message };
}

// ───────────── Experiments ─────────────

export function baselineFor(checkIns: CheckIn[], measure: Measure, start: string): { avg: number | null; days: number; from: string; to: string } {
  const from = addDays(start, -14); const to = addDays(start, -1);
  const vals = checkIns.filter((c) => c.date >= from && c.date <= to).map((c) => measureOf(c, measure));
  return { avg: avg(vals), days: vals.length, from, to };
}

export interface ExperimentAnalysis {
  title: string;
  duration: number;
  elapsed: number;
  daysDone: number;
  daysMissed: number;
  adherencePct: number | null;
  baseline: { avg: number | null; days: number };
  during: { avg: number | null; days: number };
  change: number | null;
  readyToFinish: boolean;
  measured: string[];
  cannotConclude: string[];
  observations: { date: string; note: string }[];
}

export function analyseExperiment(e: UserExperiment, logs: ExperimentLog[], checkIns: CheckIn[], defTitle: string | null, today: string): ExperimentAnalysis {
  const measure = e.measure as Measure;
  const mine = logs.filter((l) => l.user_experiment_id === e.id);
  const end = e.end_date ?? addDays(e.start_date, e.duration_days - 1);
  const lastDay = end < today ? end : today;
  const elapsed = Math.max(0, Math.min(e.duration_days, dayDiff(e.start_date, lastDay) + 1));
  const daysDone = mine.filter((l) => l.done).length;
  const b = e.baseline as { avg?: number | null; days?: number } | null;
  const baseline = b && typeof b.days === "number" ? { avg: b.avg ?? null, days: b.days } : (() => { const x = baselineFor(checkIns, measure, e.start_date); return { avg: x.avg, days: x.days }; })();
  const doneDates = new Set(mine.filter((l) => l.done).map((l) => l.local_date));
  const duringVals = checkIns.filter((c) => c.date >= e.start_date && c.date <= lastDay && doneDates.has(c.date)).map((c) => measureOf(c, measure));
  const during = { avg: avg(duringVals), days: duringVals.length };
  const change = baseline.avg !== null && during.avg !== null ? Math.round((during.avg - baseline.avg) * 10) / 10 : null;
  const label = MEASURE_LABEL[measure].toLowerCase();
  const measured: string[] = [];
  const cannot: string[] = [];
  measured.push(`You did the target behaviour on ${daysDone} of ${elapsed} days so far.`);
  if (change !== null && baseline.days >= 3 && during.days >= 3) {
    const better = measure === "stress" ? change < 0 : change > 0;
    measured.push(Math.abs(change) < 0.5
      ? `Your ${label} stayed about the same (${baseline.avg} → ${during.avg} / 5).`
      : `Your ${label} averaged ${during.avg} / 5 on experiment days, compared with ${baseline.avg} / 5 in the two weeks before — ${better ? "a change in the direction you hoped for" : "not the direction you hoped for"}.`);
  } else {
    cannot.push(`Not enough check-ins to compare ${label}: ${baseline.days} before the experiment and ${during.days} on experiment days (at least 3 of each are needed).`);
  }
  cannot.push("Other things in your life changed during this time too, so this can't prove the experiment caused any difference.");
  return {
    title: e.custom_title ?? defTitle ?? "Experiment", duration: e.duration_days, elapsed, daysDone,
    daysMissed: Math.max(0, elapsed - daysDone), adherencePct: elapsed ? Math.round((daysDone / elapsed) * 100) : null,
    baseline, during, change, readyToFinish: elapsed >= e.duration_days, measured, cannotConclude: cannot,
    observations: mine.filter((l) => l.note).map((l) => ({ date: l.local_date, note: l.note! })),
  };
}

// ───────────── Journey ─────────────

export type JourneyType = "goal" | "milestone" | "mission" | "challenge" | "experiment" | "achievement" | "ritual" | "reflection";
export interface JourneyEvent { date: string; type: JourneyType; title: string; detail: string; category: string }

export function journeyEvents(state: WellnessState, dev: DevelopmentData): JourneyEvent[] {
  const ev: JourneyEvent[] = [];
  const goalTitle = new Map(dev.goals.map((g) => [g.id, g.title]));
  for (const g of dev.goals) {
    ev.push({ date: g.created_at.slice(0, 10), type: "goal", title: `New goal: ${g.title}`, detail: g.why || g.description, category: g.category });
    if (g.status === "completed" && g.completed_at) ev.push({ date: g.completed_at.slice(0, 10), type: "goal", title: `Goal achieved: ${g.title}`, detail: g.why, category: g.category });
  }
  for (const m of dev.milestones) if (m.done_at) ev.push({ date: m.done_at.slice(0, 10), type: "milestone", title: `Milestone: ${m.title}`, detail: goalTitle.get(m.goal_id) ?? "", category: dev.goals.find((g) => g.id === m.goal_id)?.category ?? "" });
  for (const m of state.missions) {
    const dates = [...(m.completionDates ?? [])].sort();
    if (dates[0]) ev.push({ date: dates[0], type: "mission", title: `Started a habit: ${m.title}`, detail: "First completion", category: m.area });
    for (const n of [10, 25, 50, 100]) if (dates[n - 1]) ev.push({ date: dates[n - 1]!, type: "mission", title: `${m.title}: ${n} days completed`, detail: "", category: m.area });
    if (m.status === "completed" && dates.length) ev.push({ date: dates[dates.length - 1]!, type: "mission", title: `Mission completed: ${m.title}`, detail: "Every level finished", category: m.area });
  }
  const chTitle = new Map(state.challenges.map((c) => [c.id, c.title]));
  for (const c of dev.history.challenges) if (c.completed_at) ev.push({ date: c.completed_at.slice(0, 10), type: "challenge", title: `Challenge completed: ${c.custom_title ?? chTitle.get(c.challenge_id ?? "") ?? "Challenge"}`, detail: "", category: "challenge" });
  const defTitle = new Map(dev.experimentDefs.map((d) => [d.id, d.title]));
  for (const e of dev.experiments) {
    const t = e.custom_title ?? defTitle.get(e.experiment_id ?? "") ?? "Experiment";
    ev.push({ date: e.start_date, type: "experiment", title: `Experiment started: ${t}`, detail: e.target_behaviour, category: "experiment" });
    if (e.status === "completed" && e.end_date) ev.push({ date: e.end_date, type: "experiment", title: `Experiment finished: ${t}`, detail: e.result_summary ?? "", category: "experiment" });
  }
  for (const a of dev.achievements) ev.push({ date: a.achieved_on, type: "achievement", title: a.title, detail: a.note, category: a.category });
  // Ritual consistency: weeks (Mon-based) with 10+ ritual completions.
  const perWeek = new Map<string, number>();
  for (const r of dev.history.rituals) {
    const d = new Date(`${r.local_date}T12:00:00`); const off = (d.getDay() + 6) % 7;
    const wk = addDays(r.local_date, -off); perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1);
  }
  for (const [wk, n] of perWeek) if (n >= 10) ev.push({ date: addDays(wk, 6), type: "ritual", title: `Strong ritual week: ${n} rituals completed`, detail: `Week of ${wk}`, category: "routine" });
  for (const r of dev.reviews) if (r.reflection) ev.push({ date: r.period_end, type: "reflection", title: `Your ${r.period_type} reflection`, detail: r.reflection, category: "reflection" });
  return ev.sort((a, b) => b.date.localeCompare(a.date));
}

// ───────────── Long-term analytics ─────────────

export type PeriodKind = "weekly" | "monthly" | "quarterly" | "yearly";
export const PERIOD_DAYS: Record<PeriodKind, number> = { weekly: 7, monthly: 30, quarterly: 91, yearly: 365 };

export interface PeriodStats {
  start: string; end: string; days: number;
  checkInDays: number; activeDays: number;
  mood: number | null; energy: number | null; stress: number | null; sleep: number | null;
  rituals: { morning: number; midday: number; evening: number };
  hydrationDays: number; proteinDays: number; breathingSessions: number; personalMinutes: number;
  missionCompletions: number; movementDays: number; challengesCompleted: number;
  milestonesDone: number; goalsCompleted: number; experimentsActive: number; experimentsCompleted: number;
}

export function periodStats(state: WellnessState, dev: DevelopmentData, start: string, end: string): PeriodStats {
  const inR = (d: string) => d >= start && d <= end;
  const cis = state.checkIns.filter((c) => inR(c.date));
  const h = dev.history;
  const active = new Set<string>([
    ...cis.map((c) => c.date), ...h.rituals.filter((r) => inR(r.local_date)).map((r) => r.local_date),
    ...h.hydration.filter((r) => inR(r.local_date)).map((r) => r.local_date), ...h.breathing.filter((r) => inR(r.local_date)).map((r) => r.local_date),
    ...h.personal.filter((r) => inR(r.local_date)).map((r) => r.local_date), ...h.missions.filter((r) => inR(r.local_date)).map((r) => r.local_date),
  ]);
  const movementIds = new Set(state.missions.filter((m) => m.area === "movement" || m.area === "training").map((m) => m.id));
  return {
    start, end, days: dayDiff(start, end) + 1, checkInDays: cis.length, activeDays: active.size,
    mood: avg(cis.map((c) => MOOD[c.mood])), energy: avg(cis.map((c) => c.energy)), stress: avg(cis.map((c) => c.stress)), sleep: avg(cis.map((c) => c.sleep)),
    rituals: {
      morning: h.rituals.filter((r) => inR(r.local_date) && r.ritual_id === "r-morning").length,
      midday: h.rituals.filter((r) => inR(r.local_date) && r.ritual_id === "r-midday").length,
      evening: h.rituals.filter((r) => inR(r.local_date) && r.ritual_id === "r-evening").length,
    },
    hydrationDays: new Set(h.hydration.filter((r) => inR(r.local_date)).map((r) => r.local_date)).size,
    proteinDays: new Set(h.protein.filter((r) => inR(r.local_date)).map((r) => r.local_date)).size,
    breathingSessions: h.breathing.filter((r) => inR(r.local_date)).length,
    personalMinutes: h.personal.filter((r) => inR(r.local_date)).reduce((a, r) => a + r.minutes, 0),
    missionCompletions: h.missions.filter((r) => inR(r.local_date)).length,
    movementDays: new Set(h.missions.filter((r) => inR(r.local_date) && movementIds.has(r.mission_id)).map((r) => r.local_date)).size,
    challengesCompleted: h.challenges.filter((c) => c.completed_at && inR(c.completed_at.slice(0, 10))).length,
    milestonesDone: dev.milestones.filter((m) => m.done_at && inR(m.done_at.slice(0, 10))).length,
    goalsCompleted: dev.goals.filter((g) => g.status === "completed" && g.completed_at && inR(g.completed_at.slice(0, 10))).length,
    experimentsActive: dev.experiments.filter((e) => e.start_date <= end && (e.end_date ?? "9999") >= start && e.status !== "abandoned").length,
    experimentsCompleted: dev.experiments.filter((e) => e.status === "completed" && e.end_date && inR(e.end_date)).length,
  };
}

/** Chart series: per-day for weekly/monthly, per-week for quarterly, per-month for yearly. */
export function trendSeries(state: WellnessState, kind: PeriodKind, end: string) {
  const days = PERIOD_DAYS[kind];
  const start = addDays(end, -(days - 1));
  const bucket = kind === "weekly" || kind === "monthly" ? 1 : kind === "quarterly" ? 7 : 30;
  const out: { label: string; mood: number | null; energy: number | null; stress: number | null; sleep: number | null }[] = [];
  for (let s = start; s <= end; s = addDays(s, bucket)) {
    const e = addDays(s, bucket - 1);
    const cis = state.checkIns.filter((c) => c.date >= s && c.date <= e);
    out.push({
      label: new Date(`${s}T12:00:00`).toLocaleDateString(undefined, bucket === 30 ? { month: "short" } : { day: "numeric", month: "short" }),
      mood: avg(cis.map((c) => MOOD[c.mood])), energy: avg(cis.map((c) => c.energy)), stress: avg(cis.map((c) => c.stress)), sleep: avg(cis.map((c) => c.sleep)),
    });
  }
  return out;
}

// ───────────── Personal development review ─────────────

export interface DevReview {
  kind: PeriodKind; start: string; end: string;
  stats: PeriodStats; previous: PeriodStats;
  achievements: string[]; consistency: string[]; improvements: string[]; challenges: string[];
  unfinished: string[]; lessons: string[]; priorities: string[];
  enoughData: boolean;
}

export function devReview(state: WellnessState, dev: DevelopmentData, kind: PeriodKind, end: string): DevReview {
  const n = PERIOD_DAYS[kind];
  const start = addDays(end, -(n - 1));
  const s = periodStats(state, dev, start, end);
  const p = periodStats(state, dev, addDays(start, -n), addDays(start, -1));
  const inR = (d: string | null | undefined) => Boolean(d && d.slice(0, 10) >= start && d.slice(0, 10) <= end);
  const fmt = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const r: DevReview = { kind, start, end, stats: s, previous: p, achievements: [], consistency: [], improvements: [], challenges: [], unfinished: [], lessons: [], priorities: [], enoughData: s.activeDays >= Math.min(3, n) };

  for (const g of dev.goals) if (g.status === "completed" && inR(g.completed_at)) r.achievements.push(`Completed the goal "${g.title}" (${fmt(g.completed_at!)}).`);
  for (const m of dev.milestones) if (inR(m.done_at)) r.achievements.push(`Milestone "${m.title}" done (${fmt(m.done_at!)}).`);
  for (const a of dev.achievements) if (inR(a.achieved_on)) r.achievements.push(`${a.title} (${fmt(a.achieved_on)}).`);
  if (s.challengesCompleted) r.achievements.push(`${s.challengesCompleted} challenge${s.challengesCompleted > 1 ? "s" : ""} completed.`);
  if (s.experimentsCompleted) r.achievements.push(`${s.experimentsCompleted} experiment${s.experimentsCompleted > 1 ? "s" : ""} finished.`);

  const rate = (x: number, d: number) => (d ? x / d : 0);
  const comp = (label: string, a: number, b: number) => {
    if (a >= 3 && rate(a, s.days) > rate(b, p.days) + 0.1) r.consistency.push(`${label}: ${a} times this period vs ${b} the period before.`);
  };
  comp("Morning Activation", s.rituals.morning, p.rituals.morning);
  comp("Midday Reset", s.rituals.midday, p.rituals.midday);
  comp("Evening Unwind", s.rituals.evening, p.rituals.evening);
  comp("Days with water logged", s.hydrationDays, p.hydrationDays);
  comp("Breathing sessions", s.breathingSessions, p.breathingSessions);
  comp("Mission completions", s.missionCompletions, p.missionCompletions);
  comp("Check-ins", s.checkInDays, p.checkInDays);

  const better = (label: string, a: number | null, b: number | null, higher: boolean) => {
    if (a === null || b === null) return;
    const d = Math.round((a - b) * 10) / 10;
    if (Math.abs(d) < 0.4) return;
    const good = higher ? d > 0 : d < 0;
    (good ? r.improvements : r.challenges).push(`${label} ${good ? "improved" : "worsened"}: ${b} → ${a} / 5 (check-in average).`);
  };
  better("Mood", s.mood, p.mood, true); better("Energy", s.energy, p.energy, true);
  better("Stress", s.stress, p.stress, false); better("Sleep quality", s.sleep, p.sleep, true);
  if (s.stress !== null && s.stress >= 3.5 && !r.challenges.some((c) => c.startsWith("Stress"))) r.challenges.push(`Stress stayed high (average ${s.stress} / 5).`);
  if (s.activeDays && s.rituals.morning === 0 && s.days >= 7) r.challenges.push("Morning Activation didn't happen this period.");

  for (const g of dev.goals.filter((g) => g.status === "active" || g.status === "planned")) {
    const open = dev.milestones.filter((m) => m.goal_id === g.id && !m.done_at);
    const overdue = open.filter((m) => m.target_on && m.target_on < end);
    r.unfinished.push(`${g.title}: ${open.length} milestone${open.length === 1 ? "" : "s"} open${overdue.length ? `, ${overdue.length} past its target date` : ""}${g.target_on && g.target_on < end ? " — target date has passed" : ""}.`);
  }
  for (const e of dev.experiments.filter((e) => e.status === "completed" && inR(e.end_date))) {
    const ev = e.evaluation as { learned?: string; continue?: string } | null;
    const t = e.custom_title ?? dev.experimentDefs.find((d) => d.id === e.experiment_id)?.title ?? "Experiment";
    if (ev?.learned) r.lessons.push(`${t}: "${ev.learned}"`);
    else if (e.result_summary) r.lessons.push(`${t}: ${e.result_summary}`);
  }
  for (const rv of dev.reviews) if (rv.reflection && inR(rv.period_end) && rv.period_type !== kind) r.lessons.push(`Your ${rv.period_type} reflection: "${rv.reflection.slice(0, 160)}"`);

  const pats = goalPatterns(dev, end);
  if (pats.stalled[0]) r.priorities.push(`Take one first step on "${pats.stalled[0].title}" — add a single small milestone.`);
  const nextMs = dev.milestones.filter((m) => !m.done_at && dev.goals.find((g) => g.id === m.goal_id)?.status === "active").sort((a, b) => (a.target_on ?? "9999").localeCompare(b.target_on ?? "9999"))[0];
  if (nextMs) r.priorities.push(`Next milestone: "${nextMs.title}"${nextMs.target_on ? ` (target ${fmt(nextMs.target_on)})` : ""}.`);
  if (r.challenges[0]) r.priorities.push(`Give attention to: ${r.challenges[0].replace(/\.$/, "")}.`);
  if (!dev.goals.length) r.priorities.push("Add one personal goal so progress can be tracked.");
  if (!r.enoughData) r.priorities.push("Check in on most days so the next review can say more.");
  r.priorities = r.priorities.slice(0, 3);
  return r;
}

export function goalsForCoach(dev: DevelopmentData, state: WellnessState, today: string): string {
  const L: string[] = ["\n## Personal goals"];
  if (!dev.goals.length) L.push("- No goals yet.");
  for (const g of dev.goals.filter((g) => g.status !== "cancelled").slice(0, 10)) {
    const gp = goalProgress(g, dev.milestones, dev.actions, state, dev, today);
    L.push(`- [id ${g.id}] "${g.title}" (${g.category}, ${STATUS_LABEL[g.status]}, priority ${g.priority}${g.target_on ? `, target ${g.target_on}` : ""}) — ${gp.pct}% (${gp.method}) Why: ${g.why || "—"}. Last activity ${gp.inactiveDays} days ago. Open milestones: ${dev.milestones.filter((m) => m.goal_id === g.id && !m.done_at).map((m) => m.title).join("; ") || "none"}.`);
  }
  const pats = goalPatterns(dev, today);
  if (pats.message) L.push(`- Pattern: ${pats.message}`);
  if (pats.inactive.length) L.push(`- Inactive 45+ days (ask gently if still relevant; never change it yourself): ${pats.inactive.map((g) => g.title).join(", ")}`);
  L.push("\n## Wellness experiments");
  const defT = new Map(dev.experimentDefs.map((d) => [d.id, d.title]));
  const exps = dev.experiments.filter((e) => e.status !== "abandoned").slice(0, 6);
  if (!exps.length) L.push("- None yet. Suggested experiments available: " + dev.experimentDefs.map((d) => d.title).join("; "));
  for (const e of exps) {
    const a = analyseExperiment(e, dev.experimentLogs, state.checkIns, defT.get(e.experiment_id ?? "") ?? null, today);
    L.push(`- "${a.title}" [${e.status}] measuring ${e.measure}: ${a.measured.join(" ")} ${a.cannotConclude[0] ?? ""}`);
  }
  return L.join("\n");
}
