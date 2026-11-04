import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, ListChecks, Plus, RotateCcw, X } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { todayKey, useWellness } from "@/lib/wellness-store";
import { useDaily } from "@/lib/daily";
import { addDays } from "@/lib/daily-metrics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — Smarty Wellness" },
      { name: "description", content: "Daily, weekly and short challenges for movement, hydration, breathing, sleep, reading and more — plus your own personal challenges." },
      { property: "og:title", content: "Challenges — Smarty Wellness" },
      { property: "og:description", content: "Small, optional actions that make a day better." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChallengesPage,
});

/** Cycle of wellness colors so challenge cards feel energetic and varied. */
const CHALLENGE_TONES = ["border-sun/70", "border-primary/50", "border-calm/60", "border-mind/50", "border-energy/50", "border-bloom/50"];

function ChallengesPage() {
  const { state, toggleChallenge } = useWellness();
  const { data, today, run, api, busy } = useDaily();
  const [title, setTitle] = useState("");
  const [days, setDays] = useState("7");
  const daily = state.challenges.filter((c) => (c.cadence ?? "daily") === "daily");
  const periodic = state.challenges.filter((c) => c.cadence === "weekly" || c.cadence === "short");
  const done = daily.filter((c) => c.completed && c.completedDate === todayKey()).length;
  const active = data?.userChallenges.filter((u) => u.status === "active") ?? [];
  const finished = data?.userChallenges.filter((u) => u.status === "completed") ?? [];

  return (
    <PageShell>
      <PageHeader eyebrow={`${done} completed today`} icon={ListChecks} title="Challenges" subtitle="Optional, light and quick. Some count automatically when you log water, breathing or personal time." />

      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider">Daily challenges</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {daily.map((c, i) => {
          const isDone = c.completed && c.completedDate === todayKey();
          return (
            <button key={c.id} type="button" onClick={() => toggleChallenge(c.id)} aria-pressed={isDone}
              className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left shadow-soft transition", isDone ? "border-calm" : CHALLENGE_TONES[i % CHALLENGE_TONES.length])}>
              {isDone ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-calm-deep" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-sun-deep" />}
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">{c.title}</span>
                <span className="block text-xs text-muted-foreground">{c.instructions || c.detail}</span>
                {c.metric && c.metric !== "manual" && <span className="mt-1 block text-[11px] font-semibold text-primary">Counts automatically</span>}
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-extrabold uppercase tracking-wider">Your active challenges</h2>
      {active.length === 0 && <p className="text-sm text-muted-foreground">None yet — join one below or create your own.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {active.map((u) => {
          const def = state.challenges.find((c) => c.id === u.challenge_id);
          const doneToday = u.days.includes(today);
          const auto = def?.metric && def.metric !== "manual";
          return (
            <div key={u.id} className="rounded-2xl border-2 border-primary/50 bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{def?.title ?? u.custom_title}</p>
                  <p className="text-xs text-muted-foreground">{def?.instructions ?? u.custom_detail ?? "Your personal challenge."}</p>
                </div>
                <button aria-label="Leave challenge" disabled={busy} onClick={() => void run((uid) => api.leaveChallenge(uid, u.id), "Challenge left.")}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <Progress value={(u.days.length / u.target_days) * 100} className="mt-3" />
              <p className="mt-1 text-[11px] text-muted-foreground">{u.days.length} of {u.target_days} days · ends {u.ends_on}</p>
              {today <= u.ends_on && (
                auto && !doneToday ? (
                  <p className="mt-3 text-xs font-semibold text-primary">Counts automatically when you log it today.</p>
                ) : (
                  <Button size="sm" className="mt-3" variant={doneToday ? "outline" : "default"} disabled={busy}
                    onClick={() => void run((uid) => doneToday ? api.unmarkChallengeDay(uid, u.id, today) : api.markChallengeDay(uid, u.id, today))}>
                    {doneToday ? <><RotateCcw /> Undo today</> : <><CheckCircle2 /> Done today</>}
                  </Button>
                )
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-extrabold uppercase tracking-wider">Weekly & short challenges</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {periodic.map((c, i) => {
          const joined = active.some((u) => u.challenge_id === c.id);
          return (
            <div key={c.id} className={cn("rounded-2xl border-2 bg-card p-4 shadow-soft", CHALLENGE_TONES[(i + 2) % CHALLENGE_TONES.length])}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.cadence === "weekly" ? "Weekly" : "Short"} · {c.category}</p>
              <p className="mt-1 text-sm font-bold">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.detail}</p>
              {c.objective && <p className="mt-1 text-xs"><span className="font-semibold">Objective:</span> {c.objective}</p>}
              <Button size="sm" className="mt-3" disabled={busy || joined}
                onClick={() => void run((uid) => api.joinChallenge(uid, c.id, today, addDays(today, (c.durationDays ?? 7) - 1), c.targetDays ?? 1), "Challenge joined.")}>
                {joined ? "Joined" : "Join"}
              </Button>
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-extrabold uppercase tracking-wider">Create a personal challenge</h2>
      <div className="rounded-2xl border-2 border-bloom/50 bg-card p-4 shadow-soft">
        <div className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
          <input aria-label="Challenge" placeholder="e.g. No coffee after 2pm" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl border-2 border-bloom/40 bg-card px-3 text-sm outline-none" />
          <select aria-label="Days" value={days} onChange={(e) => setDays(e.target.value)} className="h-11 rounded-xl border-2 border-bloom/40 bg-card px-2 text-sm">
            {["3", "5", "7", "14", "21", "30"].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
          <Button disabled={busy || title.trim().length < 3}
            onClick={() => void run((uid) => api.joinChallenge(uid, null, today, addDays(today, Number(days) - 1), Number(days), { title: title.trim() }), "Personal challenge created.").then(() => setTitle(""))}>
            <Plus /> Create
          </Button>
        </div>
      </div>

      {finished.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-extrabold uppercase tracking-wider">Completed</h2>
          <ul className="space-y-2">
            {finished.map((u) => (
              <li key={u.id} className="flex items-center gap-2 rounded-2xl border-2 border-calm bg-card p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-calm-deep" /> {state.challenges.find((c) => c.id === u.challenge_id)?.title ?? u.custom_title}
                <span className="ml-auto text-xs text-muted-foreground">{u.completed_at?.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}
