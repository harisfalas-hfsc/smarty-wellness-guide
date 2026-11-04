import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Sprout } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useWellness } from "@/lib/wellness-store";
import { useDaily } from "@/lib/daily";
import { useDevelopment } from "@/lib/development";
import { addDays } from "@/lib/daily-metrics";
import { analyseExperiment, devReview, goalPatterns, goalProgress, journeyEvents, STATUS_LABEL, trendSeries, type PeriodKind } from "@/lib/intelligence/development";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Personal Development — Smarty Wellness" },
      { name: "description", content: "Am I becoming the person I want to become? Goals, milestones, experiments, long-term trends and reviews in one place." },
      { property: "og:title", content: "Personal Development — Smarty Wellness" },
      { property: "og:description", content: "Your long-term progress, from your own records, with a downloadable report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressPage,
});

const PERIODS: { k: PeriodKind; l: string }[] = [{ k: "weekly", l: "Week" }, { k: "monthly", l: "Month" }, { k: "quarterly", l: "Quarter" }, { k: "yearly", l: "Year" }];
const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const SECTIONS: { key: "achievements" | "consistency" | "improvements" | "challenges" | "unfinished" | "lessons" | "priorities"; label: string; empty: string; tone: string }[] = [
  { key: "achievements", label: "A. Achievements", empty: "No completed goals, milestones or challenges recorded in this period.", tone: "border-calm/60" },
  { key: "consistency", label: "B. More consistent", empty: "No behaviour became clearly more regular than the previous period.", tone: "border-calm/60" },
  { key: "improvements", label: "C. Improvements", empty: "No measurable change in check-in averages (or not enough check-ins).", tone: "border-primary/50" },
  { key: "challenges", label: "D. Where it was hard", empty: "Nothing stood out as a struggle.", tone: "border-sun/70" },
  { key: "unfinished", label: "E. Unfinished goals", empty: "No open goals.", tone: "border-sun/70" },
  { key: "lessons", label: "F. Lessons learned", empty: "Finish an experiment or add a reflection to see lessons here.", tone: "border-mind/50" },
  { key: "priorities", label: "G. Next priorities", empty: "Keep your current rhythm.", tone: "border-bloom/50" },
];

