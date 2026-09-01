import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/experiments")({
  head: () => ({
    meta: [
      { title: "Wellness Experiments — Smarty Wellness" },
      {
        name: "description",
        content:
          "Run a short, honest experiment on your own life and let Smarty tell you whether energy, mood, stress and motivation actually changed.",
      },
      { property: "og:title", content: "Wellness Experiments — Smarty Wellness" },
      { property: "og:description", content: "Find out what works for you, not in general." },
    ],
  }),
  component: ExperimentsPage,
});

/** Cycle of wellness colors for experiment cards. */
const EXP_TONES = [
  "border-mind/50",
  "border-calm/60",
  "border-sun/70",
  "border-bloom/50",
];

function ExperimentsPage() {
  const { state } = useWellness();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Test it on yourself"
        icon={FlaskConical}
        title="Experiments"
        subtitle="Seven to ten days of one small change, then an honest look at what moved."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {state.experiments.map((e, idx) => (
          <div
            key={e.id}
            className={`rounded-3xl border-2 bg-card p-5 shadow-soft ${EXP_TONES[idx % EXP_TONES.length]}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {e.days} days
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{e.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{e.hypothesis}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.measures.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>
            <Button variant="outline" size="lg" className="mt-4 w-full" disabled={state.checkIns.length < 14}>
              {state.checkIns.length < 14 ? "Available when your baseline is ready" : "Start experiment"}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-6 pb-2 text-xs leading-5 text-muted-foreground">
        Experiments need a baseline to compare against, so they unlock after a couple of weeks of
        check-ins.
      </p>
    </PageShell>
  );
}
