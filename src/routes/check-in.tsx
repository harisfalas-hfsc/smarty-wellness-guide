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
  const [needs, setNeeds] = useState<NeedKey[]>(todayCheckIn?.needs ?? []);

  function toggleNeed(value: NeedKey) {
    setNeeds((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function submit() {
    if (!mood || !energy || !stress || !motivation || !sleep) {
      toast.error("Please answer the five daily questions first.");
      return;
    }
    saveCheckIn({
      mood,
      energy,
      stress,
      motivation,
      sleep,
      needs,
    });
    toast.success("Your plan for today is ready.");
    void navigate({ to: "/today" });
  }

  return (
    <PageShell width="3xl">
      <PageHeader
        eyebrow="Step 1 · About one minute"
        icon={Heart}
        title="Tell us how you feel"
        subtitle="Your answers create one recommendation, one mission and one optional challenge for today."
      />

      <div className="space-y-4">
        <Block title="How are you today?" tone="bloom">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {MOODS.map((m) => (
              <SelectionCard
                key={m.key}
                selected={mood === m.key}
                onSelect={() => setMood(mood === m.key ? null : m.key)}
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

        <Block title="What support would help today? Select one or more (optional)" tone="calm">
          <div className="grid gap-2 sm:grid-cols-2">
            {NEEDS.map((n) => (
              <SelectionCard
                key={n.key}
                selected={needs.includes(n.key)}
                onSelect={() => toggleNeed(n.key)}
                label={n.label}
                icon={n.emoji}
              />
            ))}
          </div>
        </Block>

        <Button size="lg" className="w-full" onClick={submit}>
          Create my plan for today
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
