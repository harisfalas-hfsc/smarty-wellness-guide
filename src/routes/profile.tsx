import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useWellness } from "@/lib/wellness-store";
import type { WellnessProfile } from "@/lib/wellness-types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Wellness Profile — Smarty Wellness" },
      {
        name: "description",
        content:
          "A profile about the person, not just the body: your life, schedule, training, nutrition, mind and lifestyle.",
      },
      { property: "og:title", content: "Wellness Profile — Smarty Wellness" },
      { property: "og:description", content: "Smarty works from who you are, not an average user." },
    ],
  }),
  component: ProfilePage,
});

type Field = { key: string; label: string; placeholder: string };

export const PROFILE_SECTIONS: {
  key: keyof WellnessProfile;
  title: string;
  blurb: string;
  fields: Field[];
}[] = [
  {
    key: "personal",
    title: "Personal",
    blurb: "Who you are.",
    fields: [
      { key: "name", label: "Name", placeholder: "How should Smarty address you?" },
      { key: "age", label: "Age", placeholder: "38" },
      { key: "gender", label: "Gender", placeholder: "Optional" },
      { key: "relationship", label: "Relationship", placeholder: "Married, single…" },
      { key: "children", label: "Children", placeholder: "Two, aged 4 and 7" },
      { key: "interests", label: "Interests", placeholder: "Football, reading, hiking" },
      { key: "goals", label: "Goals", placeholder: "Feel less tired, be more present" },
    ],
  },
  {
    key: "dailyLife",
    title: "Daily life",
    blurb: "What your week actually looks like.",
    fields: [
      { key: "occupation", label: "Occupation", placeholder: "Teacher" },
      { key: "workingHours", label: "Working hours", placeholder: "08:00 – 17:00" },
      { key: "commute", label: "Commute", placeholder: "30 min each way" },
      { key: "responsibilities", label: "Responsibilities", placeholder: "School runs, shopping" },
      { key: "typicalSchedule", label: "Typical schedule", placeholder: "Describe an average day" },
      { key: "freeTime", label: "Available free time", placeholder: "1 hour in the evening" },
      { key: "familyResponsibilities", label: "Family responsibilities", placeholder: "Evenings with kids" },
    ],
  },
  {
    key: "physical",
    title: "Physical",
    blurb: "Where your body is right now.",
    fields: [
      { key: "activityLevel", label: "Activity level", placeholder: "Mostly seated" },
      { key: "trainingExperience", label: "Training experience", placeholder: "2 years on and off" },
      { key: "fitnessLevel", label: "Fitness level", placeholder: "Beginner / intermediate" },
      { key: "limitations", label: "Movement limitations", placeholder: "Stiff hips" },
      { key: "pain", label: "Pain", placeholder: "Lower back after sitting" },
      { key: "energy", label: "Energy", placeholder: "Drops after lunch" },
    ],
  },
  {
    key: "nutrition",
    title: "Nutrition",
    blurb: "How you eat in real life.",
    fields: [
      { key: "habits", label: "Eating habits", placeholder: "Skip breakfast, late dinner" },
      { key: "preferences", label: "Preferences", placeholder: "Mediterranean" },
      { key: "goals", label: "Goals", placeholder: "Eat more protein" },
      { key: "restrictions", label: "Food restrictions", placeholder: "Lactose intolerant" },
      { key: "consistency", label: "Consistency", placeholder: "Good weekdays, poor weekends" },
    ],
  },
  {
    key: "mental",
    title: "Mental & lifestyle",
    blurb: "The part most apps ignore.",
    fields: [
      { key: "stress", label: "Stress", placeholder: "High during work weeks" },
      { key: "mood", label: "Mood", placeholder: "Generally steady" },
      { key: "motivation", label: "Motivation", placeholder: "Comes and goes" },
      { key: "socialConnection", label: "Social connection", placeholder: "See friends monthly" },
      { key: "outdoor", label: "Outdoor activity", placeholder: "Weekends only" },
      { key: "hobbies", label: "Hobbies", placeholder: "Guitar" },
      { key: "reading", label: "Reading", placeholder: "Rarely" },
      { key: "entertainment", label: "Entertainment", placeholder: "TV in the evening" },
      { key: "personalTime", label: "Personal time", placeholder: "Almost none" },
      { key: "sleepRoutine", label: "Sleep routine", placeholder: "Bed at midnight, up at 06:30" },
    ],
  },
];

/** One wellness color per profile section. */
const SECTION_TONES = [
  "border-primary/50",
  "border-sun/70",
  "border-energy/50",
  "border-calm/60",
  "border-mind/50",
];

function ProfilePage() {
  const { state, updateProfile } = useWellness();

  return (
    <PageShell width="3xl">
      <PageHeader
        eyebrow="About the person"
        icon={UserCircle}
        title="Wellness profile"
        subtitle="Fill in what you want, when you want. Your profile is meant to evolve."
      />

      <Accordion type="multiple" defaultValue={["personal"]} className="space-y-3">
        {PROFILE_SECTIONS.map((section, i) => (
          <AccordionItem
            key={section.key}
            value={section.key}
            className={`rounded-3xl border-2 bg-card px-5 shadow-soft ${SECTION_TONES[i % SECTION_TONES.length]}`}
          >
            <AccordionTrigger className="py-5 hover:no-underline">
              <span className="text-left">
                <span className="block text-sm font-bold text-foreground">{section.title}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {section.blurb}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <div key={f.key}>
                    <Label htmlFor={`${section.key}-${f.key}`}>{f.label}</Label>
                    <Input
                      id={`${section.key}-${f.key}`}
                      className="mt-1.5"
                      placeholder={f.placeholder}
                      value={
                        (state.profile[section.key] as Record<string, string>)[f.key] ?? ""
                      }
                      onChange={(e) =>
                        updateProfile(section.key, { [f.key]: e.target.value } as never)
                      }
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        size="lg"
        className="mt-5 w-full"
        onClick={() => toast.success("Profile saved.")}
      >
        Save profile
      </Button>
      <p className="mt-4 pb-2 text-xs leading-5 text-muted-foreground">
        Your profile is stored on this device. Changes save as you type.
      </p>
    </PageShell>
  );
}
