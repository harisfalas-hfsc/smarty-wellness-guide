import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { SelectionCard, ScaleControl, type ScaleTone } from "@/components/SelectionCard";
import { Button } from "@/components/ui/button";
import { MOODS, NEEDS } from "@/lib/checkin-options";
import { useWellness } from "@/lib/wellness-store";
import { cn } from "@/lib/utils";
import type { MoodKey, NeedKey, Scale5 } from "@/lib/wellness-types";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [
      { title: "Daily Check-in — Smarty Wellness" },
      {
        name: "description",
        content:
          "A one-minute daily check-in: mood, energy, stress, motivation, sleep and what you need today.",
      },
      { property: "og:title", content: "Daily Check-in — Smarty Wellness" },
      {
        property: "og:description",
        content: "One minute. Five answers. Smarty does the rest.",
      },
    ],
  }),
  component: CheckInPage,
});

const BLOCK_TONE: Record<ScaleTone, { border: string; title: string }> = {
  primary: { border: "border-primary/50", title: "text-primary" },
  calm: { border: "border-calm/60", title: "text-calm-deep" },
  mind: { border: "border-mind/50", title: "text-mind-deep" },
  sun: { border: "border-sun/70", title: "text-sun-deep" },
  energy: { border: "border-energy/50", title: "text-energy-deep" },
  bloom: { border: "border-bloom/50", title: "text-bloom-deep" },
};

function Block({
  title,
  tone = "primary",
  children,
}: {
  title: string;
  tone?: ScaleTone;
  children: React.ReactNode;
}) {
  const t = BLOCK_TONE[tone];
  return (
    <section className={cn("rounded-3xl border-2 bg-card p-5 shadow-soft sm:p-6", t.border)}>
      <h2 className={cn("text-[10px] font-bold uppercase tracking-widest", t.title)}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CheckInPage() {
  const { todayCheckIn, saveCheckIn } = useWellness();
  const navigate = useNavigate();

  const [mood, setMood] = useState<MoodKey | null>(todayCheckIn?.mood ?? null);
  const [energy, setEnergy] = useState<Scale5 | null>(todayCheckIn?.energy ?? null);
  const [stress, setStress] = useState<Scale5 | null>(todayCheckIn?.stress ?? null);
  const [motivation, setMotivation] = useState<Scale5 | null>(todayCheckIn?.motivation ?? null);
  const [sleep, setSleep] = useState<Scale5 | null>(todayCheckIn?.sleep ?? null);
  const [need, setNeed] = useState<NeedKey | null>(todayCheckIn?.need ?? null);

  function submit() {
    if (!mood) {
      toast.error("Start with how you are today.");
      return;
    }
    saveCheckIn({
      mood,
      energy: energy ?? 3,
      stress: stress ?? 3,
      motivation: motivation ?? 3,
      sleep: sleep ?? 3,
      need,
    });
    toast.success("Check-in saved. Smarty has updated your day.");
    void navigate({ to: "/today" });
  }

  return (
    <PageShell width="3xl">
      <PageHeader
        eyebrow="About one minute"
        icon={Heart}
        title="Check-in"
        subtitle="Answer what you can. Skipping a question is fine — Smarty uses what it has."
      />

      <div className="space-y-4">
        <Block title="How are you today?" tone="bloom">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {MOODS.map((m) => (
              <SelectionCard
                key={m.key}
                selected={mood === m.key}
                onSelect={() => setMood(m.key)}
                label={m.label}
                icon={m.emoji}
              />
            ))}
          </div>
        </Block>

        <div className="grid gap-4 sm:grid-cols-2">
          <Block title="Energy" tone="sun">
            <ScaleControl value={energy} onChange={setEnergy} lowLabel="Low" highLabel="High" tone="sun" />
          </Block>
          <Block title="Stress" tone="mind">
            <ScaleControl value={stress} onChange={setStress} lowLabel="Low" highLabel="High" tone="mind" />
          </Block>
          <Block title="Motivation" tone="energy">
            <ScaleControl
              value={motivation}
              onChange={setMotivation}
              lowLabel="Low"
              highLabel="High"
              tone="energy"
            />
          </Block>
          <Block title="Sleep" tone="primary">
            <ScaleControl value={sleep} onChange={setSleep} lowLabel="Poor" highLabel="Excellent" tone="primary" />
          </Block>
        </div>

        <Block title="What do you need today?" tone="calm">
          <div className="grid gap-2 sm:grid-cols-2">
            {NEEDS.map((n) => (
              <SelectionCard
                key={n.key}
                selected={need === n.key}
                onSelect={() => setNeed(need === n.key ? null : n.key)}
                label={n.label}
                icon={n.emoji}
              />
            ))}
          </div>
        </Block>

        <Button size="lg" className="w-full" onClick={submit}>
          Save check-in
        </Button>
        <p className="pb-2 text-center text-xs leading-5 text-muted-foreground">
          Your answers are stored so Smarty can compare them with your own baseline over time.
          Smarty Wellness gives lifestyle guidance and does not diagnose any medical or
          psychological condition.
        </p>
      </div>
    </PageShell>
  );
}
