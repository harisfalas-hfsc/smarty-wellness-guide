import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PERIODS, useDaily } from "@/lib/daily";
import { todayKey, useWellness } from "@/lib/wellness-store";
import { RITUAL_META } from "@/lib/ritual-content";
import { cn } from "@/lib/utils";

/** Which ritual fits the current hour. */
function currentPeriod(h: number) {
  return h < 11 ? "morning" : h < 17 ? "midday" : "evening";
}

/** Today's rituals + habits at a glance, with gentle in-app reminders. */
export function DailyDashboard() {
  const { data, summary } = useDaily();
  const { state, todayCheckIn } = useWellness();
  if (!data || !summary) return null;

  const hour = new Date().getHours();
  const now = currentPeriod(hour);
  const reminders = (data.prefs?.reminders ?? {}) as Record<string, boolean>;
  const nudges: { text: string; to: "/morning" | "/midday" | "/evening" | "/habits" }[] = [];
  if (reminders[now] && summary.ritualStatus[now].state !== "completed") nudges.push({ text: `Time for your ${RITUAL_META[now].title}.`, to: RITUAL_META[now].route });
  if (reminders["hydration"] && summary.waterTarget && hour >= 10) {
    const expected = summary.waterTarget * Math.min(1, (hour - 7) / 14);
    if (summary.water < expected * 0.7) nudges.push({ text: "You're behind on water today. A glass now?", to: "/habits" });
  }
  const activeMissions = state.missions.filter((m) => m.status === "active");
  const missionsDone = activeMissions.filter((m) => m.completedDate === todayKey()).length;
  const activeChallenges = data.userChallenges.filter((u) => u.status === "active").length;

  const tiles = [
    { label: "Water", value: `${summary.water} ml`, pct: summary.waterPct, hint: summary.waterTarget ? `of ${summary.waterTarget} ml` : "Set a target", to: "/habits" as const, border: "border-primary/50" },
    { label: "Protein", value: `${Math.round(summary.protein)} g`, pct: summary.proteinPct, hint: summary.proteinTarget ? `of ${summary.proteinTarget} g` : "Set a target", to: "/habits" as const, border: "border-sun/70" },
    { label: "Breathing", value: `${summary.breathingMin} min`, pct: null, hint: `${summary.breathingCount} sessions`, to: "/breathing" as const, border: "border-mind/50" },
    { label: "Personal time", value: `${summary.personalIsWeekly ? summary.personalWeek : summary.personalToday} min`, pct: summary.personalPct, hint: summary.personalGoal ? `of ${summary.personalGoal} ${summary.personalIsWeekly ? "this week" : "today"}` : "Set a goal", to: "/habits" as const, border: "border-bloom/50" },
  ];

  return (
    <section className="rounded-3xl border-2 border-calm/60 bg-card p-6 shadow-soft">
      <p className="text-[10px] font-bold uppercase tracking-widest text-calm-deep">Your day at a glance</p>

      {nudges.length > 0 && (
        <div className="mt-3 space-y-2">
          {nudges.map((n) => (
            <Link key={n.text} to={n.to} className="block rounded-2xl border-2 border-sun/70 px-4 py-2.5 text-sm font-semibold no-underline" style={{ textDecoration: "none" }}>
              🔔 {n.text}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {PERIODS.map((p) => {
          const s = summary.ritualStatus[p];
          const meta = RITUAL_META[p];
          return (
            <Link key={p} to={meta.route} style={{ textDecoration: "none" }}
              className={cn("flex items-center gap-3 rounded-2xl border-2 p-3 text-foreground no-underline", s.state === "completed" ? "border-calm" : p === now ? "border-sun" : "border-primary/30")}>
              <span className="text-xl" aria-hidden>{meta.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{meta.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {s.state === "completed" ? "Completed" : s.state === "in-progress" ? `${s.done}/${s.total} done` : p === now ? "Available now" : "Pending"}
                </span>
              </span>
              {s.state === "completed" ? <CheckCircle2 className="h-5 w-5 text-calm-deep" /> : s.state === "in-progress" ? <CircleDot className="h-5 w-5 text-sun-deep" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} style={{ textDecoration: "none" }} className={cn("rounded-2xl border-2 p-3 text-foreground no-underline", t.border)}>
            <span className="block text-[11px] font-semibold text-muted-foreground">{t.label}</span>
            <span className="block text-lg font-black">{t.value}</span>
            {t.pct !== null && <Progress value={t.pct} className="mt-1 h-1.5" />}
            <span className="mt-1 block text-[11px] text-muted-foreground">{t.hint}</span>
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold">
        <Link to="/check-in" className="text-primary">Daily check-in: {todayCheckIn ? "done ✓" : "not yet"}</Link>
        <Link to="/missions" className="text-primary">Missions: {missionsDone}/{activeMissions.length} today</Link>
        <Link to="/challenges" className="text-primary">Challenges: {activeChallenges} active</Link>
      </div>
    </section>
  );
}
