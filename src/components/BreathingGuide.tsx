import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BREATHING_PATTERNS } from "@/lib/ritual-content";
import { cn } from "@/lib/utils";

const DURATIONS = [1, 2, 3, 5, 10];

/**
 * Guided breathing with a simple expanding circle. Calls onComplete with the
 * seconds actually breathed when the timer ends or the user finishes early
 * (sessions under 10 seconds are not recorded).
 */
export function BreathingGuide({
  defaultPattern = "relax",
  defaultMinutes = 2,
  onComplete,
  compact = false,
}: {
  defaultPattern?: string;
  defaultMinutes?: number;
  onComplete: (pattern: string, seconds: number) => void;
  compact?: boolean;
}) {
  const [patternKey, setPatternKey] = useState(defaultPattern);
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const finished = useRef(false);
  const pattern = BREATHING_PATTERNS.find((p) => p.key === patternKey) ?? BREATHING_PATTERNS[0];
  const total = minutes * 60;

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const finish = (secs: number) => {
    if (finished.current) return;
    finished.current = true;
    setRunning(false);
    setStarted(false);
    setElapsed(0);
    if (secs >= 10) onComplete(pattern.key, secs);
  };

  useEffect(() => {
    if (started && elapsed >= total) finish(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, total, started]);

  const cycle = pattern.steps.reduce((a, s) => a + s.s, 0);
  let pos = elapsed % cycle;
  let step: (typeof pattern.steps)[number] = pattern.steps[0]!;
  let remaining = step.s;
  for (const s of pattern.steps) {
    if (pos < s.s) { step = s; remaining = s.s - pos; break; }
    pos -= s.s;
  }
  const inhale = step.label.startsWith("Breathe in");
  const exhale = step.label.startsWith("Breathe out");
  const left = Math.max(0, total - elapsed);

  return (
    <div className="space-y-5">
      {!started && (
        <>
          <div>
            <p className="text-sm font-semibold">Exercise</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {BREATHING_PATTERNS.map((p) => (
                <button key={p.key} type="button" aria-pressed={p.key === patternKey} onClick={() => setPatternKey(p.key)}
                  className={cn("rounded-2xl border-2 p-3 text-left transition", p.key === patternKey ? "border-primary bg-primary/5" : "border-primary/30 bg-card hover:border-primary")}>
                  <span className="block text-sm font-bold">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.purpose}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Duration</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button key={d} type="button" aria-pressed={d === minutes} onClick={() => setMinutes(d)}
                  className={cn("h-10 min-w-14 rounded-full border-2 px-3 text-sm font-semibold", d === minutes ? "border-calm bg-calm/15 text-calm-deep" : "border-calm/40 bg-card")}>
                  {d} min
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {started && (
        <div className={cn("flex flex-col items-center", compact ? "py-2" : "py-6")}>
          <div className="relative grid h-56 w-56 place-items-center">
            <div
              aria-hidden
              className="absolute rounded-full border-4 border-primary/60 bg-primary/10"
              style={{
                width: inhale || (!exhale && step === pattern.steps[1]) ? "100%" : "45%",
                height: inhale || (!exhale && step === pattern.steps[1]) ? "100%" : "45%",
                transition: `all ${step.s}s ease-in-out`,
              }}
            />
            <div className="relative text-center" aria-live="polite">
              <p className="text-lg font-extrabold">{step.label}</p>
              <p className="text-3xl font-black text-primary">{remaining}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} left
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!started ? (
          <Button onClick={() => { finished.current = false; setElapsed(0); setStarted(true); setRunning(true); }}>
            <Play /> Start {minutes}-minute session
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause /> : <Play />} {running ? "Pause" : "Resume"}
            </Button>
            <Button onClick={() => finish(elapsed)}>
              <Square /> Finish now
            </Button>
          </>
        )}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Breathe gently through your nose if you can. Stop if you feel dizzy. This is a relaxation exercise, not a medical treatment.
      </p>
    </div>
  );
}