function ProgressPage() {
  const { state } = useWellness();
  const { data: daily } = useDaily();
  const { data, loading, run, api, today, busy } = useDevelopment();
  const [kind, setKind] = useState<PeriodKind>("monthly");
  const [reflection, setReflection] = useState("");

  const review = useMemo(() => (data ? devReview(state, data, kind, today) : null), [state, data, kind, today]);
  const series = useMemo(() => trendSeries(state, kind, today), [state, kind, today]);
  const saved = data?.reviews.find((r) => r.period_type === kind && r.period_start === review?.start);
  useEffect(() => { setReflection(saved?.reflection ?? ""); }, [saved?.id, saved?.reflection, kind]);

  if (loading || !data || !review) return <PageShell><p className="text-sm text-muted-foreground">Loading…</p></PageShell>;

  const active = data.goals.filter((g) => g.status === "active");
  const progresses = active.map((g) => goalProgress(g, data.milestones, data.actions, state, data, today));
  const overall = progresses.length ? Math.round(progresses.reduce((a, p) => a + p.pct, 0) / progresses.length) : null;
  const upcoming = data.milestones.filter((m) => !m.done_at && active.some((g) => g.id === m.goal_id)).sort((a, b) => (a.target_on ?? "9999").localeCompare(b.target_on ?? "9999")).slice(0, 4);
  const runningExps = data.experiments.filter((e) => e.status === "active" || e.status === "paused");
  const recent = journeyEvents(state, data).filter((e) => e.type !== "goal" || e.title.startsWith("Goal achieved")).slice(0, 5);
  const pats = goalPatterns(data, today);
  const latest = data.reviews[0];
  const defTitle = (id: string | null) => data.experimentDefs.find((d) => d.id === id)?.title ?? null;

  // Gentle, opt-in reminders (Habits page → Gentle reminders).
  const rem = (daily?.prefs?.reminders ?? {}) as Record<string, boolean>;
  const notes: string[] = [];
  if (rem["goals"]) {
    for (const m of upcoming) if (m.target_on && m.target_on >= today && m.target_on <= addDays(today, 7)) notes.push(`Milestone "${m.title}" is planned for ${fmt(m.target_on)}.`);
    for (const g of active) if (g.target_on && g.target_on >= today && g.target_on <= addDays(today, 14)) notes.push(`"${g.title}" has its target date on ${fmt(g.target_on)}.`);
    for (const g of pats.inactive.slice(0, 1)) notes.push(`"${g.title}" hasn't changed in a while — is it still important to you?`);
  }
  if (rem["experiments"]) for (const e of runningExps.filter((e) => e.status === "active")) if (!data.experimentLogs.some((l) => l.user_experiment_id === e.id && l.local_date === today)) notes.push(`Log today for "${e.custom_title ?? defTitle(e.experiment_id)}".`);
  if (rem["reviews"] && (!data.reviews.some((r) => r.period_type === "monthly" && r.period_start >= addDays(today, -35)))) notes.push("Your monthly review is ready whenever you want to look at it.");

  async function saveReflection() {
    await run((uid) => api.saveReview(uid, { period_type: kind, period_start: review!.start, period_end: review!.end, summary: review!.priorities[0] ?? "", trends: review as unknown as Json, reflection }), "Reflection saved.");
  }
  async function exportPdf() {
    try {
      const { exportDevelopmentPdf } = await import("@/lib/report-pdf");
      await exportDevelopmentPdf({
        name: state.profile.personal.name, review: review!, reflection,
        goals: data!.goals.filter((g) => g.status !== "cancelled").map((g) => {
          const p = goalProgress(g, data!.milestones, data!.actions, state, data, today);
          return { title: g.title, status: STATUS_LABEL[g.status] ?? g.status, pct: p.pct, method: p.method, milestones: data!.milestones.filter((m) => m.goal_id === g.id).map((m) => `${m.done_at ? "✓" : "○"} ${m.title}`).join(", ") };
        }),
        experiments: data!.experiments.filter((e) => e.status === "completed" && e.end_date && e.end_date >= review!.start).map((e) => ({ title: e.custom_title ?? defTitle(e.experiment_id) ?? "Experiment", result: e.result_summary ?? "" })),
      });
      await run((uid) => api.recordExport(uid, review!.start, review!.end));
    } catch (e) { console.error(e); toast.error("Couldn't create the PDF. Please try again."); }
  }

  const s = review.stats; const p = review.previous;
  const cmp = (a: number, b: number) => (b === 0 && a === 0 ? "" : a > b ? `↑ from ${b}` : a < b ? `↓ from ${b}` : "same as before");
  const stat: [string, string, string][] = [
    ["Active days", `${s.activeDays}/${s.days}`, cmp(s.activeDays, p.activeDays)],
    ["Morning · Midday · Evening", `${s.rituals.morning} · ${s.rituals.midday} · ${s.rituals.evening}`, ""],
    ["Movement days", String(s.movementDays), cmp(s.movementDays, p.movementDays)],
    ["Water logged", `${s.hydrationDays} days`, cmp(s.hydrationDays, p.hydrationDays)],
    ["Protein logged", `${s.proteinDays} days`, cmp(s.proteinDays, p.proteinDays)],
    ["Breathing", `${s.breathingSessions} sessions`, cmp(s.breathingSessions, p.breathingSessions)],
    ["Personal time", `${s.personalMinutes} min`, cmp(s.personalMinutes, p.personalMinutes)],
    ["Missions", `${s.missionCompletions} done`, cmp(s.missionCompletions, p.missionCompletions)],
    ["Challenges completed", String(s.challengesCompleted), cmp(s.challengesCompleted, p.challengesCompleted)],
    ["Milestones · Goals", `${s.milestonesDone} · ${s.goalsCompleted}`, ""],
    ["Experiments", `${s.experimentsActive} running/finished`, ""],
  ];

  return (
    <PageShell>
      <PageHeader eyebrow="Personal development" icon={Sprout} title="Am I becoming who I want to be?" subtitle="Your goals, experiments and long-term trends — from your own records only." />

      {notes.length > 0 && (
        <section className="mb-5 rounded-3xl border-2 border-mind/50 bg-card p-4 text-sm shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mind-deep">Gentle reminders</p>
          <ul className="mt-1 list-disc pl-5">{notes.slice(0, 4).map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-3xl border-2 border-primary bg-card p-5 shadow-soft lg:col-span-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-bold">Active goals</h2>
            {overall !== null && <span className="text-sm font-semibold text-primary">{overall}% average progress</span>}
          </div>
          {active.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No active goals yet. <Link to="/bucket-list">Add your first goal</Link>.</p> : (
            <ul className="mt-3 space-y-3">
              {active.slice(0, 5).map((g, i) => (
                <li key={g.id}>
                  <Link to="/goals/$goalId" params={{ goalId: g.id }} className="text-sm font-semibold">{g.title}</Link>
                  <Progress value={progresses[i]!.pct} className="mt-1" />
                  <p className="text-[11px] text-muted-foreground">{progresses[i]!.pct}% · {progresses[i]!.milestonesDone}/{progresses[i]!.milestonesTotal} milestones</p>
                </li>
              ))}
            </ul>
          )}
          {pats.message && <p className="mt-3 rounded-2xl border-2 border-sun/70 p-3 text-xs">{pats.message}</p>}
        </section>
        <section className="rounded-3xl border-2 border-calm/60 bg-card p-5 shadow-soft">
          <h2 className="font-bold">Upcoming milestones</h2>
          {upcoming.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">None planned.</p> : (
            <ul className="mt-2 space-y-1 text-sm">{upcoming.map((m) => <li key={m.id}>{m.title}<span className="block text-[11px] text-muted-foreground">{m.target_on ? fmt(m.target_on) : "No date"} · {data.goals.find((g) => g.id === m.goal_id)?.title}</span></li>)}</ul>
          )}
        </section>
        <section className="rounded-3xl border-2 border-mind/50 bg-card p-5 shadow-soft">
          <h2 className="font-bold">Current experiments</h2>
          {runningExps.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">None running. <Link to="/experiments">Try one</Link>.</p> : (
            <ul className="mt-2 space-y-2 text-sm">{runningExps.map((e) => { const a = analyseExperiment(e, data.experimentLogs, state.checkIns, defTitle(e.experiment_id), today); return <li key={e.id}>{a.title}<span className="block text-[11px] text-muted-foreground">Day {a.elapsed}/{a.duration} · done {a.daysDone} days{e.status === "paused" ? " · paused" : ""}</span></li>; })}</ul>
          )}
        </section>
        <section className="rounded-3xl border-2 border-bloom/50 bg-card p-5 shadow-soft">
          <h2 className="font-bold">Recent achievements</h2>
          {recent.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">They'll appear as you complete things.</p> : (
            <ul className="mt-2 space-y-1 text-sm">{recent.map((e, i) => <li key={i}>{e.title}<span className="block text-[11px] text-muted-foreground">{fmt(e.date)}</span></li>)}</ul>
          )}
          <Link to="/journey" className="mt-2 inline-block text-xs font-semibold">Open your journey</Link>
        </section>
        <section className="rounded-3xl border-2 border-sun/70 bg-card p-5 shadow-soft">
          <h2 className="font-bold">Suggested next priorities</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{review.priorities.map((x) => <li key={x}>{x}</li>)}</ul>
          {latest && <p className="mt-2 text-[11px] text-muted-foreground">Latest saved review: {latest.period_type}, {fmt(latest.period_start)} – {fmt(latest.period_end)}</p>}
        </section>
      </div>

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Trends & review · {fmt(review.start)} – {fmt(review.end)}</h2>
          <div className="flex flex-wrap gap-2" role="tablist">
            {PERIODS.map((x) => <button key={x.k} role="tab" aria-selected={kind === x.k} onClick={() => setKind(x.k)}
              className={cn("rounded-full border-2 px-4 py-1.5 text-xs font-semibold", kind === x.k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{x.l}</button>)}
          </div>
        </div>
        {!review.enoughData && <p className="mt-2 rounded-2xl border-2 border-sun/70 p-3 text-xs">Few records in this period, so the numbers below can only say a limited amount.</p>}

        <div className="mt-3 rounded-3xl border-2 border-primary/50 bg-card p-4 shadow-soft">
          <p className="text-xs text-muted-foreground">Check-in averages (1–5). For stress, lower is better. Gaps mean no check-ins.</p>
          {series.some((x) => x.mood !== null) ? (
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke="var(--bloom)" strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="energy" name="Energy" stroke="var(--sun)" strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="stress" name="Stress" stroke="var(--energy)" strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="sleep" name="Sleep" stroke="var(--mind)" strokeWidth={2} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-2 text-sm text-muted-foreground">No check-ins in this period yet.</p>}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stat.map(([k, v, c]) => (
            <div key={k} className="rounded-2xl border-2 border-calm/50 bg-card p-3">
              <p className="text-[11px] text-muted-foreground">{k}</p>
              <p className="text-lg font-bold">{v}</p>
              {c && <p className="text-[11px] text-muted-foreground">{c} (previous period)</p>}
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((sec) => (
            <article key={sec.key} className={cn("rounded-3xl border-2 bg-card p-5 shadow-soft", sec.tone)}>
              <h3 className="font-bold">{sec.label}</h3>
              {review[sec.key].length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{review[sec.key].map((x) => <li key={x}>{x}</li>)}</ul>
                : <p className="mt-2 text-sm text-muted-foreground">{sec.empty}</p>}
            </article>
          ))}
        </div>

        <section className="mt-4 rounded-3xl border-2 border-mind/50 bg-card p-5 shadow-soft">
          <h3 className="font-bold">Your reflection</h3>
          <p className="text-xs text-muted-foreground">In your own words — what stood out this {kind === "weekly" ? "week" : kind === "monthly" ? "month" : kind === "quarterly" ? "quarter" : "year"}?</p>
          <Textarea className="mt-2" rows={3} maxLength={2000} value={reflection} onChange={(e) => setReflection(e.target.value)} aria-label="Your reflection" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={saveReflection} disabled={busy}>Save review</Button>
            <Button variant="outline" onClick={exportPdf}><Download /> Download PDF report</Button>
          </div>
        </section>
      </section>
    </PageShell>
  );
}
