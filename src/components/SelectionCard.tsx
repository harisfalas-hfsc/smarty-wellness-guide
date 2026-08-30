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

/** 1–5 scale control used by the daily check-in. */
export function ScaleControl({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  lowLabel: string;
  highLabel: string;
}) {
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
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
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
