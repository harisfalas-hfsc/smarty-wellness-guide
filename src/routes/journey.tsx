import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LineChart, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWellness } from "@/lib/wellness-store";
import { useDevelopment } from "@/lib/development";
import { addDays } from "@/lib/daily-metrics";
import { GOAL_CATEGORIES, journeyEvents, type JourneyType } from "@/lib/intelligence/development";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Your Journey — Smarty Wellness" },
      { name: "description", content: "A timeline of your real milestones: goals, missions, challenges, experiments, ritual streaks and reflections." },
      { property: "og:title", content: "Your Journey — Smarty Wellness" },
      { property: "og:description", content: "How your life is changing, from your own records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JourneyPage,
});

const TYPES: { key: JourneyType | "all"; label: string }[] = [
  { key: "all", label: "Everything" }, { key: "goal", label: "Goals" }, { key: "milestone", label: "Milestones" },
  { key: "mission", label: "Missions" }, { key: "challenge", label: "Challenges" }, { key: "experiment", label: "Experiments" },
  { key: "achievement", label: "Achievements" }, { key: "ritual", label: "Rituals" }, { key: "reflection", label: "Reflections" },
];
const TONE: Record<JourneyType, string> = {
  goal: "border-primary", milestone: "border-calm", mission: "border-sun", challenge: "border-energy",
  experiment: "border-mind", achievement: "border-bloom", ritual: "border-calm", reflection: "border-mind",
};
const PERIODS = [{ d: 30, l: "30 days" }, { d: 90, l: "3 months" }, { d: 365, l: "Year" }, { d: 0, l: "All time" }];
const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function JourneyPage() {
  const { state } = useWellness();
  const { data, loading, run, api, today, busy } = useDevelopment();
  const [type, setType] = useState<JourneyType | "all">("all");
  const [period, setPeriod] = useState(0);
  const [goalId, setGoalId] = useState("");
  const [add, setAdd] = useState<null | { title: string; note: string; achieved_on: string; category: string }>(null);

  const events = useMemo(() => (data ? journeyEvents(state, data) : []), [state, data]);
  const goalTitle = data?.goals.find((g) => g.id === goalId)?.title;
  const shown = events.filter((e) =>
    (type === "all" || e.type === type) &&
    (!period || e.date >= addDays(today, -period)) &&
    (!goalTitle || e.title.includes(goalTitle) || e.detail.includes(goalTitle)));

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Your journey" icon={LineChart} title="Journey" subtitle="The real moments that show how you're changing — nothing here is made up." />
      <div className="mb-3 flex flex-wrap gap-2">
        {TYPES.map((t) => <button key={t.key} onClick={() => setType(t.key)} aria-pressed={type === t.key}
          className={cn("rounded-full border-2 px-3 py-1 text-xs font-semibold", type === t.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{t.label}</button>)}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => <button key={p.d} onClick={() => setPeriod(p.d)} aria-pressed={period === p.d}
          className={cn("rounded-full border-2 px-3 py-1 text-xs font-semibold", period === p.d ? "border-calm bg-calm/15 text-calm-deep" : "border-border text-muted-foreground")}>{p.l}</button>)}
        {(data?.goals.length ?? 0) > 0 && (
          <select aria-label="Filter by goal" className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">All goals</option>{data!.goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        )}
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setAdd({ title: "", note: "", achieved_on: today, category: "Personal development" })}><Plus /> Add an achievement</Button>
      </div>

      {add && (
        <form className="mb-5 space-y-3 rounded-3xl border-2 border-bloom/50 bg-card p-5 shadow-soft" onSubmit={async (e) => {
          e.preventDefault(); if (!add.title.trim()) { toast.error("Describe what you achieved."); return; }
          if (await run((uid) => api.addAchievement(uid, { ...add, title: add.title.trim(), goal_id: goalId || null }), "Added to your journey.")) setAdd(null);
        }}>
          <div><Label htmlFor="a-t">What did you achieve?</Label><Input id="a-t" value={add.title} maxLength={200} onChange={(e) => setAdd({ ...add, title: e.target.value })} placeholder="e.g. Ran 5 km without stopping" /></div>
          <div><Label htmlFor="a-n">Note (optional)</Label><Input id="a-n" value={add.note} maxLength={300} onChange={(e) => setAdd({ ...add, note: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="a-d">Date</Label><Input id="a-d" type="date" max={today} value={add.achieved_on} onChange={(e) => setAdd({ ...add, achieved_on: e.target.value })} /></div>
            <div><Label htmlFor="a-c">Category</Label><select id="a-c" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={add.category} onChange={(e) => setAdd({ ...add, category: e.target.value })}>{GOAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="flex gap-2"><Button type="submit" disabled={busy}>Save</Button><Button type="button" variant="ghost" onClick={() => setAdd(null)}>Cancel</Button></div>
        </form>
      )}

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : shown.length === 0 ? (
        <div className="rounded-3xl border-2 border-sun/70 bg-card p-6 text-sm text-muted-foreground shadow-soft">
          {events.length === 0 ? "Your journey starts with your first goal, mission or experiment. As you complete things, they'll appear here." : "Nothing matches these filters."}
        </div>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-primary/30 pl-5">
          {shown.map((e, i) => (
            <li key={`${e.date}-${i}`} className="relative">
              <span className={cn("absolute -left-[29px] top-5 h-4 w-4 rounded-full border-4 bg-card", TONE[e.type])} aria-hidden />
              <article className={cn("rounded-3xl border-2 bg-card p-4 shadow-soft", TONE[e.type])}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{fmt(e.date)} · {TYPES.find((t) => t.key === e.type)?.label}</p>
                <p className="mt-1 text-sm font-bold">{e.title}</p>
                {e.detail && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{e.detail}</p>}
              </article>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  );
}
