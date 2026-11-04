import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Pause, Play, RotateCcw, Target, Trophy } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { todayKey, useWellness } from "@/lib/wellness-store";
import type { Mission } from "@/lib/wellness-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Missions — Smarty Wellness" },
      {
        name: "description",
        content:
          "Progressive missions that build habits step by step — movement, sleep, hydration, breathing, nutrition, personal time and more.",
      },
      { property: "og:title", content: "Missions — Smarty Wellness" },
      { property: "og:description", content: "Small actions, repeated. That is how life changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MissionsPage,
});

const AREA_LABEL: Record<string, string> = {
  movement: "Physical activity", training: "Training", nutrition: "Nutrition", mind: "Mental wellbeing",
  social: "Social connection", personal: "Personal time", sleep: "Sleep & recovery", hydration: "Hydration", development: "Personal development",
};

/** One wellness color per mission area — consistent everywhere. */
const AREA_TONE: Record<string, { border: string; text: string }> = {
  movement: { border: "border-calm/60", text: "text-calm-deep" },
  training: { border: "border-energy/50", text: "text-energy-deep" },
  nutrition: { border: "border-sun/70", text: "text-sun-deep" },
  mind: { border: "border-mind/50", text: "text-mind-deep" },
  social: { border: "border-bloom/50", text: "text-bloom-deep" },
  personal: { border: "border-primary/50", text: "text-primary" },
  sleep: { border: "border-mind/50", text: "text-mind-deep" },
  hydration: { border: "border-primary/50", text: "text-primary" },
  development: { border: "border-calm/60", text: "text-calm-deep" },
};
const FALLBACK_TONE = AREA_TONE["personal"]!;

const TABS = [
  { key: "active", label: "Active" },
  { key: "available", label: "Available" },
  { key: "paused", label: "Paused" },
  { key: "completed", label: "Completed" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const LINK_FOR_METRIC: Record<string, { to: "/habits" | "/breathing"; label: string }> = {
  hydration_pct: { to: "/habits", label: "Log water" },
  protein_pct: { to: "/habits", label: "Log protein" },
  personal_min: { to: "/habits", label: "Log personal time" },
  reading_min: { to: "/habits", label: "Log reading" },
  outdoor_min: { to: "/habits", label: "Log time outside" },
  breathing_min: { to: "/breathing", label: "Start breathing" },
};

function MissionCard({ m }: { m: Mission }) {
  const { toggleMission, setMissionStatus } = useWellness();
  const tone = AREA_TONE[m.area] ?? FALLBACK_TONE;
  const doneToday = m.completed && m.completedDate === todayKey();
  const status = m.status ?? "available";
  const auto = m.metric && m.metric !== "manual" ? LINK_FOR_METRIC[m.metric] : undefined;
  const per = m.daysPerStep ?? 3;
  const stepPct = status === "completed" ? 100 : Math.round((((m.step - 1) * per + Math.min(m.stepDays ?? 0, per)) / (m.totalSteps * per)) * 100);

  return (
    <div className={cn("flex flex-col rounded-3xl border-2 bg-card p-5 shadow-soft", doneToday || status === "completed" ? "border-calm" : tone.border)}>
      <p className={cn("text-[10px] font-bold uppercase tracking-widest", tone.text)}>{AREA_LABEL[m.area] ?? m.area}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-bold">
        {status === "completed" && <Trophy className="h-4 w-4 text-sun-deep" />}
        {m.title}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.detail}</p>
      {m.objective && <p className="mt-2 text-xs"><span className="font-semibold">Objective:</span> {m.objective}</p>}
      {m.completionCriteria && <p className="mt-1 text-xs"><span className="font-semibold">How it counts:</span> {m.completionCriteria}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">{m.target}</span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Level {m.step} of {m.totalSteps}{status === "active" ? ` · ${Math.min(m.stepDays ?? 0, per)}/${per} days to level up` : ""}
        </span>
      </div>
      <Progress value={stepPct} className="mt-3" />
      <p className="mt-1 text-[11px] text-muted-foreground">{m.totalCompletions ?? 0} days completed in total</p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
        {status === "available" && <Button size="sm" onClick={() => setMissionStatus(m.id, "active")}><Play /> Start mission</Button>}
        {status === "active" && (
          <>
            {auto && !doneToday ? (
              <Link to={auto.to} style={{ textDecoration: "none" }}><Button size="sm">{auto.label}</Button></Link>
            ) : (
              <Button size="sm" variant={doneToday ? "outline" : "default"} onClick={() => toggleMission(m.id)}>
                {doneToday ? <RotateCcw /> : <Check />} {doneToday ? "Undo today" : "Done today"}
              </Button>
            )}
            {auto && doneToday && <span className="flex items-center gap-1 text-xs font-semibold text-calm-deep"><CheckCircle2 className="h-4 w-4" /> Counted today</span>}
            <Button size="sm" variant="outline" onClick={() => setMissionStatus(m.id, "paused")}><Pause /> Pause</Button>
          </>
        )}
        {status === "paused" && <Button size="sm" onClick={() => setMissionStatus(m.id, "active")}><Play /> Resume</Button>}
        {status === "completed" && <span className="text-xs font-semibold text-calm-deep">Mission complete — this is a habit now.</span>}
      </div>
    </div>
  );
}

function MissionsPage() {
  const { state, hydrated } = useWellness();
  const [tab, setTab] = useState<Tab>("active");
  const counts = Object.fromEntries(TABS.map((t) => [t.key, state.missions.filter((m) => (m.status ?? "available") === t.key).length])) as Record<Tab, number>;
  const list = state.missions.filter((m) => (m.status ?? "available") === tab);
  const doneToday = state.missions.filter((m) => m.status === "active" && m.completed && m.completedDate === todayKey()).length;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Small and realistic"
        icon={Target}
        title="Missions"
        subtitle="Missions level up as a habit becomes normal. Logging water, breathing or personal time counts automatically."
      />

      <section className="rounded-3xl border-2 border-primary bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Today</p>
          <p className="text-sm font-semibold text-muted-foreground">{doneToday} of {counts.active} active missions done</p>
        </div>
        <Progress value={counts.active ? (doneToday / counts.active) * 100 : 0} className="mt-3" />
      </section>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn("min-h-10 rounded-full border-2 px-4 text-sm font-semibold", tab === t.key ? "border-primary bg-primary text-primary-foreground" : "border-primary/40 bg-card")}>
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {!hydrated ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading missions…</p>
      ) : list.length === 0 ? (
        <p className="mt-5 rounded-3xl border-2 border-calm/60 bg-card p-6 text-sm text-muted-foreground">
          {tab === "active" ? "No active missions. Pick one from Available — one or two is plenty." : "Nothing here yet."}
        </p>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {list.map((m) => <MissionCard key={m.id} m={m} />)}
        </div>
      )}

      <p className="mt-6 pb-2 text-xs leading-5 text-muted-foreground">
        Missions are not a punishment system. Missing a day changes nothing except the pace.
      </p>
    </PageShell>
  );
}
