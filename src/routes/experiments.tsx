import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, FlaskConical, Pause, Play, Plus, X } from "lucide-react";
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
import { MEASURE_LABEL, analyseExperiment, baselineFor } from "@/lib/intelligence/development";
import type { ExperimentDef, Measure, UserExperiment } from "@/lib/data/development-repo";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/experiments")({
  head: () => ({
    meta: [
      { title: "Wellness Experiments — Smarty Wellness" },
      { name: "description", content: "Try one small lifestyle change for 7–30 days and see, honestly, what changed in your own check-ins." },
      { property: "og:title", content: "Wellness Experiments — Smarty Wellness" },
      { property: "og:description", content: "Small personal experiments, honest results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExperimentsPage,
});

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const DURATIONS = [7, 14, 21, 30];

function ExperimentsPage() {
  const { state } = useWellness();
  const { data, loading, run, api, today, busy } = useDevelopment();
  const [custom, setCustom] = useState<null | { title: string; hypothesis: string; reason: string; target: string; measure: Measure; duration: number }>(null);
  const [chosen, setChosen] = useState<Record<string, number>>({});

  if (loading || !data) return <PageShell width="3xl"><p className="text-sm text-muted-foreground">Loading…</p></PageShell>;
  const defTitle = (e: UserExperiment) => data.experimentDefs.find((d) => d.id === e.experiment_id)?.title ?? null;
  const live = data.experiments.filter((e) => e.status === "active" || e.status === "paused");
  const finished = data.experiments.filter((e) => e.status === "completed" || e.status === "abandoned");
  const running = new Set(live.map((e) => e.experiment_id));

  function start(def: ExperimentDef | null, c?: NonNullable<typeof custom>) {
    const measure = (def?.measure ?? c!.measure) as Measure;
    const b = baselineFor(state.checkIns, measure, today);
    return run((uid) => api.startExperiment(uid, {
      experiment_id: def?.id ?? null, ...(c ? { custom_title: c.title, custom_hypothesis: c.hypothesis } : {}),
      reason: def?.reason ?? c!.reason, target_behaviour: def?.target_behaviour ?? c!.target,
      duration_days: def ? (chosen[def.id] ?? def.days) : c!.duration, measure, start_date: today,
      baseline: { avg: b.avg, days: b.days, from: b.from, to: b.to } as unknown as Json,
    }), "Experiment started. Log each day you do it.");
  }

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Wellness experiments" icon={FlaskConical} title="Experiments"
        subtitle="Try one small change for a set number of days. Completing it and it 'working' are two different things — we'll show you both honestly." />

      {live.length > 0 && (
        <section className="mb-6 space-y-4">
          <h2 className="text-lg font-bold">Running now</h2>
          {live.map((e) => <LiveExperiment key={e.id} e={e} title={defTitle(e)} />)}
        </section>
      )}
      {live.length >= 3 && <p className="mb-4 rounded-2xl border-2 border-sun/70 p-3 text-sm">You're running {live.length} experiments. Fewer at once makes results easier to read.</p>}

      <section className="mb-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Suggested experiments</h2>
          {!custom && <Button size="sm" variant="outline" onClick={() => setCustom({ title: "", hypothesis: "", reason: "", target: "", measure: "energy", duration: 14 })}><Plus /> Create your own</Button>}
        </div>
        {custom && (
          <form className="mt-3 space-y-3 rounded-3xl border-2 border-primary bg-card p-5 shadow-soft" onSubmit={async (ev) => {
            ev.preventDefault();
            if (!custom.title.trim() || !custom.target.trim()) { toast.error("Add a title and the behaviour you'll do."); return; }
            if (await start(null, custom)) setCustom(null);
          }}>
            <div><Label htmlFor="x-t">Experiment</Label><Input id="x-t" value={custom.title} maxLength={120} onChange={(e) => setCustom({ ...custom, title: e.target.value })} placeholder="e.g. Lunch away from my desk" /></div>
            <div><Label htmlFor="x-b">What exactly will you do each day?</Label><Input id="x-b" value={custom.target} maxLength={160} onChange={(e) => setCustom({ ...custom, target: e.target.value })} /></div>
            <div><Label htmlFor="x-h">What do you expect to change?</Label><Input id="x-h" value={custom.hypothesis} maxLength={200} onChange={(e) => setCustom({ ...custom, hypothesis: e.target.value })} placeholder="e.g. Afternoon energy feels better" /></div>
            <div><Label htmlFor="x-r">Why try it?</Label><Textarea id="x-r" rows={2} value={custom.reason} maxLength={300} onChange={(e) => setCustom({ ...custom, reason: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="x-m">Measure with your check-in</Label><select id="x-m" className={sel} value={custom.measure} onChange={(e) => setCustom({ ...custom, measure: e.target.value as Measure })}>{Object.entries(MEASURE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><Label htmlFor="x-d">Days (3–90)</Label><Input id="x-d" type="number" min={3} max={90} value={custom.duration} onChange={(e) => setCustom({ ...custom, duration: Math.max(3, Math.min(90, Number(e.target.value) || 7)) })} /></div>
            </div>
            <div className="flex gap-2"><Button type="submit" disabled={busy}>Start experiment</Button><Button type="button" variant="ghost" onClick={() => setCustom(null)}>Cancel</Button></div>
          </form>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {data.experimentDefs.map((d, i) => (
            <article key={d.id} className={`rounded-3xl border-2 bg-card p-5 shadow-soft ${["border-mind/50", "border-calm/60", "border-sun/70", "border-bloom/50", "border-primary/50"][i % 5]}`}>
              <h3 className="font-bold">{d.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{d.reason}</p>
              <p className="mt-2 text-xs"><span className="font-semibold">Expect:</span> {d.hypothesis}</p>
              <p className="text-xs"><span className="font-semibold">Measured by:</span> your {MEASURE_LABEL[d.measure as Measure].toLowerCase()} check-ins</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select aria-label={`Duration for ${d.title}`} className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={chosen[d.id] ?? d.days} onChange={(e) => setChosen({ ...chosen, [d.id]: Number(e.target.value) })}>
                  {[...new Set([d.days, ...DURATIONS])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n} days</option>)}
                </select>
                <Button size="sm" disabled={running.has(d.id) || busy} onClick={() => void start(d)}><Play /> {running.has(d.id) ? "Running" : "Start"}</Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Finished</h2>
          <div className="mt-3 space-y-3">
            {finished.map((e) => {
              const a = analyseExperiment(e, data.experimentLogs, state.checkIns, defTitle(e), today);
              const ev = e.evaluation as Record<string, string>;
              return (
                <article key={e.id} className="rounded-3xl border-2 border-calm/60 bg-card p-5 text-sm shadow-soft">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-calm-deep">{e.status === "completed" ? `Completed ${e.end_date}` : `Stopped ${e.end_date ?? ""}`}</p>
                  <h3 className="font-bold">{a.title}</h3>
                  <p className="mt-1"><span className="font-semibold">Measured: </span>{a.measured.join(" ")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.cannotConclude.join(" ")}</p>
                  {e.status === "completed" && (
                    <div className="mt-2 text-xs">
                      <p className="font-semibold">Your evaluation</p>
                      <ul className="list-disc pl-5">
                        {ev["achieved"] && <li>Did the behaviour: {ev["achieved"]}</li>}
                        {ev["realistic"] && <li>Realistic: {ev["realistic"]}</li>}
                        {ev["changes"] && <li>Noticed: {ev["changes"]}</li>}
                        {ev["continue"] && <li>Continue: {ev["continue"]}</li>}
                        {ev["learned"] && <li>Learned: {ev["learned"]}</li>}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function LiveExperiment({ e, title }: { e: UserExperiment; title: string | null }) {
  const { state } = useWellness();
  const { data, run, api, today, busy } = useDevelopment();
  const [note, setNote] = useState("");
  const [evalOpen, setEvalOpen] = useState(false);
  const [ev, setEv] = useState({ achieved: "Mostly", realistic: "Yes", changes: "", continue: "Maybe", learned: "" });
  const a = analyseExperiment(e, data?.experimentLogs ?? [], state.checkIns, title, today);
  const todayLog = data?.experimentLogs.find((l) => l.user_experiment_id === e.id && l.local_date === today);
  const paused = e.status === "paused";

  return (
    <article className="rounded-3xl border-2 border-primary bg-card p-5 shadow-soft">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{paused ? "Paused" : `Day ${a.elapsed} of ${a.duration}`} · measuring {MEASURE_LABEL[e.measure as Measure].toLowerCase()}</p>
      <h3 className="mt-1 font-bold">{a.title}</h3>
      <p className="text-sm"><span className="font-semibold">Each day:</span> {e.target_behaviour}</p>
      {e.custom_hypothesis && <p className="text-xs text-muted-foreground">Expectation: {e.custom_hypothesis}</p>}
      <Progress value={(a.elapsed / a.duration) * 100} className="mt-3" />
      <p className="mt-1 text-xs text-muted-foreground">Done on {a.daysDone} of {a.elapsed} days · Baseline {MEASURE_LABEL[e.measure as Measure].toLowerCase()}: {a.baseline.avg ?? "not enough check-ins"}{a.baseline.avg !== null ? " / 5" : ""} ({a.baseline.days} check-ins in the 2 weeks before)</p>
      {!paused && !a.readyToFinish && (
        <div className="mt-3 space-y-2">
          {todayLog ? <p className="text-sm font-semibold text-calm-deep">{todayLog.done ? "✓ Done today" : "Logged as not done today"}</p> : null}
          <Input aria-label="Today's observation" placeholder="Anything you noticed today? (optional)" value={note} maxLength={300} onChange={(x) => setNote(x.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={async () => { if (await run((uid) => api.logExperimentDay(uid, e.id, today, true, note || todayLog?.note || null), "Logged.")) setNote(""); }}><Check /> I did it today</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={async () => { if (await run((uid) => api.logExperimentDay(uid, e.id, today, false, note || null), "Logged — that's useful information too.")) setNote(""); }}>Not today</Button>
          </div>
        </div>
      )}
      {a.observations.length > 0 && <details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold">Your observations ({a.observations.length})</summary><ul className="mt-1 list-disc pl-5">{a.observations.map((o) => <li key={o.date}>{o.date}: {o.note}</li>)}</ul></details>}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
        {paused ? <Button size="sm" onClick={() => run((uid) => api.setExperimentStatus(uid, e.id, "active", today), "Resumed.")}><Play /> Resume</Button>
          : <Button size="sm" variant="outline" onClick={() => run((uid) => api.setExperimentStatus(uid, e.id, "paused", today), "Paused.")}><Pause /> Pause</Button>}
        <Button size="sm" variant={a.readyToFinish ? "default" : "outline"} onClick={() => setEvalOpen(true)}>Finish & evaluate</Button>
        <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Stop this experiment? It stays in your history.")) void run((uid) => api.setExperimentStatus(uid, e.id, "abandoned", today), "Experiment stopped."); }}><X /> Stop</Button>
      </div>
      {evalOpen && (
        <form className="mt-4 space-y-3 rounded-2xl border-2 border-mind/50 p-4" onSubmit={async (x) => {
          x.preventDefault();
          const summary = `${a.measured.join(" ")} You said: did the behaviour — ${ev.achieved.toLowerCase()}; would continue — ${ev.continue.toLowerCase()}.`;
          if (await run((uid) => api.completeExperiment(uid, e.id, today, ev as unknown as Json, summary), "Experiment completed. Thanks for reflecting.")) setEvalOpen(false);
        }}>
          <p className="text-sm font-bold">How did it go?</p>
          <p className="text-xs text-muted-foreground">What we measured: {a.measured.join(" ")} {a.cannotConclude[0]}</p>
          {([["achieved", "Did you achieve the intended behaviour?", ["Yes", "Mostly", "Partly", "No"]], ["realistic", "Was it realistic?", ["Yes", "Somewhat", "No"]], ["continue", "Would you continue this habit?", ["Yes", "Maybe", "No"]]] as const).map(([k, q, opts]) => (
            <div key={k}><Label htmlFor={`ev-${k}`}>{q}</Label><select id={`ev-${k}`} className={sel} value={ev[k]} onChange={(z) => setEv({ ...ev, [k]: z.target.value })}>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>
          ))}
          <div><Label htmlFor="ev-ch">Did you notice any changes? (your own observation)</Label><Textarea id="ev-ch" rows={2} value={ev.changes} maxLength={400} onChange={(z) => setEv({ ...ev, changes: z.target.value })} /></div>
          <div><Label htmlFor="ev-l">What did you learn?</Label><Textarea id="ev-l" rows={2} value={ev.learned} maxLength={400} onChange={(z) => setEv({ ...ev, learned: z.target.value })} /></div>
          <div className="flex gap-2"><Button type="submit" disabled={busy}>Save results</Button><Button type="button" variant="ghost" onClick={() => setEvalOpen(false)}>Cancel</Button></div>
        </form>
      )}
    </article>
  );
}
