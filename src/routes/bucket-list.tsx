import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Compass, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/bucket-list")({
  head: () => ({
    meta: [
      { title: "Bucket List — Smarty Wellness" },
      {
        name: "description",
        content:
          "Real personal projects: run a 10K, learn a language, travel, read 20 books, spend more time with the people who matter.",
      },
      { property: "og:title", content: "Bucket List — Smarty Wellness" },
      { property: "og:description", content: "Long-term goals treated as real projects." },
    ],
  }),
  component: BucketListPage,
});

const IDEAS = [
  "Run a 10K",
  "Read 20 books",
  "Learn a language",
  "Learn to cook",
  "Go camping with the family",
  "Learn to swim",
  "Spend more time with my parents",
  "Become stronger",
  "Start a hobby",
  "Travel somewhere new",
];

function BucketListPage() {
  const { state, addBucketGoal, removeBucketGoal } = useWellness();
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function add(t: string) {
    if (!t.trim()) {
      toast.error("Give your goal a name.");
      return;
    }
    addBucketGoal({ title: t.trim(), why: why.trim(), category: "Personal", targetDate, progress: 0 });
    setTitle("");
    setWhy("");
    setTargetDate("");
    toast.success("Added to your bucket list.");
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Long-term challenges"
        icon={Compass}
        title="Bucket list"
        subtitle="The things you actually want from your life — Smarty works backwards from them."
      />

      <section className="rounded-3xl border-2 border-primary bg-card p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="bg-title">Goal</Label>
            <Input
              id="bg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Run a 10K"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="bg-why">Why it matters</Label>
            <Input
              id="bg-why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="I want to feel capable again"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="bg-date">Target date</Label>
            <Input
              id="bg-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => add(title)}>
          <Plus className="h-4 w-4" /> Add goal
        </Button>
      </section>

      {state.bucketList.length > 0 && (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {state.bucketList.map((g) => (
            <div key={g.id} className="rounded-3xl border-2 border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{g.title}</p>
                  {g.why && <p className="mt-1 text-xs text-muted-foreground">{g.why}</p>}
                  {g.targetDate && (
                    <p className="mt-1 text-[11px] font-semibold text-primary">By {g.targetDate}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeBucketGoal(g.id)}
                  aria-label={`Remove ${g.title}`}
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Progress value={g.progress} className="mt-4" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Need a starting point
        </p>
        <div className="mt-3 flex flex-wrap gap-2 pb-2">
          {IDEAS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => add(i)}
              className="cursor-pointer rounded-full border-2 border-border bg-card px-4 py-2 text-xs font-semibold transition hover:border-primary"
            >
              {i}
            </button>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
