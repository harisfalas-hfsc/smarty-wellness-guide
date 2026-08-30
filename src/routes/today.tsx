import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, CheckCircle2, Circle, Clock } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { SmartyCard, SmartyPill } from "@/components/SmartyCard";
import { Button } from "@/components/ui/button";
import { useWellness } from "@/lib/wellness-store";
import { buildRecommendations } from "@/lib/recommendation";
import { MOODS } from "@/lib/checkin-options";

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
  const primary = recs.find((r) => r.level === "primary")!;
  const mission = state.missions.find((m) => !m.completed) ?? state.missions[0];
  const challenge = state.challenges.find((c) => !c.completed) ?? state.challenges[0];
  const done = [
    ...state.missions.filter((m) => m.completed).map((m) => m.title),
    ...state.challenges.filter((c) => c.completed).map((c) => c.title),
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        icon={CalendarCheck}
        title="Today"
        subtitle="Your priorities for the day — not a dashboard."
      />

      <div className="space-y-5">
        <SmartyCard eyebrow="Today's recommendation" title={primary.headline}>
          <p className="text-lg font-bold sm:text-xl">{primary.action}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{primary.reason}</p>
          {primary.externalUrl ? (
            <a href={primary.externalUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <Button size="lg" className="mt-5 w-full sm:w-auto">
                {primary.ctaLabel}
              </Button>
            </a>
          ) : (
            <Link to="/check-in" style={{ textDecoration: "none" }}>
              <Button size="lg" className="mt-5 w-full sm:w-auto">
                {primary.ctaLabel}
              </Button>
            </Link>
          )}
        </SmartyCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border-2 border-calm/60 bg-card p-6 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-widest text-calm-deep">
              Today's mission
            </p>
            {mission && (
              <button
                type="button"
                onClick={() => toggleMission(mission.id)}
                className="mt-3 flex w-full cursor-pointer items-start gap-3 text-left"
              >
                {mission.completed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="block text-sm font-bold">{mission.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {mission.target} · step {mission.step} of {mission.totalSteps}
                  </span>
                </span>
              </button>
            )}
          </section>

          <section className="rounded-3xl border-2 border-sun/70 bg-card p-6 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sun-deep">
              Optional challenge
            </p>
            {challenge && (
              <button
                type="button"
                onClick={() => toggleChallenge(challenge.id)}
                className="mt-3 flex w-full cursor-pointer items-start gap-3 text-left"
              >
                {challenge.completed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="block text-sm font-bold">{challenge.title}</span>
                  <span className="block text-xs text-muted-foreground">{challenge.detail}</span>
                </span>
              </button>
            )}
          </section>
        </div>

        <section className="rounded-3xl border-2 border-primary/50 bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Today's wellness status
          </p>
          {todayCheckIn ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <SmartyPill icon={MOODS.find((m) => m.key === todayCheckIn.mood)?.emoji ?? "🙂"}>
                Mood: {MOODS.find((m) => m.key === todayCheckIn.mood)?.label ?? "Okay"}
              </SmartyPill>

              <SmartyPill icon="⚡">Energy: {todayCheckIn.energy}/5</SmartyPill>
              <SmartyPill icon="🌊">Stress: {todayCheckIn.stress}/5</SmartyPill>
              <SmartyPill icon="🔥">Motivation: {todayCheckIn.motivation}/5</SmartyPill>
              <SmartyPill icon="🌙">Sleep: {todayCheckIn.sleep}/5</SmartyPill>
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
                {done.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}
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
