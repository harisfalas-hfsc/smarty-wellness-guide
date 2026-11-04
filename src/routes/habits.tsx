import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Trash2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useDaily } from "@/lib/daily";
import { useWellness } from "@/lib/wellness-store";
import { lastDays, sumBy, weekDates } from "@/lib/daily-metrics";
import { PERSONAL_CATEGORIES } from "@/lib/ritual-content";
import type { PersonalCategory } from "@/lib/data/daily-repo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Daily habits — Smarty Wellness" },
      { name: "description", content: "Track water, protein and personal time against targets you choose, with daily progress and history." },
      { property: "og:title", content: "Daily habits — Smarty Wellness" },
      { property: "og:description", content: "Water, protein and time for yourself — simple daily tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HabitsPage,
});

const inputCls = "h-11 w-full rounded-xl border-2 bg-card px-3 text-sm outline-none";

function History({ today, values, unit, target }: { today: string; values: (d: string) => number; unit: string; target: number | null }) {
  const days = lastDays(today, 7).reverse();
  const max = Math.max(target ?? 0, ...days.map(values), 1);
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold text-muted-foreground">Last 7 days</p>
      <div className="mt-2 flex h-20 items-end gap-1.5">
        {days.map((d) => {
          const v = values(d);
          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d}: ${v} ${unit}`}>
              <div className="w-full rounded-md bg-primary/70" style={{ height: `${Math.max(4, (v / max) * 64)}px` }} />
              <span className="text-[10px] text-muted-foreground">{new Date(d + "T12:00:00").toLocaleDateString([], { weekday: "narrow" })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HabitsPage() {
  const { data, summary, today, run, api, busy, loading } = useDaily();
  const { state } = useWellness();
  const prefs = data?.prefs;
  const [waterTarget, setWaterTarget] = useState("");
  const [customMl, setCustomMl] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [proteinSource, setProteinSource] = useState<"user" | "professional">("user");
  const [grams, setGrams] = useState("");
  const [proteinLabel, setProteinLabel] = useState("");
  const [category, setCategory] = useState<PersonalCategory>("reading");
  const [minutes, setMinutes] = useState("15");
  const [ptGoal, setPtGoal] = useState("");
  const [ptPeriod, setPtPeriod] = useState<"daily" | "weekly">("daily");

  if (loading || !data || !summary) {
    return <PageShell><PageHeader icon={Droplets} title="Daily habits" /><p className="text-center text-sm text-muted-foreground">Loading…</p></PageShell>;
  }

  const reminders = (prefs?.reminders ?? {}) as Record<string, boolean>;
  const todayEntries = <R extends { local_date: string }>(rows: R[]) => rows.filter((r) => r.local_date === today);
  const week = weekDates(today);

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Small things, every day" icon={Droplets} title="Daily habits" subtitle="Water, protein and time for yourself. Your targets, your pace." />

      <div className="space-y-5">
        {/* Hydration */}
        <section className="rounded-3xl border-2 border-primary bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">💧 Hydration</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-black">{summary.water} <span className="text-base font-semibold text-muted-foreground">ml</span></p>
            <p className="text-sm text-muted-foreground">{summary.waterTarget ? `of ${summary.waterTarget} ml` : "No target set"}</p>
          </div>
          {summary.waterPct !== null && <Progress value={summary.waterPct} className="mt-3" />}
          <div className="mt-4 flex flex-wrap gap-2">
            {[150, 250, 330, 500].map((ml) => (
              <Button key={ml} variant="outline" disabled={busy} onClick={() => void run((uid) => api.logWater(uid, today, ml), `+${ml} ml`)}>+{ml} ml</Button>
            ))}
            <div className="flex gap-2">
              <input aria-label="Custom amount in ml" inputMode="numeric" placeholder="ml" value={customMl} onChange={(e) => setCustomMl(e.target.value.replace(/\D/g, ""))} className={cn(inputCls, "w-24 border-primary/40")} />
              <Button disabled={busy || !customMl || Number(customMl) < 10 || Number(customMl) > 3000} onClick={() => void run((uid) => api.logWater(uid, today, Number(customMl)), `+${customMl} ml`).then(() => setCustomMl(""))}>Add</Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold">Daily target (ml)
              <input inputMode="numeric" placeholder={String(summary.waterTarget ?? "e.g. 2000")} value={waterTarget} onChange={(e) => setWaterTarget(e.target.value.replace(/\D/g, ""))} className={cn(inputCls, "mt-1 w-36 border-primary/40")} />
            </label>
            <Button variant="outline" disabled={busy || Number(waterTarget) < 250 || Number(waterTarget) > 8000} onClick={() => void run((uid) => api.savePrefs(uid, { water_target_ml: Number(waterTarget) }), "Water target saved.").then(() => setWaterTarget(""))}>Save target</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Needs differ with body size, climate and activity. Choose what feels right for you, or ask a professional.</p>
          {todayEntries(data.hydration).length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {todayEntries(data.hydration).map((h) => (
                <li key={h.id} className="flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-xs">
                  {h.amount_ml} ml · {new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  <button aria-label="Remove entry" onClick={() => void run((uid) => api.deleteEntry(uid, "hydration_entries", h.id))}><Trash2 className="h-3 w-3" /></button>
                </li>
              ))}
            </ul>
          )}
          <History today={today} unit="ml" target={summary.waterTarget} values={(d) => sumBy(data.hydration, d, (r) => r.local_date, (r) => r.amount_ml)} />
        </section>

        {/* Protein */}
        <section className="rounded-3xl border-2 border-sun/70 bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sun-deep">🥚 Protein</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-black">{Math.round(summary.protein)} <span className="text-base font-semibold text-muted-foreground">g</span></p>
            <p className="text-sm text-muted-foreground">
              {summary.proteinTarget ? `of ${summary.proteinTarget} g · ${prefs?.protein_target_source === "professional" ? "set by a professional" : "your own target"}` : "No target set"}
            </p>
          </div>
          {summary.proteinPct !== null && <Progress value={summary.proteinPct} className="mt-3" />}
          <div className="mt-4 grid gap-2 sm:grid-cols-[6rem_1fr_auto]">
            <input aria-label="Grams of protein" inputMode="decimal" placeholder="grams" value={grams} onChange={(e) => setGrams(e.target.value.replace(/[^\d.]/g, ""))} className={cn(inputCls, "border-sun/60")} />
            <input aria-label="What you ate (optional)" placeholder="What was it? (optional)" value={proteinLabel} maxLength={60} onChange={(e) => setProteinLabel(e.target.value)} className={cn(inputCls, "border-sun/60")} />
            <Button disabled={busy || !(Number(grams) > 0 && Number(grams) <= 300)} onClick={() => void run((uid) => api.logProtein(uid, today, Number(grams), proteinLabel), `+${grams} g protein`).then(() => { setGrams(""); setProteinLabel(""); })}>Add</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold">Daily target (g)
              <input inputMode="numeric" placeholder={String(summary.proteinTarget ?? "e.g. 100")} value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value.replace(/\D/g, ""))} className={cn(inputCls, "mt-1 w-32 border-sun/60")} />
            </label>
            <div className="flex gap-1">
              {(["user", "professional"] as const).map((s) => (
                <button key={s} type="button" aria-pressed={proteinSource === s} onClick={() => setProteinSource(s)} className={cn("h-11 rounded-xl border-2 px-3 text-xs font-semibold", proteinSource === s ? "border-sun bg-sun/25" : "border-sun/50")}>
                  {s === "user" ? "My own target" : "From a professional"}
                </button>
              ))}
            </div>
            <Button variant="outline" disabled={busy || Number(proteinTarget) < 10 || Number(proteinTarget) > 400} onClick={() => void run((uid) => api.savePrefs(uid, { protein_target_g: Number(proteinTarget), protein_target_source: proteinSource }), "Protein target saved.").then(() => setProteinTarget(""))}>Save target</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Smarty doesn't prescribe a protein target.{state.profile.nutrition.goals ? ` Your nutrition goal: “${state.profile.nutrition.goals}”.` : ""} For a personal recommendation, speak to a dietitian or use Smarty Diet.
          </p>
          {todayEntries(data.protein).length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {todayEntries(data.protein).map((p) => (
                <li key={p.id} className="flex items-center gap-1 rounded-full border border-sun/60 px-3 py-1 text-xs">
                  {Number(p.grams)} g{p.label ? ` · ${p.label}` : ""}
                  <button aria-label="Remove entry" onClick={() => void run((uid) => api.deleteEntry(uid, "protein_entries", p.id))}><Trash2 className="h-3 w-3" /></button>
                </li>
              ))}
            </ul>
          )}
          <History today={today} unit="g" target={summary.proteinTarget} values={(d) => sumBy(data.protein, d, (r) => r.local_date, (r) => Number(r.grams))} />
        </section>

        {/* Personal time */}
        <section className="rounded-3xl border-2 border-bloom/50 bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-bloom-deep">🧘 Personal time</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-black">{summary.personalToday} <span className="text-base font-semibold text-muted-foreground">min today</span></p>
            <p className="text-sm text-muted-foreground">{summary.personalWeek} min this week</p>
          </div>
          {summary.personalPct !== null && (
            <>
              <Progress value={summary.personalPct} className="mt-3" />
              <p className="mt-1 text-xs text-muted-foreground">Goal: {summary.personalGoal} min {summary.personalIsWeekly ? "per week" : "per day"}</p>
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {PERSONAL_CATEGORIES.map((c) => (
              <button key={c.value} type="button" aria-pressed={category === c.value} onClick={() => setCategory(c.value)} className={cn("min-h-10 rounded-full border-2 px-3 text-sm font-semibold", category === c.value ? "border-bloom bg-bloom/10" : "border-bloom/40")}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["10", "15", "30", "60"].map((m) => (
              <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m)} className={cn("h-10 rounded-full border-2 px-3 text-sm font-semibold", minutes === m ? "border-bloom bg-bloom/10" : "border-bloom/40")}>{m} min</button>
            ))}
            <input aria-label="Minutes" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} className={cn(inputCls, "w-20 border-bloom/40")} />
            <Button disabled={busy || !(Number(minutes) >= 1 && Number(minutes) <= 720)} onClick={() => void run((uid) => api.logPersonal(uid, today, category, Number(minutes)), `${minutes} minutes logged.`)}>Log time</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold">Goal (minutes)
              <input inputMode="numeric" placeholder={String(summary.personalGoal ?? "e.g. 30")} value={ptGoal} onChange={(e) => setPtGoal(e.target.value.replace(/\D/g, ""))} className={cn(inputCls, "mt-1 w-28 border-bloom/40")} />
            </label>
            {(["daily", "weekly"] as const).map((p) => (
              <button key={p} type="button" aria-pressed={ptPeriod === p} onClick={() => setPtPeriod(p)} className={cn("h-11 rounded-xl border-2 px-3 text-xs font-semibold", ptPeriod === p ? "border-bloom bg-bloom/10" : "border-bloom/40")}>{p === "daily" ? "Per day" : "Per week"}</button>
            ))}
            <Button variant="outline" disabled={busy || Number(ptGoal) < 5} onClick={() => void run((uid) => api.savePrefs(uid, { personal_time_goal_min: Number(ptGoal), personal_time_goal_period: ptPeriod }), "Goal saved.").then(() => setPtGoal(""))}>Save goal</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">This is time that's only yours — not work, not chores. Any amount counts.</p>
          {data.personal.filter((p) => week.includes(p.local_date)).length > 0 && (
            <ul className="mt-3 divide-y divide-bloom/20 text-sm">
              {data.personal.filter((p) => week.includes(p.local_date)).slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span>{PERSONAL_CATEGORIES.find((c) => c.value === p.category)?.emoji} {PERSONAL_CATEGORIES.find((c) => c.value === p.category)?.label} · {p.minutes} min</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {p.local_date === today ? "Today" : p.local_date}
                    <button aria-label="Remove entry" onClick={() => void run((uid) => api.deleteEntry(uid, "personal_time_entries", p.id))}><Trash2 className="h-3 w-3" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <History today={today} unit="min" target={summary.personalIsWeekly ? null : summary.personalGoal} values={(d) => sumBy(data.personal, d, (r) => r.local_date, (r) => r.minutes)} />
        </section>

        {/* Reminders */}
        <section className="rounded-3xl border-2 border-mind/50 bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mind-deep">Gentle reminders</p>
          <p className="mt-2 text-xs text-muted-foreground">When on, a short reminder appears on your Today page at the right time of day. No pop-ups.</p>
          <div className="mt-4 space-y-3">
            {([["morning", "Morning Activation"], ["midday", "Midday Reset"], ["evening", "Evening Unwind"], ["hydration", "Drink water"], ["goals", "Goal milestones & target dates"], ["experiments", "Experiment check-ins"], ["reviews", "Weekly & monthly reviews"]] as const).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 text-sm font-semibold">
                {label}
                <Switch checked={Boolean(reminders[k])} onCheckedChange={(v) => void run((uid) => api.savePrefs(uid, { reminders: { ...reminders, [k]: v } }))} />
              </label>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
