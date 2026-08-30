import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { SmartyCard } from "@/components/SmartyCard";
import { useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Wellness Review — Smarty Wellness" },
      {
        name: "description",
        content:
          "Every 10–14 days Smarty reviews mood, energy, stress, movement, training, nutrition, personal time and consistency — with words, not scores.",
      },
      { property: "og:title", content: "Wellness Review — Smarty Wellness" },
      { property: "og:description", content: "Trends and explanations, never a fake score." },
    ],
  }),
  component: ReviewPage,
});

const AREAS = [
  { label: "Mood", status: "Improving" },
  { label: "Energy", status: "Stable" },
  { label: "Stress", status: "Improving" },
  { label: "Movement", status: "Improving" },
  { label: "Training", status: "Needs attention" },
  { label: "Nutrition", status: "Stable" },
  { label: "Personal time", status: "Needs attention" },
  { label: "Social connection", status: "Stable" },
  { label: "Consistency", status: "Improving" },
];

/** Cycle of wellness colors for review area cards. */
const AREA_TONES = [
  "border-calm/60",
  "border-primary/50",
  "border-sun/70",
  "border-mind/50",
  "border-bloom/50",
  "border-energy/50",
];

const TONE: Record<string, string> = {
  Improving: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Stable: "border-primary/40 bg-primary/5 text-primary",
  "Needs attention": "border-amber-300 bg-amber-50 text-amber-700",
  "Significant change": "border-border bg-muted text-muted-foreground",
};

function ReviewPage() {
  const { state } = useWellness();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Every 10–14 days"
        icon={ClipboardList}
        title="Wellness review"
        subtitle="No 73/100 mental health score. Wellbeing does not reduce to one number."
      />

      <SmartyCard eyebrow="Current period" title="What Smarty is watching">
        <p className="text-sm leading-6 text-muted-foreground">
          Based on {state.checkIns.length} check-in{state.checkIns.length === 1 ? "" : "s"} so far.
          Your review becomes personal once Smarty has enough of your own baseline to compare
          against — roughly two weeks of daily check-ins.
        </p>
      </SmartyCard>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((a, i) => (
          <div
            key={a.label}
            className={`rounded-2xl border-2 bg-card p-4 shadow-soft ${AREA_TONES[i % AREA_TONES.length]}`}
          >
            <p className="text-sm font-bold text-foreground">{a.label}</p>
            <span
              className={`mt-2 inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${TONE[a.status]}`}
            >
              {a.status}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 pb-2 text-xs leading-5 text-muted-foreground">
        Reviews describe direction and give reasons. They are guidance, not a clinical assessment.
      </p>
    </PageShell>
  );
}
