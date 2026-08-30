import { Link } from "@tanstack/react-router";
import { Brain, Compass, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartyEcosystem } from "@/components/SmartyEcosystem";
import heroImage from "@/assets/hero-wellness.jpg";

const PILLARS = [
  {
    Icon: Heart,
    title: "One daily check-in",
    body: "A minute a day on mood, energy, stress, sleep and motivation. That's the whole input.",
    border: "border-bloom",
    text: "text-bloom-deep",
  },
  {
    Icon: Sparkles,
    title: "One clear action",
    body: "Smarty picks your biggest opportunity today and gives you one realistic thing to do.",
    border: "border-sun",
    text: "text-sun-deep",
  },
  {
    Icon: Brain,
    title: "Missions and challenges",
    body: "Small repeatable wins for body and mind, built around the life you actually live.",
    border: "border-mind",
    text: "text-mind-deep",
  },
  {
    Icon: Compass,
    title: "Your journey and bucket list",
    body: "Track how you're trending, review your month, and chase what you really want.",
    border: "border-calm",
    text: "text-calm-deep",
  },
];

/** Public marketing page shown to visitors who are not signed in. */
export function Landing() {
  return (
    <main className="pb-16">
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden">
        <div className="relative h-[420px] w-full sm:h-[520px] lg:h-[600px]">
          <img
            src={heroImage}
            alt="A happy couple walking together along the beach at sunrise"
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

          <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center px-5 sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Personal Wellness Guidance System
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              <span className="text-primary">Smarty</span>{" "}
              <span className="text-emerald-500">Wellness</span>
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-foreground/80 sm:text-lg">
              Train Better. Fuel Better. Move Better. Think Better. Live Better.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tell Smarty how you feel today. Get one clear, realistic action — and a calm, steady
              path towards the life you want.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <Button size="lg" className="w-full sm:w-auto">
                  Create free account
                </Button>
              </Link>
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Pillars ---- */}
      <section className="mx-auto mt-12 w-full max-w-5xl px-5 sm:px-8">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Wellness that fits a real week
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted-foreground sm:text-base">
          No overwhelm, no diagnosis, no pressure. Just one honest check-in and the next right step.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PILLARS.map(({ Icon, title, body, border, text }) => (
            <div
              key={title}
              className={`rounded-3xl border-2 ${border} bg-card p-6 shadow-soft transition hover:-translate-y-0.5`}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 ${border} ${text}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Ecosystem ---- */}
      <section className="mx-auto mt-12 w-full max-w-5xl px-5 sm:px-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Part of the Smarty ecosystem
        </p>
        <SmartyEcosystem />
      </section>

      {/* ---- Closing CTA ---- */}
      <section className="mx-auto mt-12 w-full max-w-5xl px-5 sm:px-8">
        <div className="rounded-3xl border-2 border-primary bg-card p-8 text-center shadow-soft">
          <h2 className="text-2xl font-extrabold tracking-tight">Start with today</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Create your free account and take your first one-minute check-in.
          </p>
          <Link to="/auth" style={{ textDecoration: "none" }}>
            <Button size="lg" className="mt-6">
              Get started
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
