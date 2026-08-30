import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { SmartyCard } from "@/components/SmartyCard";
import { useWellness } from "@/lib/wellness-store";
import type { TrendItem } from "@/lib/wellness-types";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Journey — Smarty Wellness" },
      {
        name: "description",
        content:
          "See how your stress, movement, training, nutrition and personal time have changed over time — in plain language.",
      },
      { property: "og:title", content: "Journey — Smarty Wellness" },
      { property: "og:description", content: "Where you were, where you are now." },
    ],
  }),
  component: JourneyPage,
});

const SAMPLE: TrendItem[] = [
  { label: "Stress", then: "High", now: "Improving", status: "improving" },
  { label: "Movement", then: "Low", now: "Improving", status: "improving" },
  { label: "Training", then: "Inconsistent", now: "Consistent", status: "improving" },
  { label: "Nutrition", then: "Inconsistent", now: "Improving", status: "improving" },
  { label: "Personal time", then: "Low", now: "Improving", status: "improving" },
  { label: "Sleep", then: "Broken", now: "Stable", status: "stable" },
];

const STATUS_STYLE: Record<TrendItem["status"], string> = {
  improving: "border-emerald-300 bg-emerald-50 text-emerald-700",
  stable: "border-primary/40 bg-primary/5 text-primary",
  "needs-attention": "border-amber-300 bg-amber-50 text-amber-700",
  changed: "border-border bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<TrendItem["status"], string> = {
  improving: "Improving",
  stable: "Stable",
  "needs-attention": "Needs attention",
  changed: "Significant change",
};

function JourneyPage() {
  const { state } = useWellness();
  const hasHistory = state.checkIns.length >= 2;
  const trends = SAMPLE;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Where you were, where you are"
        icon={LineChart}
        title="Journey"
        subtitle="No scores. Just direction and honest language."
      />

      {!hasHistory && (
        <div className="mb-5 rounded-2xl border-2 border-border bg-card p-4 text-xs leading-5 text-muted-foreground">
          You have {state.checkIns.length} check-in
          {state.checkIns.length === 1 ? "" : "s"} so far. The view below shows how your journey
          will be presented — it becomes your own data once you have a couple of weeks of
          check-ins.
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {trends.map((t) => (
          <div key={t.label} className="rounded-3xl border-2 border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-foreground">{t.label}</p>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[t.status]}`}
              >
                {STATUS_LABEL[t.status]}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  2 weeks ago
                </p>
                <p className="mt-1 text-sm font-semibold">{t.then}</p>
              </div>
              <div className="rounded-2xl brand-gradient-soft p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Today
                </p>
                <p className="mt-1 text-sm font-semibold">{t.now}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pb-2">
        <SmartyCard eyebrow="Smarty says" title="Keep going rather than adding more">
          <p className="text-sm leading-6 text-muted-foreground">
            You have become more consistent with movement and training, and your stress is
            improving. Let's continue rather than adding another major goal.
          </p>
        </SmartyCard>
      </div>
    </PageShell>
  );
}
