import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { SelectionCard } from "@/components/SelectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Get Started — Smarty Wellness" },
      {
        name: "description",
        content:
          "A short set-up in five steps so Smarty understands your life, your time and what you want to improve.",
      },
      { property: "og:title", content: "Get Started — Smarty Wellness" },
      { property: "og:description", content: "Five short steps. No paperwork." },
    ],
  }),
  component: OnboardingPage,
});

const IMPROVE = [
  { v: "energy", label: "My energy", emoji: "⚡" },
  { v: "stress", label: "My stress", emoji: "🌊" },
  { v: "fitness", label: "My fitness", emoji: "💪" },
  { v: "nutrition", label: "My nutrition", emoji: "🥗" },
  { v: "sleep", label: "My sleep", emoji: "🌙" },
  { v: "personal-time", label: "Time for myself", emoji: "🧭" },
];

const CHALLENGES = [
  { v: "time", label: "I have no time", emoji: "⏳" },
  { v: "motivation", label: "I lose motivation", emoji: "🔥" },
  { v: "consistency", label: "I start and stop", emoji: "🔁" },
  { v: "stress", label: "I'm under pressure", emoji: "😮‍💨" },
  { v: "knowledge", label: "I don't know where to start", emoji: "❓" },
];

const TIME = [
  { v: "15", label: "About 15 minutes a day", emoji: "🕒" },
  { v: "30", label: "About 30 minutes a day", emoji: "🕓" },
  { v: "60", label: "About an hour a day", emoji: "🕔" },
  { v: "varies", label: "It changes every day", emoji: "🎲" },
];

function OnboardingPage() {
  const { state, updateProfile, completeOnboarding } = useWellness();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [improve, setImprove] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const steps = [
    {
      title: "Who is this person?",
      blurb: "Just the basics — Smarty uses your name and age to keep advice realistic.",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ob-name">Your name</Label>
            <Input
              id="ob-name"
              className="mt-1.5"
              value={state.profile.personal.name}
              onChange={(e) => updateProfile("personal", { name: e.target.value })}
              placeholder="Alex"
            />
          </div>
          <div>
            <Label htmlFor="ob-age">Age</Label>
            <Input
              id="ob-age"
              className="mt-1.5"
              value={state.profile.personal.age}
              onChange={(e) => updateProfile("personal", { age: e.target.value })}
              placeholder="38"
            />
          </div>
        </div>
      ),
    },
    {
      title: "What does your life look like?",
      blurb: "Smarty places actions in the time you actually have.",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ob-occ">Occupation</Label>
            <Input
              id="ob-occ"
              className="mt-1.5"
              value={state.profile.dailyLife.occupation}
              onChange={(e) => updateProfile("dailyLife", { occupation: e.target.value })}
              placeholder="Teacher"
            />
          </div>
          <div>
            <Label htmlFor="ob-hours">Working hours</Label>
            <Input
              id="ob-hours"
              className="mt-1.5"
              value={state.profile.dailyLife.workingHours}
              onChange={(e) => updateProfile("dailyLife", { workingHours: e.target.value })}
              placeholder="08:00 – 17:00"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ob-resp">Main responsibilities</Label>
            <Input
              id="ob-resp"
              className="mt-1.5"
              value={state.profile.dailyLife.responsibilities}
              onChange={(e) => updateProfile("dailyLife", { responsibilities: e.target.value })}
              placeholder="Kids, commute, household"
            />
          </div>
        </div>
      ),
    },
    {
      title: "What do you want to improve?",
      blurb: "Pick as many as you like.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {IMPROVE.map((o) => (
            <SelectionCard
              key={o.v}
              icon={o.emoji}
              label={o.label}
              selected={improve.includes(o.v)}
              onSelect={() =>
                setImprove((prev) =>
                  prev.includes(o.v) ? prev.filter((p) => p !== o.v) : [...prev, o.v],
                )
              }
            />
          ))}
        </div>
      ),
    },
    {
      title: "What gets in the way?",
      blurb: "Honesty here makes the recommendations realistic.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {CHALLENGES.map((o) => (
            <SelectionCard
              key={o.v}
              icon={o.emoji}
              label={o.label}
              selected={challenge === o.v}
              onSelect={() => setChallenge(o.v)}
            />
          ))}
        </div>
      ),
    },
    {
      title: "How much time do you have?",
      blurb: "Smarty will never recommend more than this.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {TIME.map((o) => (
            <SelectionCard
              key={o.v}
              icon={o.emoji}
              label={o.label}
              selected={time === o.v}
              onSelect={() => setTime(o.v)}
            />
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step] ?? steps[0]!;
  const last = step === steps.length - 1;

  function next() {
    if (!last) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    updateProfile("personal", { goals: improve.join(", ") });
    updateProfile("mental", { motivation: challenge ?? "" });
    updateProfile("dailyLife", { freeTime: time ?? "" });
    completeOnboarding();
    toast.success("Set up. Let's start with today's check-in.");
    void navigate({ to: "/check-in" });
  }

  return (
    <PageShell width="3xl">
      <PageHeader
        eyebrow={`Step ${step + 1} of ${steps.length}`}
        icon={Sparkles}
        title="Let's set you up"
        subtitle="Short sections, no paperwork. You can change everything later."
      />

      <Progress value={((step + 1) / steps.length) * 100} className="mb-6" />

      <section className="rounded-3xl border-2 border-primary bg-card p-6 shadow-soft sm:p-7">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{current.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{current.blurb}</p>
        <div className="mt-6">{current.body}</div>
      </section>

      <div className="mt-5 flex gap-3 pb-2">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        <Button size="lg" className="flex-1" onClick={next}>
          {last ? "Finish set-up" : "Continue"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </PageShell>
  );
}
