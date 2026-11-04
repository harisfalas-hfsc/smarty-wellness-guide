import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support | Smarty Wellness" },
      { name: "description", content: "Get help with Smarty Wellness: questions, technical problems, billing and feedback." },
      { property: "og:title", content: "Smarty Wellness Support" },
      { property: "og:description", content: "Questions, problems, billing or feedback — we're here to help." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Support,
});

const CATEGORIES = [
  ["question", "A question"], ["problem", "Technical problem"], ["billing", "Billing or membership"], ["account", "Account help"], ["feedback", "Feedback"],
] as const;

function Support() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("question");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const threads = useQuery({
    queryKey: ["support-threads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("support_threads").select("*, support_messages(*)").order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!user) {
    return (
      <PageShell width="xl">
        <PageHeader eyebrow="Support" icon={LifeBuoy} title="How can we help?" />
        <p className="text-center text-sm"><Link to="/auth" search={{ mode: "signin" }} className="font-bold text-primary underline">Sign in</Link> to send a request so we can reply securely to your account.</p>
      </PageShell>
    );
  }

  const submit = async () => {
    if (subject.trim().length < 3 || body.trim().length < 5) { toast.error("Please add a subject and a short description."); return; }
    setBusy(true);
    const { data: t, error } = await supabase.from("support_threads").insert({ user_id: user.id, subject: subject.trim().slice(0, 150), category }).select("id").single();
    if (!error && t) await supabase.from("support_messages").insert({ thread_id: t.id, user_id: user.id, body: body.trim().slice(0, 5000) });
    setBusy(false);
    if (error) { toast.error("Could not send. Please try again."); return; }
    toast.success("Sent! We'll reply in your message center.");
    setSubject(""); setBody("");
    void qc.invalidateQueries({ queryKey: ["support-threads"] });
  };

  const sendReply = async (threadId: string) => {
    if (!reply.trim()) return;
    await supabase.from("support_messages").insert({ thread_id: threadId, user_id: user.id, body: reply.trim().slice(0, 5000) });
    setReply("");
    void qc.invalidateQueries({ queryKey: ["support-threads"] });
  };

  const openThread = async (id: string, unread: boolean) => {
    setOpen(open === id ? null : id);
    if (unread) { await supabase.from("support_threads").update({ member_unread: false }).eq("id", id); void qc.invalidateQueries({ queryKey: ["support-threads"] }); }
  };

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Support" icon={LifeBuoy} title="How can we help?" subtitle="Send us a question, report a problem or share feedback. Replies arrive in your message center." />
      <div className="rounded-3xl border-2 border-primary bg-card p-5">
        <label className="text-sm font-bold">What is it about?</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 h-11 w-full rounded-xl border px-3 text-sm">
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="mt-3 block text-sm font-bold">Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className="mt-1 h-11 w-full rounded-xl border px-3 text-sm" />
        <label className="mt-3 block text-sm font-bold">Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={5000} className="mt-1 w-full rounded-xl border p-3 text-sm" />
        <button onClick={submit} disabled={busy} className="mt-3 w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60">{busy ? "Sending…" : "Send request"}</button>
      </div>

      <h2 className="mt-8 font-extrabold uppercase">Your requests</h2>
      {(threads.data ?? []).length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No requests yet.</p> : (
        <div className="mt-3 space-y-2">
          {threads.data!.map((t: any) => (
            <div key={t.id} className={`rounded-3xl border-2 bg-card p-4 text-sm ${t.member_unread ? "border-calm" : "border-primary/40"}`}>
              <button onClick={() => openThread(t.id, t.member_unread)} className="flex w-full justify-between gap-2 text-left">
                <span><b>{t.subject}</b><span className="block text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleDateString()}</span></span>
                <span className="text-xs font-bold capitalize text-primary">{t.member_unread ? "New reply" : t.status === "open" ? "Waiting for reply" : t.status}</span>
              </button>
              {open === t.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {[...t.support_messages].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)).map((m: any) => (
                    <div key={m.id} className={`rounded-xl p-2 ${m.sender === "admin" ? "mr-8 bg-primary/10" : "ml-8 bg-muted"}`}>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{m.sender === "admin" ? "Smarty Wellness" : "You"} · {new Date(m.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                  {t.status !== "closed" && (
                    <div className="flex gap-2">
                      <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a message…" className="h-10 flex-1 rounded-full border px-3" />
                      <button onClick={() => sendReply(t.id)} className="rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground">Send</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
