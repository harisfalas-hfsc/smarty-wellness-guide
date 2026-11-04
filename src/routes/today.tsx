import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Check, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { SmartyCard, SmartyPill } from "@/components/SmartyCard";
import { Button } from "@/components/ui/button";
import { todayKey, useWellness } from "@/lib/wellness-store";
import { buildRecommendations, getTodaysChallenge, getTodaysMission } from "@/lib/recommendation";
import { MOODS } from "@/lib/checkin-options";
import { DailyDashboard } from "@/components/DailyDashboard";
import { DailyIntelligence } from "@/components/DailyIntelligence";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Today — Smarty Wellness" },
      {
        name: "description",
        content:
          "Your priorities for today: one recommendation, one mission, an optional challenge and your current wellness status.",
      },
      { property: "og:title", content: "Today — Smarty Wellness" },
      { property: "og:description", content: "What matters today, and nothing else." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { state, todayCheckIn, toggleMission, toggleChallenge } = useWellness();
  const recs = buildRecommendations(state, todayCheckIn);
  const primary = recs.find((r) => r.level === "primary") ?? recs[0];
  const mission = getTodaysMission(state, todayCheckIn);
  const challenge = getTodaysChallenge(state, todayCheckIn);
  const isDoneToday = (item: { completed: boolean; completedDate?: string }) =>
    item.completed && item.completedDate === todayKey();
  const done = [
    ...state.missions.filter(isDoneToday).map((m) => ({ id: m.id, title: m.title, type: "mission" as const })),
    ...state.challenges.filter(isDoneToday).map((c) => ({ id: c.id, title: c.title, type: "challenge" as const })),
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        icon={CalendarCheck}
        title="Today"
        subtitle={todayCheckIn ? "Your plan is based on today's check-in. Complete it at your own pace." : "Check in first, then Smarty will create your plan for today."}
      />

      <div className="space-y-5">
        <DailyIntelligence />

        {todayCheckIn && <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border-2 border-calm/60 bg-card p-6 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-widest text-calm-deep">
              Step 3 · Today's mission
            </p>
            {mission ? (
              <div className="mt-3">
                <div className="min-h-16">
                  <p className="text-sm font-bold">{mission.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {mission.target} · step {mission.step} of {mission.totalSteps}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{mission.detail}</p>
                </div>
                <div className="mt-4 border-t border-calm/30 pt-4">
                  <Button variant={isDoneToday(mission) ? "outline" : "default"} onClick={() => toggleMission(mission.id)}>
                    {isDoneToday(mission) ? <RotateCcw /> : <Check />}
                    {isDoneToday(mission) ? "Undo" : "Mark complete"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">All missions complete for today.</p>
            )}
          </section>

          <section className="rounded-3xl border-2 border-sun/70 bg-card p-6 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sun-deep">
              Optional extra challenge
            </p>
            {challenge ? (
              <div className="mt-3">
                <div className="min-h-16">
                  <p className="text-sm font-bold">{challenge.title}</p>
                  <p className="text-xs text-muted-foreground">{challenge.detail}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Skip this if you only want to focus on your mission.</p>
                </div>
                <div className="mt-4 border-t border-sun/40 pt-4">
                  <Button variant={isDoneToday(challenge) ? "outline" : "default"} onClick={() => toggleChallenge(challenge.id)}>
                    {isDoneToday(challenge) ? <RotateCcw /> : <Check />}
                    {isDoneToday(challenge) ? "Undo" : "Mark complete"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">All challenges complete for today.</p>
            )}
          </section>
        </div>}

        <DailyDashboard />

        <section className="rounded-3xl border-2 border-primary/50 bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Today's wellness status
          </p>
          {todayCheckIn ? (
            <div className="mt-3">
              <p className="mb-4 text-xs text-muted-foreground">These answers automatically update your recommendation, mission and optional challenge above.</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <SmartyPill tone="pink" icon={MOODS.find((m) => m.key === todayCheckIn.mood)?.emoji ?? "🙂"}>
                  Mood: {MOODS.find((m) => m.key === todayCheckIn.mood)?.label ?? "Okay"}
                </SmartyPill>
                <SmartyPill tone="yellow" icon="⚡">Energy: {todayCheckIn.energy}/5</SmartyPill>
                <SmartyPill tone="purple" icon="🌊">Stress: {todayCheckIn.stress}/5</SmartyPill>
                <SmartyPill tone="orange" icon="🔥">Motivation: {todayCheckIn.motivation}/5</SmartyPill>
                <SmartyPill tone="blue" icon="🌙">Sleep: {todayCheckIn.sleep}/5</SmartyPill>
              </div>
              <Link to="/check-in" className="mt-4 inline-block text-sm font-semibold text-primary">Update check-in</Link>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">You haven't checked in today.</p>
              <Link to="/check-in" style={{ textDecoration: "none" }}>
                <Button className="mt-4">Check in</Button>
              </Link>
            </div>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border-2 border-mind/50 bg-card p-6 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mind-deep">
              Upcoming action
            </p>
            <div className="mt-3 flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold">21:00 – 22:00</p>
                <p className="text-xs text-muted-foreground">
                  Smarty will use your schedule to place actions in time you actually have. Add
                  your daily life in your wellness profile.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border-2 border-bloom/50 bg-card p-6 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-widest text-bloom-deep">
              Completed
            </p>
            {done.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing yet today.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {done.map((item) => (
                  <li key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-2 text-sm text-foreground">
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item.title}</span>
                    <Button variant="ghost" size="icon" aria-label={`Undo ${item.title}`} title="Undo completion" onClick={() => item.type === "mission" ? toggleMission(item.id) : toggleChallenge(item.id)}><RotateCcw /></Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
