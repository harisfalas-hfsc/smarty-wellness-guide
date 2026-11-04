import { Link } from "@tanstack/react-router";
import { Check, Clock, MessageCircle, Sparkles, X, CalendarClock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import type { RecommendationCandidate } from "@/lib/intelligence/engine";

const DIFF_LABEL = { easy: "Easy", moderate: "Moderate", stretch: "Stretch" } as const;

/** Smarty Daily Intelligence: how am I doing, what to focus on, the most useful action now. */
export function DailyIntelligence() {
  const { intel, todays, setOutcome, loading } = useIntelligence();
  if (loading) {
    return <section className="rounded-3xl border-2 border-primary bg-card p-6 text-sm text-muted-foreground shadow-soft">Reading your day…</section>;
  }
  const { primary, secondary } = intel;
  return (
    <section className="rounded-3xl border-2 border-primary bg-card p-5 shadow-soft sm:p-6" aria-labelledby="di-title">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Smarty Daily Intelligence
      </p>
      <h2 id="di-title" className="mt-2 text-sm font-semibold text-muted-foreground">How you're doing</h2>
      <p className="mt-1 text-base leading-6">{intel.overview}</p>
      <p className="mt-3 text-sm"><span className="font-semibold">Today's focus:</span> {intel.focus}</p>

      {primary ? (
        <RecCard rec={primary} status={todays.get(primary.key)} onOutcome={setOutcome} main />
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Nothing pressing today — you're on track. Keep your usual rhythm.</p>
      )}
      {secondary && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">If you have time</p>
          <RecCard rec={secondary} status={todays.get(secondary.key)} onOutcome={setOutcome} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
        {intel.suggestedChallenge && (
          <Link to="/challenges" style={{ textDecoration: "none" }}>
            <Button size="sm" variant="outline"><Trophy /> Suggested challenge: {intel.suggestedChallenge.title}</Button>
          </Link>
        )}
        <Link to="/insights" style={{ textDecoration: "none" }}><Button size="sm" variant="outline">See your insights</Button></Link>
        <Link to="/coach" style={{ textDecoration: "none" }}><Button size="sm" variant="outline"><MessageCircle /> Ask Smarty Coach</Button></Link>
      </div>
    </section>
  );
}

function RecCard({ rec, status, onOutcome, main }: {
  rec: RecommendationCandidate; status: string | undefined; main?: boolean;
  onOutcome: (r: RecommendationCandidate, s: "accepted" | "completed" | "dismissed" | "postponed") => void;
}) {
  return (
    <div className={main ? "mt-4 rounded-2xl border-2 border-calm/60 p-4" : "mt-2 rounded-2xl border-2 border-mind/40 p-4"}>
      <p className="text-sm font-semibold text-muted-foreground">{rec.headline}</p>
      <p className={main ? "mt-1 text-lg font-bold sm:text-xl" : "mt-1 text-base font-bold"}>{rec.action}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Why: </span>{rec.why}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-primary"><Clock className="h-3 w-3" /> {rec.minutes} min</span>
        <span className="rounded-full border border-calm/60 px-2.5 py-1 text-calm-deep">{DIFF_LABEL[rec.difficulty]}</span>
        <span className="rounded-full border border-sun/70 px-2.5 py-1 text-sun-deep">{rec.benefit}</span>
      </div>
      {status === "completed" ? (
        <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-calm-deep"><Check className="h-4 w-4" /> Done today</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={rec.to} style={{ textDecoration: "none" }} onClick={() => status !== "accepted" && onOutcome(rec, "accepted")}>
            <Button size="sm">{status === "accepted" ? "Continue" : "Start"}</Button>
          </Link>
          {rec.key !== "check-in" && <>
            <Button size="sm" variant="outline" onClick={() => onOutcome(rec, "completed")}><Check /> I did it</Button>
            <Button size="sm" variant="ghost" onClick={() => onOutcome(rec, "postponed")}><CalendarClock /> Tomorrow</Button>
            <Button size="sm" variant="ghost" onClick={() => onOutcome(rec, "dismissed")}><X /> Not for me</Button>
          </>}
        </div>
      )}
    </div>
  );
}
