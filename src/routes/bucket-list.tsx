import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Compass, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useWellness } from "@/lib/wellness-store";
import { useDevelopment } from "@/lib/development";
import { GOAL_CATEGORIES, LINKABLE_AREAS, STATUS_LABEL, goalPatterns, goalProgress } from "@/lib/intelligence/development";
import type { GoalStatus } from "@/lib/data/development-repo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bucket-list")({
  head: () => ({
    meta: [
      { title: "Bucket List & Goals — Smarty Wellness" },
      { name: "description", content: "The experiences, achievements and personal improvements you want — with milestones, progress and a realistic plan." },
      { property: "og:title", content: "Bucket List & Goals — Smarty Wellness" },
      { property: "og:description", content: "Turn ambitions into realistic plans and track real progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BucketListPage,
});

const TONES = ["border-bloom/60", "border-primary/50", "border-calm/60", "border-sun/70", "border-mind/50", "border-energy/50"];
const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "now", label: "In progress", match: (s) => ["active", "planned", "not_started"].includes(s) },
  { key: "paused", label: "Paused", match: (s) => s === "paused" },
  { key: "done", label: "Completed", match: (s) => s === "completed" },
  { key: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
];
const IDEAS = ["Run a 10K", "Read 20 books", "Learn a language", "Improve work-life balance", "Learn to swim", "Spend more time with my parents", "Travel somewhere new", "Become stronger"];
const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function BucketListPage() {
  const { state } = useWellness();
  const { data, loading, run, api, today } = useDevelopment();
  const [filter, setFilter] = useState("now");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", why: "", description: "", category: "Personal development", priority: "medium", target_on: "", status: "active" as GoalStatus, linked_areas: [] as string[] });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) { toast.error("Give your goal a name."); return; }
    const okd = await run((uid) => api.createGoal(uid, { ...f, title: f.title.trim(), target_on: f.target_on || null }), "Goal added. Add a first milestone to get moving.");
    if (okd) { setF({ ...f, title: "", why: "", description: "", target_on: "", linked_areas: [] }); setOpen(false); }
  }

  const goals = (data?.goals ?? []).filter((g) => FILTERS.find((x) => x.key === filter)!.match(g.status));
  const pats = data ? goalPatterns(data, today) : null;

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Personal development" icon={Compass} title="Bucket list"
        subtitle="What you want to experience, achieve or improve — broken into steps you can actually take." />

      {pats?.message && <div className="mb-4 rounded-3xl border-2 border-sun/70 bg-card p-4 text-sm shadow-soft">{pats.message}</div>}

      {!open ? (
        <Button size="lg" onClick={() => setOpen(true)} className="mb-5 w-full sm:w-auto"><Plus /> New goal</Button>
      ) : (
        <form onSubmit={create} className="mb-5 space-y-3 rounded-3xl border-2 border-primary bg-card p-5 shadow-soft">
          <div><Label htmlFor="g-title">Goal</Label><Input id="g-title" value={f.title} maxLength={200} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Improve work-life balance" /></div>
          <div className="flex flex-wrap gap-2">{IDEAS.map((i) => <button type="button" key={i} onClick={() => setF({ ...f, title: i })} className="rounded-full border-2 border-mind/40 px-3 py-1 text-xs font-semibold text-mind-deep hover:bg-mind/10">{i}</button>)}</div>
          <div><Label htmlFor="g-why">Why it matters to you</Label><Textarea id="g-why" rows={2} value={f.why} maxLength={500} onChange={(e) => setF({ ...f, why: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label htmlFor="g-cat">Category</Label><select id="g-cat" className={selectCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{GOAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><Label htmlFor="g-pri">Priority</Label><select id="g-pri" className={selectCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div><Label htmlFor="g-date">Target date (optional)</Label><Input id="g-date" type="date" value={f.target_on} min={today} onChange={(e) => setF({ ...f, target_on: e.target.value })} /></div>
          </div>
          <div><Label htmlFor="g-st">Status</Label><select id="g-st" className={selectCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as GoalStatus })}><option value="active">Active — starting now</option><option value="planned">Planned — starting later</option><option value="not_started">Not started — just an idea</option></select></div>
          <fieldset>
            <legend className="text-sm font-medium">Which everyday habits support it? (optional)</legend>
            <p className="text-xs text-muted-foreground">Shown as supporting activity — it never changes your progress by itself.</p>
            <div className="mt-2 flex flex-wrap gap-2">{LINKABLE_AREAS.map((a) => {
              const on = f.linked_areas.includes(a.value);
              return <button type="button" key={a.value} aria-pressed={on} onClick={() => setF({ ...f, linked_areas: on ? f.linked_areas.filter((x) => x !== a.value) : [...f.linked_areas, a.value] })}
                className={cn("rounded-full border-2 px-3 py-1 text-xs font-semibold", on ? "border-calm bg-calm/15 text-calm-deep" : "border-border text-muted-foreground")}>{a.label}</button>;
            })}</div>
          </fieldset>
          <div className="flex gap-2"><Button type="submit">Add goal</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((x) => {
          const n = (data?.goals ?? []).filter((g) => x.match(g.status)).length;
          return <button key={x.key} role="tab" aria-selected={filter === x.key} onClick={() => setFilter(x.key)}
            className={cn("rounded-full border-2 px-4 py-1.5 text-xs font-semibold", filter === x.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{x.label} ({n})</button>;
        })}
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : goals.length === 0 ? (
        <div className="rounded-3xl border-2 border-calm/60 bg-card p-6 text-sm text-muted-foreground shadow-soft">
          {filter === "now" ? "No goals in progress. Start with one thing you'd genuinely like to achieve this year." : "Nothing here yet."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g, i) => {
            const p = goalProgress(g, data!.milestones, data!.actions, state, data, today);
            return (
              <Link key={g.id} to="/goals/$goalId" params={{ goalId: g.id }} style={{ textDecoration: "none" }}
                className={cn("block rounded-3xl border-2 bg-card p-5 text-foreground shadow-soft transition hover:-translate-y-0.5", TONES[i % TONES.length])}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{g.category} · {g.priority} priority</p>
                <p className="mt-1 font-bold">{g.title}</p>
                {g.why && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{g.why}</p>}
                <Progress value={p.pct} className="mt-3" />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {p.pct}% · {STATUS_LABEL[g.status]}{p.milestonesTotal ? ` · ${p.milestonesDone}/${p.milestonesTotal} milestones` : ""}{p.daysLeft !== null && g.status !== "completed" ? ` · ${p.daysLeft >= 0 ? `${p.daysLeft} days left` : "target date passed"}` : ""}
                </p>
                {p.nextMilestone && <p className="mt-2 text-xs"><span className="font-semibold">Next:</span> {p.nextMilestone.title}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
