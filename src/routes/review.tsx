import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useWellness } from "@/lib/wellness-store";
import { useDaily } from "@/lib/daily";
import { weeklyReview } from "@/lib/intelligence/engine";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Weekly Wellness Review — Smarty Wellness" },
      { name: "description", content: "Your week from your own records: consistency, mood, energy, stress, sleep, rituals, habits, missions and challenges." },
      { property: "og:title", content: "Weekly Wellness Review — Smarty Wellness" },
      { property: "og:description", content: "What went well, what could improve, and one priority for next week." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const val = (n: number | null) => (n === null ? "—" : `${n} / 5`);

function ReviewPage() {
  const { state } = useWellness();
  const { data, today, userId, loading } = useDaily();
  const [offset, setOffset] = useState(0);
  const r = useMemo(() => weeklyReview(state, data ?? null, today, offset), [state, data, today, offset]);

  // Preserve each reviewed week (latest calculation wins).
  useEffect(() => {
    if (!userId || !data || !r.enoughData) return;
    void supabase.from("wellness_reviews").upsert({
      user_id: userId, period_type: "weekly", period_start: r.start, period_end: r.end,
      summary: r.nextPriority, trends: r as unknown as Json,
    }, { onConflict: "user_id,period_type,period_start" });
  }, [userId, data, r]);

  const rows: [string, string, (string | undefined)?][] = [
    ["Days with any record", `${r.activeDays} of 7`],
    ["Check-ins", `${r.checkInDays} of 7`],
    ["Mood", val(r.averages.mood), r.previousAverages.mood !== null ? `previous week ${val(r.previousAverages.mood)}` : undefined],
    ["Energy", val(r.averages.energy), r.previousAverages.energy !== null ? `previous week ${val(r.previousAverages.energy)}` : undefined],
    ["Stress (5 = very stressed)", val(r.averages.stress), r.previousAverages.stress !== null ? `previous week ${val(r.previousAverages.stress)}` : undefined],
    ["Sleep quality", val(r.averages.sleep), r.previousAverages.sleep !== null ? `previous week ${val(r.previousAverages.sleep)}` : undefined],
    ["Morning / Midday / Evening", `${r.rituals.morning} / ${r.rituals.midday} / ${r.rituals.evening} days`],
    ["Water logged", `${r.hydrationDays} days${r.waterTargetDays !== null ? ` · target reached ${r.waterTargetDays}` : ""}`],
    ["Protein logged", `${r.proteinDays} days`],
    ["Breathing", `${r.breathingSessions} sessions · ${r.breathingMinutes} min`],
    ["Personal time", `${r.personalMinutes} min`],
    ["Mission completions", `${r.missionCompletions}`],
    ["Challenges", `${r.challengesActive} active · ${r.challengesCompleted} completed`],
  ];

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Weekly review" icon={ClipboardList} title="Your week"
        subtitle="Built only from what you recorded. No made-up scores, no judgement." />
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => setOffset((o) => Math.min(3, o + 1))} disabled={offset >= 3} aria-label="Previous week"><ChevronLeft /></Button>
        <p className="text-sm font-semibold">{fmt(r.start)} – {fmt(r.end)}{offset === 0 ? " (last 7 days)" : ""}</p>
        <Button size="sm" variant="outline" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Next week"><ChevronRight /></Button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-4">
          <section className="rounded-3xl border-2 border-primary bg-card p-5 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Priority for next week</p>
            <p className="mt-1 text-lg font-bold">{r.nextPriority}</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-3xl border-2 border-calm/60 bg-card p-5 shadow-soft">
              <h2 className="font-bold">What went well</h2>
              {r.wentWell.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{r.wentWell.map((x) => <li key={x}>{x}</li>)}</ul>
                : <p className="mt-2 text-sm text-muted-foreground">Nothing stood out from the records this week.</p>}
            </section>
            <section className="rounded-3xl border-2 border-sun/70 bg-card p-5 shadow-soft">
              <h2 className="font-bold">What could improve</h2>
              {r.toImprove.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{r.toImprove.map((x) => <li key={x}>{x}</li>)}</ul>
                : <p className="mt-2 text-sm text-muted-foreground">No clear areas of concern in your records.</p>}
            </section>
          </div>
          <section className="rounded-3xl border-2 border-mind/50 bg-card p-5 shadow-soft">
            <h2 className="font-bold">The evidence</h2>
            <dl className="mt-3 divide-y divide-border/60 text-sm">
              {rows.map(([k, v, sub]) => (
                <div key={k} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold">{v}{sub && <span className="block text-[11px] font-normal text-muted-foreground">{sub}</span>}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="text-xs text-muted-foreground">Want to talk it through? <Link to="/coach">Ask Smarty Coach</Link>.</p>
        </div>
      )}
    </PageShell>
  );
}
