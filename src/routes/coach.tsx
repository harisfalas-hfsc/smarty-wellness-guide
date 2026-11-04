import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWellness } from "@/lib/wellness-store";
import { useDaily } from "@/lib/daily";
import { askCoach, clearCoachHistory } from "@/lib/coach.functions";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Smarty Coach — Smarty Wellness" },
      { name: "description", content: "A personal wellness coach that reads your check-ins, habits and goals and suggests one realistic next step." },
      { property: "og:title", content: "Smarty Coach — Smarty Wellness" },
      { property: "og:description", content: "Practical, personal wellness guidance based on your own records. Not a medical service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachPage,
});

const STARTERS = [
  "Why am I always tired?",
  "I've been very stressed this week.",
  "What should I focus on today?",
  "I don't have time today.",
  "How did my week go?",
  "Help me set a realistic goal.",
];

type Pending = { text: string; failed: string | null };

function CoachPage() {
  const { state } = useWellness();
  const { today } = useDaily();
  const qc = useQueryClient();
  const ask = useServerFn(askCoach);
  const clear = useServerFn(clearCoachHistory);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages = state.coachMessages;
  // Hide the optimistic copy once the saved message arrives.
  const lastSavedUser = [...messages].reverse().find((m) => m.role === "user")?.text;
  const showPending = pending && !(pending.failed === null && !thinking && lastSavedUser === pending.text);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, thinking, pending]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function send(message: string, retry = false) {
    const trimmed = message.trim();
    if ((!trimmed && !retry) || thinking) return;
    setPending({ text: trimmed, failed: null });
    if (!retry) setText("");
    setThinking(true);
    try {
      await ask({ data: { message: trimmed, today, retry } });
      await qc.invalidateQueries({ queryKey: ["wellness"] });
      setPending(null);
    } catch (err) {
      await qc.invalidateQueries({ queryKey: ["wellness"] });
      setPending({ text: trimmed, failed: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }

  async function clearHistory() {
    if (!window.confirm("Delete your whole conversation with Smarty Coach? This can't be undone.")) return;
    try { await clear(); await qc.invalidateQueries({ queryKey: ["wellness"] }); setPending(null); toast.success("Conversation deleted."); }
    catch { toast.error("Couldn't delete the conversation."); }
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1]!.role === "user";

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Your wellness coach" icon={MessageCircle} title="Smarty Coach"
        subtitle="Talk normally. Smarty Coach reads your check-ins, habits, goals and missions before it answers." />

      <div className="space-y-3" aria-live="polite">
        {messages.length === 0 && !showPending && (
          <div className="rounded-3xl border-2 border-calm/60 bg-card p-6 text-sm leading-6 text-muted-foreground shadow-soft">
            Start with how you actually feel — for example: "I've had a heavy week at work and I haven't trained."
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} text={m.text} />
        ))}
        {showPending && pending && lastSavedUser !== pending.text && pending.text && <Bubble role="user" text={pending.text} />}
        {thinking && (
          <div className="mr-auto flex w-fit items-center gap-2 rounded-3xl rounded-bl-lg border-2 border-calm/60 bg-card px-4 py-3 text-sm text-muted-foreground">
            <span className="flex gap-1" aria-hidden>
              <span className="h-2 w-2 animate-bounce rounded-full bg-calm [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-calm [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-calm" />
            </span>
            Looking at your records…
          </div>
        )}
        {!thinking && (pending?.failed || (lastIsUser && !pending)) && (
          <div className="rounded-2xl border-2 border-energy/60 bg-card p-4 text-sm">
            <p>{pending?.failed ?? "Smarty Coach hasn't answered your last message yet."}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => send(pending?.text ?? "", true)}><RotateCcw /> Retry</Button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length < 2 && (
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Or start with one of these</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s} type="button" disabled={thinking} onClick={() => send(s)}
                className="cursor-pointer rounded-full border-2 border-mind/50 bg-card px-4 py-2 text-xs font-semibold text-mind-deep transition hover:border-mind hover:bg-mind/10 disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="sticky bottom-20 mt-5 flex items-end gap-2 rounded-3xl border-2 border-primary/50 bg-card p-2 shadow-soft md:bottom-4"
        onSubmit={(e) => { e.preventDefault(); void send(text); }}>
        <Textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(text); } }}
          placeholder="Tell Smarty how you are doing…" className="min-h-[3.25rem] resize-none rounded-2xl border-0 shadow-none focus-visible:ring-0" />
        <Button type="submit" size="lg" disabled={thinking || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 pb-2">
        <p className="max-w-xl text-xs leading-5 text-muted-foreground">
          Smarty Coach gives wellness and lifestyle guidance. It is not a doctor, psychologist or therapist and does not diagnose or treat any condition. If something feels beyond everyday stress, please speak with a qualified professional.
        </p>
        {messages.length > 0 && <Button size="sm" variant="ghost" onClick={clearHistory}><Trash2 /> Delete conversation</Button>}
      </div>
    </PageShell>
  );
}

function Bubble({ role, text }: { role: "user" | "coach"; text: string }) {
  return role === "user" ? (
    <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">{text}</div>
  ) : (
    <div className="prose prose-sm mr-auto max-w-[90%] rounded-3xl rounded-bl-lg border-2 border-calm/60 bg-card px-4 py-3 text-sm leading-6 text-foreground [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
