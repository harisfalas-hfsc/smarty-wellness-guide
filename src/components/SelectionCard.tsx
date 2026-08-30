import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Smarty selection card — same treatment used across the Smarty family forms. */
export function SelectionCard({
  selected,
  onSelect,
  label,
  hint,
  icon,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  label: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left transition",
        selected
          ? "border-primary bg-primary/5 shadow-soft"
          : "border-border hover:border-primary/50",
        className,
      )}
    >
      {icon && <span className="grid h-8 w-8 shrink-0 place-items-center text-xl">{icon}</span>}
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5 text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

export type ScaleTone = "primary" | "calm" | "mind" | "sun" | "energy" | "bloom";

const SCALE_TONE: Record<ScaleTone, { selected: string; idle: string }> = {
  primary: {
    selected: "border-primary bg-primary/15 text-primary",
    idle: "border-primary/35 text-primary hover:border-primary hover:bg-primary/10",
  },
  calm: {
    selected: "border-calm bg-calm/25 text-calm-deep",
    idle: "border-calm/50 text-calm-deep hover:border-calm hover:bg-calm/10",
  },
  mind: {
    selected: "border-mind bg-mind/15 text-mind-deep",
    idle: "border-mind/45 text-mind-deep hover:border-mind hover:bg-mind/10",
  },
  sun: {
    selected: "border-sun bg-sun/35 text-sun-deep",
    idle: "border-sun/60 text-sun-deep hover:border-sun hover:bg-sun/20",
  },
  energy: {
    selected: "border-energy bg-energy/15 text-energy-deep",
    idle: "border-energy/45 text-energy-deep hover:border-energy hover:bg-energy/10",
  },
  bloom: {
    selected: "border-bloom bg-bloom/15 text-bloom-deep",
    idle: "border-bloom/45 text-bloom-deep hover:border-bloom hover:bg-bloom/10",
  },
};

/** 1–5 scale control used by the daily check-in. */
export function ScaleControl({
  value,
  onChange,
  lowLabel,
  highLabel,
  tone = "primary",
}: {
  value: number | null;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  lowLabel: string;
  highLabel: string;
  tone?: ScaleTone;
}) {
  const t = SCALE_TONE[tone];
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} of 5`}
            aria-pressed={value === n}
            className={cn(
              "h-11 cursor-pointer rounded-xl border-2 text-sm font-bold transition",
              value === n ? t.selected : cn("bg-card", t.idle),
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
