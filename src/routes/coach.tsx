import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Smarty Coach — Smarty Wellness" },
      {
        name: "description",
        content:
          "Tell Smarty Coach how you feel in plain words. It reads your profile, check-ins and habits and suggests the next realistic action.",
      },
      { property: "og:title", content: "Smarty Coach" },
      {
        property: "og:description",
        content: "A professional wellness and lifestyle guidance system, not a therapist.",
      },
    ],
  }),
  component: CoachPage,
});

const STARTERS = [
  "I feel exhausted.",
  "I have no motivation.",
  "I have been very stressed.",
  "I haven't trained for a week.",
  "I don't have time today.",
  "I want to start running.",
  "I want to improve my life.",
];

/** Placeholder acknowledgement. The reasoning engine is not built yet — this
 * never pretends to analyse the message. */
const HOLDING_REPLY =
  "Noted. Smarty Coach is being connected to your wellness profile, check-ins and schedule. Once it is live, it will answer here with one realistic action rather than a list of advice. In the meantime, your check-in already drives today's recommendation.";

function CoachPage() {
  const { state, addCoachMessage, todayCheckIn } = useWellness();
  const [text, setText] = useState("");

  function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    addCoachMessage({ role: "user", text: trimmed });
    addCoachMessage({ role: "coach", text: HOLDING_REPLY });
    setText("");
  }

  return (
    <PageShell width="3xl">
      <PageHeader
        eyebrow="The intelligence layer"
        icon={Sparkles}
        title="Smarty Coach"
        subtitle="Talk normally. You do not need to know the right question to ask."
      />

      <section className="rounded-3xl border-2 border-primary bg-card p-5 shadow-soft sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          What Smarty Coach considers
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your wellness profile, daily check-ins, recent changes, training, nutrition, movement,
          stress, energy, motivation, sleep, schedule, responsibilities, goals, missions and what
          has worked for you before.
          {todayCheckIn
            ? " Today's check-in is already available to it."
            : " Check in today so it has something current to work with."}
        </p>
      </section>

      <div className="mt-5 space-y-3">
        {state.coachMessages.length === 0 ? (
          <div className="rounded-3xl border-2 border-calm/60 bg-card p-6 text-sm leading-6 text-muted-foreground shadow-soft">
            Start with how you actually feel. For example: "I've had a heavy week at work and I
            haven't trained."
          </div>
        ) : (
          state.coachMessages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                  : "mr-auto max-w-[90%] rounded-3xl rounded-bl-lg border-2 border-calm/60 bg-card px-4 py-3 text-sm leading-6 text-foreground"
              }
            >
              {m.text}
            </div>
          ))
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Or start with one of these
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="cursor-pointer rounded-full border-2 border-mind/50 bg-card px-4 py-2 text-xs font-semibold text-mind-deep transition hover:border-mind hover:bg-mind/10"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Tell Smarty how you are doing…"
          className="min-h-[3.25rem] rounded-2xl"
        />
        <Button size="lg" onClick={() => send(text)} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-5 pb-2 text-xs leading-5 text-muted-foreground">
        Smarty Coach provides wellness and lifestyle guidance. It is not a doctor, psychologist or
        therapist and does not diagnose or treat any condition. If something feels beyond everyday
        stress, please speak with a qualified professional.
      </p>
    </PageShell>
  );
}
