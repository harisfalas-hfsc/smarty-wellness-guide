import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { todayKey, useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Daily Challenges — Smarty Wellness" },
      {
        name: "description",
        content:
          "Light daily challenges: take the stairs, walk instead of driving, 20 minutes outside, read five pages.",
      },
      { property: "og:title", content: "Daily Challenges — Smarty Wellness" },
      { property: "og:description", content: "One small change today. Nothing dramatic." },
    ],
  }),
  component: ChallengesPage,
});

/** Cycle of wellness colors so challenge cards feel energetic and varied. */
const CHALLENGE_TONES = [
  "border-sun/70",
  "border-primary/50",
  "border-calm/60",
  "border-mind/50",
  "border-energy/50",
  "border-bloom/50",
];

function ChallengesPage() {
  const { state, toggleChallenge } = useWellness();
  const done = state.challenges.filter((c) => c.completed && c.completedDate === todayKey()).length;

  return (
    <PageShell>
      <PageHeader
        eyebrow={`${done} completed today`}
        icon={ListChecks}
        title="Challenges"
        subtitle="Optional, light and quick. Pick one — or none."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {state.challenges.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggleChallenge(c.id)}
            aria-pressed={c.completed && c.completedDate === todayKey()}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left transition shadow-soft ${
              c.completed && c.completedDate === todayKey()
                ? "border-calm"
                : CHALLENGE_TONES[i % CHALLENGE_TONES.length]
            }`}
          >
            {c.completed && c.completedDate === todayKey() ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-calm-deep" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-sun-deep" />
            )}
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">{c.title}</span>
              <span className="block text-xs text-muted-foreground">{c.detail}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-6 pb-2 text-xs leading-5 text-muted-foreground">
        Challenges will become personalised once Smarty knows your week.
      </p>
    </PageShell>
  );
}
