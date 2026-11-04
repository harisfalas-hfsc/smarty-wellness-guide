import { createFileRoute } from "@tanstack/react-router";
import { Wind } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { BreathingGuide } from "@/components/BreathingGuide";
import { useDaily } from "@/lib/daily";
import { BREATHING_PATTERNS, RITUAL_META } from "@/lib/ritual-content";

export const Route = createFileRoute("/breathing")({
  head: () => ({
    meta: [
      { title: "Breathing — Smarty Wellness" },
      { name: "description", content: "Simple guided breathing sessions for relaxation, focus and balance, with your session history." },
      { property: "og:title", content: "Breathing — Smarty Wellness" },
      { property: "og:description", content: "A few calm minutes, guided step by step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BreathingPage,
});

function BreathingPage() {
  const { data, summary, today, run, api, loading } = useDaily();
  const label = (k: string) => BREATHING_PATTERNS.find((p) => p.key === k)?.label ?? k;

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Calm in a few minutes" icon={Wind} title="Breathing" subtitle="Pick an exercise and a duration, then follow the circle." />
      <section className="rounded-3xl border-2 border-primary bg-card p-6 shadow-soft">
        <BreathingGuide
          onComplete={(pattern, secs) =>
            void run((uid) => api.logBreathing(uid, today, pattern, secs), `Breathing session saved (${Math.round(secs / 60) || 1} min).`)
          }
        />
      </section>

      <section className="mt-5 rounded-3xl border-2 border-mind/50 bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mind-deep">Your breathing history</p>
          {summary && <p className="text-xs font-semibold text-muted-foreground">Today: {summary.breathingMin} min · {summary.breathingCount} sessions</p>}
        </div>
        {loading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
        {data && data.breathing.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No sessions yet. Your first one takes a minute.</p>}
        <ul className="mt-3 divide-y divide-mind/20">
          {data?.breathing.slice(0, 20).map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
              <span>
                <span className="font-semibold">{label(b.pattern)}</span>
                <span className="text-muted-foreground"> · {Math.max(1, Math.round(b.duration_seconds / 60))} min{b.ritual_slot ? ` · ${RITUAL_META[b.ritual_slot as keyof typeof RITUAL_META].title}` : ""}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {b.local_date === today ? "Today" : b.local_date} {new Date(b.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
