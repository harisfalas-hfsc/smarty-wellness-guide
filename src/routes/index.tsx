import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SmartyCard, SmartyRow } from "@/components/SmartyCard";
import { SmartyEcosystem } from "@/components/SmartyEcosystem";
import { Button } from "@/components/ui/button";
import { useWellness } from "@/lib/wellness-store";
import { buildRecommendations } from "@/lib/recommendation";
import { MOODS, NEEDS } from "@/lib/checkin-options";
import { useAuth } from "@/lib/auth";
import { Landing } from "@/components/Landing";

/** One wellness color per quick mood button. */
const MOOD_TONES = [
  "border-bloom/50 hover:border-bloom",
  "border-calm/60 hover:border-calm",
  "border-sun/70 hover:border-sun",
  "border-primary/50 hover:border-primary",
  "border-mind/50 hover:border-mind",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smarty Wellness — Your Personal Wellness Guidance System" },
      {
        name: "description",
        content:
          "Your personal guide to a healthier, more balanced, and more fulfilling life. One honest check-in. One clear action. Every day.",
      },
      { property: "og:title", content: "Smarty Wellness" },
      {
        property: "og:description",
        content:
          "Your personal guide to a healthier, more balanced, and more fulfilling life. One honest check-in. One clear action. Every day.",
      },
      { property: "og:url", content: "https://smartywellness.com/" },
      { property: "og:image", content: "https://smartywellness.com/smarty-wellness-icon.png" },
      { name: "twitter:image", content: "https://smartywellness.com/smarty-wellness-icon.png" },
    ],
    links: [{ rel: "canonical", href: "https://smartywellness.com/" }],
  }),

  component: HomePage,
});

function HomePage() {
  const { session, loading } = useAuth();
  if (loading) {
    return <div className="mx-auto mt-16 h-40 w-full max-w-3xl animate-pulse rounded-3xl bg-muted" />;
  }
  if (!session) return <Landing />;
  return <WellnessHome />;
}

function WellnessHome() {
  const { state, todayCheckIn, saveCheckIn, hydrated } = useWellness();
  const recs = buildRecommendations(state, todayCheckIn);
  const primary = recs.find((r) => r.level === "primary")!;
  const secondary = recs.filter((r) => r.level !== "primary");

  return (
    <PageShell>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Personal Wellness Guidance System
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
          <span className="text-primary">Smarty</span>
          <span className="text-emerald-500"> Wellness</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Train Better. Fuel Better. Move Better. Think Better. Live Better.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* ---- Quick check-in ---- */}
        <SmartyCard eyebrow="Daily check-in" eyebrowIcon={Heart} title="How are you today?">
          {!hydrated ? (
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          ) : todayCheckIn ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Checked in today —{" "}
                <span className="font-semibold text-foreground">
                  {MOODS.find((m) => m.key === todayCheckIn.mood)?.label}
                </span>
                {todayCheckIn.need && (
                  <>
                    , you asked Smarty to{" "}
                    <span className="font-semibold text-foreground">
                      {NEEDS.find((n) => n.key === todayCheckIn.need)?.label.toLowerCase()}
                    </span>
                    .
                  </>
                )}
              </p>
              <Link to="/check-in" style={{ textDecoration: "none" }}>
                <Button variant="outline" size="lg">
                  Update check-in
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((m, i) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() =>
                      saveCheckIn({
                        mood: m.key,
                        energy: 3,
                        stress: 3,
                        motivation: 3,
                        sleep: 3,
                        need: null,
                      })
                    }
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 bg-card py-3 transition hover:-translate-y-0.5 hover:shadow-soft ${MOOD_TONES[i % MOOD_TONES.length]}`}
                  >
                    <span className="text-2xl leading-none">{m.emoji}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                One tap starts it. The full check-in takes about a minute.
              </p>
              <Link to="/check-in" style={{ textDecoration: "none" }}>
                <Button size="lg" className="w-full sm:w-auto">
                  Full check-in
                </Button>
              </Link>
            </div>
          )}
        </SmartyCard>

        {/* ---- Primary recommendation ---- */}
        <SmartyCard eyebrow="Smarty says" eyebrowIcon={Sparkles} title={primary.headline}>
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Your action
              </p>
              <p className="mt-1 text-lg font-bold text-foreground sm:text-xl">{primary.action}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{primary.reason}</p>
            </div>
            {primary.externalUrl ? (
              <a href={primary.externalUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <Button size="lg" className="w-full sm:w-auto">
                  {primary.ctaLabel}
                </Button>
              </a>
            ) : (
              <Link to={todayCheckIn ? "/today" : "/check-in"} style={{ textDecoration: "none" }}>
                <Button size="lg" className="w-full sm:w-auto">
                  {primary.ctaLabel}
                </Button>
              </Link>
            )}
          </div>
        </SmartyCard>

        {secondary.length > 0 && (
          <div className="rounded-3xl border-2 border-calm/60 bg-card p-6 shadow-soft sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              If you have more in you
            </p>
            <div className="mt-4 space-y-4">
              {secondary.map((r) => (
                <SmartyRow key={r.id} icon={Sparkles} title={r.headline} subtitle={r.action} />
              ))}
            </div>
            <Link
              to="/today"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              style={{ textDecoration: "none" }}
            >
              See today <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Smarty ecosystem
          </p>
          <SmartyEcosystem />
        </div>

        {!state.onboarded && (
          <div className="rounded-3xl border-2 border-primary bg-card p-6 text-center shadow-soft sm:p-7">
            <h2 className="text-xl font-extrabold tracking-tight">Set up Smarty Wellness</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              A few short steps so Smarty understands your life, your time and what you want to
              improve.
            </p>
            <Link to="/onboarding" style={{ textDecoration: "none" }}>
              <Button size="lg" className="mt-5">
                Get started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}
