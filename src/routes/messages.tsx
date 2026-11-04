import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Trash2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages | Smarty Wellness" }, { name: "robots", content: "noindex" }] }),
  component: Messages,
});

const KIND: Record<string, string> = { daily_coach: "Daily coaching", announcement: "Announcement", support: "Support", billing: "Membership" };

export function useUnreadMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["inbox-unread", user?.id],
    enabled: !!user,
    refetchInterval: 120_000,
    queryFn: async () => {
      const { count } = await supabase.from("inbox_messages").select("id", { count: "exact", head: true }).is("read_at", null);
      return count ?? 0;
    },
  });
}

function Messages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["inbox", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("inbox_messages").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["inbox"] }); void qc.invalidateQueries({ queryKey: ["inbox-unread"] }); };
  const markRead = async (id: string) => { await supabase.from("inbox_messages").update({ read_at: new Date().toISOString() }).eq("id", id); refresh(); };
  const markAll = async () => { await supabase.from("inbox_messages").update({ read_at: new Date().toISOString() }).is("read_at", null); refresh(); };
  const remove = async (id: string) => { await supabase.from("inbox_messages").delete().eq("id", id); refresh(); };

  if (!user) return <PageShell width="xl"><PageHeader title="Messages" /><p className="text-center"><Link to="/auth" search={{ mode: "signin" }} className="font-bold text-primary underline">Sign in</Link> to see your messages.</p></PageShell>;

  return (
    <PageShell width="3xl">
      <PageHeader eyebrow="Message center" icon={Inbox} title="Messages" subtitle="Your daily coaching notes, replies from support and news from Smarty Wellness." />
      <div className="mb-3 flex justify-between text-sm">
        <Link to="/support" className="font-bold text-primary underline">Contact support</Link>
        <button onClick={markAll} className="font-bold text-primary underline">Mark all as read</button>
      </div>
      {isLoading ? null : (data ?? []).length === 0 ? (
        <div className="rounded-3xl border-2 border-primary bg-card p-6 text-center text-sm text-muted-foreground">No messages yet. Your daily coaching message will appear here each morning.</div>
      ) : (
        <div className="space-y-3">
          {data!.map((m) => (
            <div key={m.id} onClick={() => !m.read_at && void markRead(m.id)} className={`cursor-pointer rounded-3xl border-2 bg-card p-4 ${m.read_at ? "border-primary/40" : "border-calm"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{KIND[m.kind] ?? "Message"} · {new Date(m.created_at).toLocaleDateString()}</p>
                  <p className="mt-1 font-bold">{!m.read_at && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-calm align-middle" />}{m.title}</p>
                </div>
                <button aria-label="Delete message" onClick={(e) => { e.stopPropagation(); void remove(m.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
