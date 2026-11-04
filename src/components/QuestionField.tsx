import type { Question } from "@/lib/ritual-content";
import { cn } from "@/lib/utils";

export type AnswerValue = string | number;

/** One short check-in question: 1–5 scale, choice chips or a short text. */
export function QuestionField({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue | undefined) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground">{q.label}</legend>
      {q.type === "scale" && (
        <div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={value === n}
                onClick={() => onChange(value === n ? undefined : n)}
                className={cn(
                  "h-11 rounded-xl border-2 text-sm font-bold transition",
                  value === n ? "border-primary bg-primary text-primary-foreground" : "border-primary/30 bg-card text-foreground hover:border-primary",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{q.low}</span>
            <span>{q.high}</span>
          </div>
        </div>
      )}
      {q.type === "choice" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {q.options.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={value === o.value}
              onClick={() => onChange(value === o.value ? undefined : o.value)}
              className={cn(
                "min-h-10 rounded-full border-2 px-4 text-sm font-semibold transition",
                value === o.value ? "border-calm bg-calm/15 text-calm-deep" : "border-calm/40 bg-card text-foreground hover:border-calm",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {q.type === "text" && (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          placeholder={q.placeholder}
          maxLength={200}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="mt-2 h-11 w-full rounded-xl border-2 border-mind/40 bg-card px-3 text-sm outline-none focus:border-mind"
        />
      )}
    </fieldset>
  );
}
