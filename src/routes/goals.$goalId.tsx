import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Pause, Play, Plus, Sparkles, Trash2, Trophy, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useWellness } from "@/lib/wellness-store";
import { useDevelopment } from "@/lib/development";
import { STATUS_LABEL, goalProgress } from "@/lib/intelligence/development";
import { suggestGoalPlan, type PlanSuggestion } from "@/lib/coach.functions";
import { addDays } from "@/lib/daily-metrics";
import type { GoalStatus } from "@/lib/data/development-repo";

export const Route = createFileRoute("/goals/$goalId")({
  head: () => ({
    meta: [
      { title: "Goal plan — Smarty Wellness" },
      { name: "description", content: "Milestones, actions and progress for one of your personal goals." },
      { property: "og:title", content: "Goal plan — Smarty Wellness" },
      { property: "og:description", content: "Your goal, broken into realistic steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GoalPage,
});

const fmt = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function GoalPage() {
  const { goalId } = Route.useParams();
  const { state } = useWellness();
  const { data, loading, run, api, today, busy } = useDevelopment();
  const navigate = useNavigate();
  const suggest = useServerFn(suggestGoalPlan);
  const [ms, setMs] = useState({ title: "", target_on: "" });
  const [action, setAction] = useState("");
  const [plan, setPlan] = useState<PlanSuggestion | null>(null);
  const [planning, setPlanning] = useState(false);
  const [edit, setEdit] = useState<null | { why: string; description: string; obstacles: string; notes: string; target_on: string }>(null);
  const [manual, setManual] = useState<number | null>(null);

  if (loading) return <PageShell width="3xl"><p className="text-sm text-muted-foreground">Loading…</p></PageShell>;
  const g = data?.goals.find((x) => x.id === goalId);
  if (!g || !data) return <PageShell width="3xl"><p>Goal not found.</p><Link to="/bucket-list">Back to your bucket list</Link></PageShell>;
  const p = goalProgress(g, data.milestones, data.actions, state, data, today);
  const milestones = data.milestones.filter((m) => m.goal_id === g.id);
  const actions = data.actions.filter((a) => a.goal_id === g.id);
  const history = data.events.filter((e) => e.goal_id === g.id).slice(0, 15);
  const setStatus = (s: GoalStatus, msg: string) => run((uid) => api.updateGoal(uid, g.id, { status: s }), msg);

  async function askPlan() {
    setPlanning(true);
    try { setPlan(await suggest({ data: { goalId: g!.id, today } })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't get suggestions."); }
    finally { setPlanning(false); }
  }

  return (
    <PageShell width="3xl">
      <Link to="/bucket-list" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Bucket list</Link>

      <section className="rounded-3xl border-2 border-primary bg-card p-5 shadow-soft sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{g.category} · {g.priority} priority · {STATUS_LABEL[g.status]}</p>
        <h1 className="mt-1 text-2xl font-bold">{g.title}</h1>
        {g.why && <p className="mt-2 text-sm"><span className="font-semibold">Why it matters: </span>{g.why}</p>}
        {g.description && <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>}
        <Progress value={p.pct} className="mt-4" />
        <p className="mt-1 text-sm font-semibold">{p.pct}%</p>
        <p className="text-xs text-muted-foreground">How it's calculated: {p.method}</p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <span>Created {fmt(g.created_at)}</span>
          {g.target_on && <span>Target {fmt(g.target_on)}{p.timeElapsedPct !== null && g.status !== "completed" ? ` · ${p.timeElapsedPct}% of time used` : ""}</span>}
          {g.completed_at && <span>Completed {fmt(g.completed_at)}</span>}
        </div>
        {p.contribution.length > 0 && (
          <p className="mt-3 rounded-2xl border-2 border-calm/60 p-3 text-xs">
            <span className="font-semibold">Supporting activity since you started: </span>
            {p.contribution.map((c) => `${c.count} ${c.label}`).join(" · ")}. <span className="text-muted-foreground">This shows effort; it doesn't change the percentage.</span>
          </p>
        )}
        {p.inactiveDays >= 45 && g.status === "active" && (
          <div className="mt-3 rounded-2xl border-2 border-sun/70 p-3 text-sm">
            Nothing has changed on this goal for {p.inactiveDays} days. Is it still important to you right now? Pausing is completely fine.
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          {g.status !== "completed" && g.status !== "active" && <Button size="sm" onClick={() => setStatus("active", "Goal is active.")}><Play /> {g.status === "paused" ? "Resume" : "Start"}</Button>}
          {g.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus("paused", "Goal paused.")}><Pause /> Pause</Button>}
          {g.status !== "completed" && g.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => setStatus("completed", "Congratulations — goal achieved!")}><Trophy /> Mark achieved</Button>}
          {g.status !== "cancelled" && g.status !== "completed" && <Button size="sm" variant="ghost" onClick={() => setStatus("cancelled", "Goal cancelled. It stays in your history.")}><X /> Cancel goal</Button>}
          {(g.status === "completed" || g.status === "cancelled") && <Button size="sm" variant="outline" onClick={() => setStatus("active", "Goal reopened.")}>Reopen</Button>}
          <Button size="sm" variant="ghost" onClick={() => setEdit({ why: g.why, description: g.description, obstacles: g.obstacles, notes: g.notes, target_on: g.target_on ?? "" })}>Edit details</Button>
          <Button size="sm" variant="ghost" onClick={async () => { if (!window.confirm("Delete this goal and its milestones permanently?")) return; if (await run((uid) => api.deleteGoal(uid, g.id), "Goal deleted.")) void navigate({ to: "/bucket-list" }); }}><Trash2 /> Delete</Button>
        </div>
      </section>

      {edit && (
        <form className="mt-4 space-y-3 rounded-3xl border-2 border-mind/50 bg-card p-5 shadow-soft" onSubmit={async (e) => {
          e.preventDefault();
          if (await run((uid) => api.updateGoal(uid, g.id, { ...edit, target_on: edit.target_on || null }), "Saved.")) setEdit(null);
        }}>
          <div><Label htmlFor="e-why">Why it matters</Label><Textarea id="e-why" rows={2} value={edit.why} onChange={(e) => setEdit({ ...edit, why: e.target.value })} /></div>
          <div><Label htmlFor="e-desc">What needs to happen</Label><Textarea id="e-desc" rows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
          <div><Label htmlFor="e-obs">Possible obstacles</Label><Textarea id="e-obs" rows={2} value={edit.obstacles} onChange={(e) => setEdit({ ...edit, obstacles: e.target.value })} /></div>
          <div><Label htmlFor="e-notes">Personal notes</Label><Textarea id="e-notes" rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
          <div><Label htmlFor="e-date">Target date</Label><Input id="e-date" type="date" value={edit.target_on} onChange={(e) => setEdit({ ...edit, target_on: e.target.value })} /></div>
          <div className="flex gap-2"><Button type="submit" disabled={busy}>Save</Button><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
        </form>
      )}
      {!edit && (g.obstacles || g.notes) && (
        <section className="mt-4 rounded-3xl border-2 border-mind/50 bg-card p-5 text-sm shadow-soft">
          {g.obstacles && <p><span className="font-semibold">Possible obstacles: </span>{g.obstacles}</p>}
          {g.notes && <p className="mt-1"><span className="font-semibold">Notes: </span>{g.notes}</p>}
        </section>
      )}

      <section className="mt-4 rounded-3xl border-2 border-calm/60 bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Milestones</h2>
          <Button size="sm" variant="outline" onClick={askPlan} disabled={planning}><Sparkles /> {planning ? "Thinking…" : "Suggest a plan"}</Button>
        </div>
        {milestones.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Break the goal into 3–5 smaller steps. Progress moves as you complete them.</p>}
        <ul className="mt-3 space-y-2">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
              <button aria-label={m.done_at ? `Mark "${m.title}" not done` : `Mark "${m.title}" done`} onClick={() => run((uid) => api.toggleMilestone(uid, m))}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${m.done_at ? "border-calm bg-calm text-primary-foreground" : "border-calm/60"}`}>{m.done_at && <Check className="h-4 w-4" />}</button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${m.done_at ? "line-through opacity-60" : ""}`}>{m.title}</p>
                <p className="text-[11px] text-muted-foreground">{m.done_at ? `Done ${fmt(m.done_at)}` : m.target_on ? `Target ${fmt(m.target_on)}${m.target_on < today ? " — past" : ""}` : "No date"}{m.source === "coach" ? " · suggested by Smarty Coach" : ""}</p>
              </div>
              <button aria-label="Delete milestone" onClick={() => run((uid) => api.deleteMilestone(uid, m.id))}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
            </li>
          ))}
        </ul>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={async (e) => {
          e.preventDefault(); if (!ms.title.trim()) return;
          if (await run((uid) => api.addMilestone(uid, g.id, ms.title.trim(), ms.target_on || null, "user", milestones.length))) setMs({ title: "", target_on: "" });
        }}>
          <Input aria-label="New milestone" placeholder="Add a milestone" value={ms.title} maxLength={200} onChange={(e) => setMs({ ...ms, title: e.target.value })} />
          <Input aria-label="Milestone target date" type="date" className="sm:w-44" value={ms.target_on} onChange={(e) => setMs({ ...ms, target_on: e.target.value })} />
          <Button type="submit" disabled={busy}><Plus /> Add</Button>
        </form>

        {plan && (
          <div className="mt-4 rounded-2xl border-2 border-mind/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mind-deep">Smarty Coach suggests — add only what fits</p>
            {plan.note && <p className="mt-1 text-sm text-muted-foreground">{plan.note}</p>}
            <ul className="mt-2 space-y-2">
              {plan.milestones.map((s, i) => (
                <li key={`m${i}`} className="flex items-center justify-between gap-2 text-sm">
                  <span>{s.title} <span className="text-xs text-muted-foreground">(~{s.weeks_from_now} weeks)</span></span>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (await run((uid) => api.addMilestone(uid, g.id, s.title, addDays(today, s.weeks_from_now * 7), "coach", milestones.length + i), "Milestone added."))
                      setPlan({ ...plan, milestones: plan.milestones.filter((_, j) => j !== i) });
                  }}><Plus /> Add</Button>
                </li>
              ))}
              {plan.actions.map((a, i) => (
                <li key={`a${i}`} className="flex items-center justify-between gap-2 text-sm">
                  <span>Action: {a}</span>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (await run((uid) => api.addAction(uid, g.id, a, null, "coach"), "Action added.")) setPlan({ ...plan, actions: plan.actions.filter((_, j) => j !== i) });
                  }}><Plus /> Add</Button>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setPlan(null)}>Dismiss suggestions</Button>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-3xl border-2 border-sun/70 bg-card p-5 shadow-soft">
        <h2 className="font-bold">Actions</h2>
        <p className="text-xs text-muted-foreground">Small things you can do soon. {p.actionsDone}/{p.actionsTotal} done.</p>
        <ul className="mt-2 space-y-1">
          {actions.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={Boolean(a.done_at)} onChange={() => run((uid) => api.toggleAction(uid, a))} aria-label={a.title} />
              <span className={`flex-1 ${a.done_at ? "line-through opacity-60" : ""}`}>{a.title}</span>
              <button aria-label="Delete action" onClick={() => run((uid) => api.deleteAction(uid, a.id))}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </li>
          ))}
        </ul>
        <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (action.trim() && await run((uid) => api.addAction(uid, g.id, action.trim(), null, "user"))) setAction(""); }}>
          <Input aria-label="New action" placeholder="Add an action" value={action} maxLength={200} onChange={(e) => setAction(e.target.value)} />
          <Button type="submit" variant="outline" disabled={busy}><Plus /></Button>
        </form>
      </section>

      <section className="mt-4 rounded-3xl border-2 border-bloom/50 bg-card p-5 shadow-soft">
        <h2 className="font-bold">Progress method</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant={g.progress_mode === "milestones" ? "default" : "outline"} onClick={() => run((uid) => api.updateGoal(uid, g.id, { progress_mode: "milestones" }))}>From milestones</Button>
          <Button size="sm" variant={g.progress_mode === "manual" ? "default" : "outline"} onClick={() => run((uid) => api.updateGoal(uid, g.id, { progress_mode: "manual" }))}>I'll set it myself</Button>
        </div>
        {g.progress_mode === "manual" && (
          <div className="mt-4">
            <Label>Progress: {manual ?? g.progress}%</Label>
            <Slider className="mt-2" value={[manual ?? g.progress]} max={100} step={5} onValueChange={(v) => setManual(v[0] ?? 0)}
              onValueCommit={(v) => void run((uid) => api.updateGoal(uid, g.id, { progress: v[0] ?? 0 }), "Progress saved.").then(() => setManual(null))} />
          </div>
        )}
        {history.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-bold">History</h3>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {history.map((h) => <li key={h.id}>{fmt(h.created_at)} — {h.kind === "status" ? `Status: ${STATUS_LABEL[h.detail] ?? h.detail}` : h.kind === "progress" ? `Progress set to ${h.progress}%` : h.kind === "created" ? "Goal created" : h.kind === "milestone_done" ? `Milestone done: ${h.detail}` : h.kind === "milestone_added" ? `Milestone added: ${h.detail}` : h.kind === "action_done" ? `Action done: ${h.detail}` : `${h.kind.replace("_", " ")}: ${h.detail}`}</li>)}
            </ul>
          </>
        )}
      </section>
    </PageShell>
  );
}
