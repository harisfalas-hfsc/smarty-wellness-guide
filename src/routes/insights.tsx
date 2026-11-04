import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import { AREA_LABEL, type LifeGap } from "@/lib/intelligence/engine";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Your Insights — Smarty Wellness" },
      { name: "description", content: "The gap between how you want to live and how you actually live, plus patterns from your own records." },
      { property: "og:title", content: "Your Insights — Smarty Wellness" },
      { property: "og:description", content: "Life gaps and personal patterns, explained in plain words." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InsightsPage,
});

const STATUS: Record<LifeGap["status"], { label: string; cls: string }> = {
  gap: { label: "Needs attention", cls: "border-energy text-energy" },
  "on-track": { label: "On track", cls: "border-calm text-calm-deep" },
  "not-enough-data": { label: "Not enough information yet", cls: "border-sun text-sun-deep" },
};
const LEVEL_TEXT = ["Aligned", "Small gap", "Clear gap", "Large gap"];

function InsightsPage() {
  const { intel, loading } = useIntelligence();
  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Life Gap Engine" icon={Compass} title="Your insights"
        subtitle="How you want to live, compared with what your records show — and one realistic step for each." />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-bold">Life gaps</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Gap levels: Aligned · Small gap · Clear gap · Large gap — based on how often your records match the goal you set. Days without records are never counted against you.
            </p>
            {intel.gaps.length === 0 ? (
              <div className="mt-3 rounded-3xl border-2 border-sun/70 bg-card p-5 text-sm shadow-soft">
                Tell us what you'd like to improve in your <Link to="/profile">profile goals</Link> or set habit targets on <Link to="/habits">Daily habits</Link>. Then we can compare.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {intel.gaps.map((g) => (
                  <article key={g.area} className="rounded-3xl border-2 border-primary/50 bg-card p-5 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold">{AREA_LABEL[g.area]}</h3>
                      <span className={`rounded-full border-2 px-2.5 py-0.5 text-[11px] font-semibold ${STATUS[g.status].cls}`}>
                        {STATUS[g.status].label}{g.gapLevel !== null && g.status === "gap" ? ` · ${LEVEL_TEXT[g.gapLevel]}` : ""}{g.status === "gap" ? ` · ${g.priority} priority` : ""}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[9rem_1fr]">
                      <dt className="font-semibold text-muted-foreground">You want</dt><dd>{g.objective} <span className="text-xs text-muted-foreground">(from {g.objectiveSource})</span></dd>
                      <dt className="font-semibold text-muted-foreground">Records show</dt><dd>{g.observed}</dd>
                      <dt className="font-semibold text-muted-foreground">Difference</dt><dd>{g.difference}</dd>
                      {g.evidence.length > 0 && <><dt className="font-semibold text-muted-foreground">Based on</dt><dd className="text-xs text-muted-foreground">{g.evidence.join(" · ")}</dd></>}
                      <dt className="font-semibold text-muted-foreground">Next step</dt><dd className="font-semibold">{g.nextAction}</dd>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold">Patterns in your records</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">These are associations, not proof that one thing causes another.</p>
            {intel.patterns.length === 0 ? (
              <div className="mt-3 rounded-3xl border-2 border-sun/70 bg-card p-5 text-sm shadow-soft">
                Not enough information yet. Patterns appear after about a week or two of check-ins.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {intel.patterns.map((p) => (
                  <article key={p.id} className="rounded-3xl border-2 border-mind/50 bg-card p-5 shadow-soft">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-mind-deep">{p.kind === "trend" ? "Trend" : "Possible pattern"} · {p.strength}</p>
                    <h3 className="mt-1 font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.detail}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Evidence: {p.evidence}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-3xl border-2 border-calm/60 bg-card p-5 shadow-soft">
              <h2 className="font-bold">What you've told us</h2>
              {intel.context.stated.length ? (
                <ul className="mt-2 space-y-1 text-sm">{intel.context.stated.map((f) => <li key={f.label}><span className="font-semibold">{f.label}:</span> {f.value}</li>)}</ul>
              ) : <p className="mt-2 text-sm text-muted-foreground">Nothing yet.</p>}
              <Link to="/profile" style={{ textDecoration: "none" }}><Button size="sm" variant="outline" className="mt-3">Edit profile</Button></Link>
            </article>
            <article className="rounded-3xl border-2 border-bloom/50 bg-card p-5 shadow-soft">
              <h2 className="font-bold">What your records show</h2>
              {intel.context.observed.length ? (
                <ul className="mt-2 space-y-1 text-sm">{intel.context.observed.map((o) => <li key={o.label}><span className="font-semibold">{o.label}:</span> {o.value} <span className="text-xs text-muted-foreground">({o.evidence})</span></li>)}</ul>
              ) : <p className="mt-2 text-sm text-muted-foreground">Not enough records yet.</p>}
            </article>
          </section>
        </div>
      )}
    </PageShell>
  );
}
