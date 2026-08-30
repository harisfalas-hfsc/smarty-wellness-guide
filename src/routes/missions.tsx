import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Target } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Missions — Smarty Wellness" },
      {
        name: "description",
        content:
          "Small, realistic missions that build habits step by step — walk, read, cook, move, connect.",
      },
      { property: "og:title", content: "Missions — Smarty Wellness" },
      { property: "og:description", content: "Small actions, repeated. That is how life changes." },
    ],
  }),
  component: MissionsPage,
});

const AREA_LABEL: Record<string, string> = {
  movement: "Movement",
  training: "Training",
  nutrition: "Nutrition",
  mind: "Mind",
  social: "Social",
  personal: "Personal time",
};

/** One wellness color per mission area — consistent everywhere. */
const AREA_TONE: Record<string, { border: string; text: string }> = {
  movement: { border: "border-calm/60 hover:border-calm", text: "text-calm-deep" },
  training: { border: "border-energy/50 hover:border-energy", text: "text-energy-deep" },
  nutrition: { border: "border-sun/70 hover:border-sun", text: "text-sun-deep" },
  mind: { border: "border-mind/50 hover:border-mind", text: "text-mind-deep" },
  social: { border: "border-bloom/50 hover:border-bloom", text: "text-bloom-deep" },
  personal: { border: "border-primary/50 hover:border-primary", text: "text-primary" },
};
const FALLBACK_TONE = AREA_TONE.personal!;

function MissionsPage() {
  const { state, toggleMission } = useWellness();
  const completed = state.missions.filter((m) => m.completed).length;
  const pct = state.missions.length ? (completed / state.missions.length) * 100 : 0;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Small and realistic"
        icon={Target}
        title="Missions"
        subtitle="Missions grow with you. When one becomes normal, Smarty raises it and opens the next."
      />

      <section className="rounded-3xl border-2 border-primary bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">This week</p>
          <p className="text-sm font-semibold text-muted-foreground">
            {completed} of {state.missions.length} complete
          </p>
        </div>
        <Progress value={pct} className="mt-3" />
      </section>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {state.missions.map((m) => {
          const tone = AREA_TONE[m.area] ?? FALLBACK_TONE;
          return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggleMission(m.id)}
            className={`flex cursor-pointer items-start gap-3 rounded-3xl border-2 bg-card p-5 text-left transition shadow-soft ${
              m.completed ? "border-calm" : tone.border
            }`}
          >
            {m.completed ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-calm-deep" />
            ) : (
              <Circle className={`mt-0.5 h-5 w-5 shrink-0 ${tone.text}`} />
            )}
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${tone.text}`}>
                {AREA_LABEL[m.area]}
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">{m.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.detail}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
                  {m.target}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Step {m.step} of {m.totalSteps}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-6 pb-2 text-xs leading-5 text-muted-foreground">
        Missions are not a punishment system. Missing one changes nothing except the pace.
      </p>
    </PageShell>
  );
}
