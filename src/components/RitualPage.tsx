import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, CheckCircle2, ChevronDown, Circle, Eye, EyeOff, RotateCcw, Settings2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { BreathingGuide } from "@/components/BreathingGuide";
import { QuestionField, type AnswerValue } from "@/components/QuestionField";
import { useDaily } from "@/lib/daily";
import { lastDays } from "@/lib/daily-metrics";
import { RITUAL_ID, type Period, type RitualActivityDef } from "@/lib/data/daily-repo";
import {
  CLOSING, EXTRA_SECTIONS, MORNING_INTENTION, PERIOD_QUESTIONS, REFLECTION, RESET_NEEDS, RITUAL_META, messageFor,
} from "@/lib/ritual-content";
import { toneClasses } from "@/components/SmartyCard";
import { cn } from "@/lib/utils";

type Answers = Record<string, AnswerValue>;

export function RitualPage({ period }: { period: Period }) {
  const meta = RITUAL_META[period];
  const tone = toneClasses(meta.tone);
  const { data, summary, today, loading, error, busy, run, api } = useDaily();
  const existing = data?.periodCheckIns.find((c) => c.period === period && c.local_date === today);
  const [answers, setAnswers] = useState<Answers>({});
  const [showExtra, setShowExtra] = useState(false);
  const [customise, setCustomise] = useState(false);
  const [breathingFor, setBreathingFor] = useState<string | null>(null);
  const [need, setNeed] = useState<string | null>(null);

  useEffect(() => {
    if (existing) setAnswers((existing.answers ?? {}) as Answers);
  }, [existing?.id, existing?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const hidden = data?.prefs?.hidden_ritual_activities ?? [];
  const allActivities = useMemo(() => data?.activities.filter((a) => a.ritual_id === RITUAL_ID[period]) ?? [], [data, period]);
  const activities = allActivities.filter((a) => !hidden.includes(a.id));
  const isDone = (id: string) => Boolean(data?.activityDone.some((c) => c.activity_id === id && c.local_date === today));
  const status = summary?.ritualStatus[period];
  const finishedRow = data?.ritualDone.find((r) => r.ritual_id === RITUAL_ID[period] && r.local_date === today);
  const required = activities.filter((a) => !a.optional);
  const requiredDone = required.filter((a) => isDone(a.id)).length;

  const set = (k: string, v: AnswerValue | undefined) =>
    setAnswers((a) => { const n = { ...a }; if (v === undefined || v === "") delete n[k]; else n[k] = v; return n; });

  const saveCheckIn = () =>
    run((uid) => api.savePeriodCheckIn(uid, today, period, answers), "Check-in saved.");

  const doActivity = async (a: RitualActivityDef) => {
    if (a.kind === "breathing") { setBreathingFor(a.id); return; }
    if (a.kind === "hydration") {
      await run(async (uid) => { await api.logWater(uid, today, 250); await api.completeActivity(uid, today, a.id); }, "250 ml of water logged.");
      return;
    }
    if (a.kind === "personal_time") {
      await run(async (uid) => {
        await api.logPersonal(uid, today, (a.personal_category ?? "other") as never, a.minutes);
        await api.completeActivity(uid, today, a.id, a.minutes * 60);
      }, `${a.minutes} minutes of personal time logged.`);
      return;
    }
    await run((uid) => api.completeActivity(uid, today, a.id, a.minutes * 60));
  };

  const toggleHidden = (id: string) => {
    const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
    void run((uid) => api.savePrefs(uid, { hidden_ritual_activities: next }));
  };

  const questions = PERIOD_QUESTIONS[period];
  const answeredCount = Object.keys(answers).length;
  const history = lastDays(today, 7).reverse();

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow={meta.eyebrow} icon={meta.emoji} title={meta.title} subtitle={meta.purpose} />

      {loading && <p className="text-center text-sm text-muted-foreground">Loading your day…</p>}
      {error && <p className="text-center text-sm text-energy-deep">We couldn't load your day. Please refresh.</p>}

      {data && (
        <div className="space-y-5">
          <section className={cn("rounded-3xl border-2 bg-card p-6 shadow-soft", tone.border)}>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", tone.text)}>Today's message</p>
            <p className="mt-3 text-base font-semibold leading-7">{messageFor(period, today)}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {status?.finished ? "Completed today ✓" : `${status?.done ?? 0} of ${status?.total ?? 0} activities done`}
            </p>
          </section>

          {/* Check-in */}
          <section className="rounded-3xl border-2 border-bloom/50 bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-bloom-deep">Step 1 · Quick check-in</p>
              {existing && <span className="text-xs font-semibold text-calm-deep">Saved ✓</span>}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Answer what feels relevant. Every question is optional.</p>
            <div className="mt-5 space-y-6">
              {questions.map((q) => <QuestionField key={q.key} q={q} value={answers[q.key]} onChange={(v) => set(q.key, v)} />)}
              {period === "morning" && MORNING_INTENTION.map((q) => <QuestionField key={q.key} q={q} value={answers[q.key]} onChange={(v) => set(q.key, v)} />)}
              {period === "evening" && (
                <div className="space-y-6 rounded-2xl border-2 border-mind/40 p-4">
                  <p className="text-sm font-bold">Daily reflection</p>
                  {REFLECTION.map((q) => <QuestionField key={q.key} q={q} value={answers[q.key]} onChange={(v) => set(q.key, v)} />)}
                </div>
              )}
              <button type="button" onClick={() => setShowExtra((s) => !s)} className="flex items-center gap-1 text-sm font-semibold text-primary">
                <ChevronDown className={cn("h-4 w-4 transition", showExtra && "rotate-180")} />
                {showExtra ? "Hide" : "Add more detail"} (physical, mental, lifestyle)
              </button>
              {showExtra && EXTRA_SECTIONS.map((s) => (
                <div key={s.key} className="space-y-5 rounded-2xl border-2 border-primary/30 p-4">
                  <p className="text-sm font-bold">{s.title}</p>
                  {s.questions.map((q) => {
                    const k = `${s.key}.${q.key}`;
                    return <QuestionField key={k} q={q} value={answers[k]} onChange={(v) => set(k, v)} />;
                  })}
                </div>
              ))}
            </div>
            <Button className="mt-6" disabled={busy || answeredCount === 0} onClick={() => void saveCheckIn()}>
              <Check /> {existing ? "Update check-in" : "Save check-in"}
            </Button>
          </section>

          {/* Midday personal reset */}
          {period === "midday" && (
            <section className="rounded-3xl border-2 border-sun/70 bg-card p-6 shadow-soft">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sun-deep">Personal reset</p>
              <p className="mt-2 text-sm font-semibold">What do you need most right now?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {RESET_NEEDS.map((n) => (
                  <button key={n.key} type="button" aria-pressed={need === n.key} onClick={() => setNeed(n.key)}
                    className={cn("min-h-10 rounded-full border-2 px-4 text-sm font-semibold", need === n.key ? "border-sun bg-sun/25" : "border-sun/50 bg-card")}>
                    {n.emoji} {n.label}
                  </button>
                ))}
              </div>
              {need && (() => {
                const n = RESET_NEEDS.find((x) => x.key === need)!;
                const target = n.activityKind === "breathing" ? "ra-d-breathe" : n.activityKind === "move" ? "ra-d-move" : n.activityKind === "outside" ? "ra-d-out" : "ra-d-focus";
                const act = allActivities.find((a) => a.id === target);
                return (
                  <div className="mt-4 rounded-2xl border-2 border-sun/50 p-4">
                    <p className="text-sm font-bold">Try this</p>
                    <p className="mt-1 text-sm text-muted-foreground">{n.suggestion}</p>
                    {act && (isDone(act.id)
                      ? <p className="mt-3 text-sm font-semibold text-calm-deep">Done ✓</p>
                      : <Button className="mt-3" disabled={busy} onClick={() => void doActivity(act)}>{act.kind === "breathing" ? "Start breathing" : "I did it"}</Button>)}
                  </div>
                );
              })()}
            </section>
          )}

          {/* Activities */}
          <section className="rounded-3xl border-2 border-calm/60 bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-calm-deep">Step 2 · Activities</p>
              <button type="button" onClick={() => setCustomise((c) => !c)} className="flex items-center gap-1 text-xs font-semibold text-primary">
                <Settings2 className="h-4 w-4" /> {customise ? "Done" : "Customise"}
              </button>
            </div>
            {customise && <p className="mt-2 text-xs text-muted-foreground">Hide activities that don't fit your mornings, time or lifestyle. You can bring them back anytime.</p>}
            <ul className="mt-4 space-y-3">
              {(customise ? allActivities : activities).map((a) => {
                const done = isDone(a.id);
                const isHidden = hidden.includes(a.id);
                return (
                  <li key={a.id} className={cn("rounded-2xl border-2 p-4", done ? "border-calm" : "border-calm/30", isHidden && "opacity-50")}>
                    <div className="flex items-start gap-3">
                      {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-calm-deep" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-calm-deep" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{a.title} <span className="font-medium text-muted-foreground">· {a.minutes} min{a.optional ? " · optional" : ""}</span></p>
                        <p className="text-xs leading-5 text-muted-foreground">{a.detail}</p>
                      </div>
                      {customise ? (
                        <Button size="sm" variant="outline" onClick={() => toggleHidden(a.id)} aria-label={isHidden ? `Show ${a.title}` : `Hide ${a.title}`}>
                          {isHidden ? <Eye /> : <EyeOff />}
                        </Button>
                      ) : done ? (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => void run((uid) => api.undoActivity(uid, today, a.id))}>
                          <RotateCcw /> Undo
                        </Button>
                      ) : (
                        <Button size="sm" disabled={busy} onClick={() => void doActivity(a)}>
                          {a.kind === "breathing" ? "Start" : a.kind === "hydration" ? "Log 250 ml" : "Done"}
                        </Button>
                      )}
                    </div>
                    {breathingFor === a.id && !done && (
                      <div className="mt-4 border-t border-calm/30 pt-4">
                        <BreathingGuide compact defaultMinutes={a.minutes} defaultPattern={period === "midday" ? "box" : period === "evening" ? "relax" : "balance"}
                          onComplete={(pattern, secs) => {
                            setBreathingFor(null);
                            void run(async (uid) => {
                              await api.logBreathing(uid, today, pattern, secs, period);
                              await api.completeActivity(uid, today, a.id, secs);
                            }, "Breathing session saved.");
                          }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Finish */}
          <section className={cn("rounded-3xl border-2 bg-card p-6 shadow-soft", tone.border)}>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", tone.text)}>Step 3 · Finish</p>
            {finishedRow ? (
              <p className="mt-3 text-base font-semibold leading-7">{finishedRow.closing_message ?? CLOSING[period]}</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {requiredDone} of {required.length} main activities done. Consistency matters more than doing everything.
                </p>
                <Button className="mt-4" disabled={busy} onClick={() => void run((uid) => api.completeRitual(uid, today, period, CLOSING[period]), `${meta.title} complete.`)}>
                  <Check /> Complete {meta.title}
                </Button>
              </>
            )}
            <div className="mt-5">
              <p className="text-xs font-semibold text-muted-foreground">Last 7 days</p>
              <div className="mt-2 flex gap-1.5">
                {history.map((d) => {
                  const ok = data.ritualDone.some((r) => r.ritual_id === RITUAL_ID[period] && r.local_date === d);
                  return <span key={d} title={d} className={cn("h-3 flex-1 rounded-full border", ok ? "border-calm bg-calm" : "border-calm/40 bg-card")} />;
                })}
              </div>
            </div>
            <Link to="/today" className="mt-4 inline-block text-sm font-semibold text-primary">Back to Today</Link>
          </section>
        </div>
      )}
    </PageShell>
  );
}
