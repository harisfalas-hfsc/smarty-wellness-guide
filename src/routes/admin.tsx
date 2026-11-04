import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity, ArrowLeft, BarChart3, CalendarClock, LayoutList, Loader2, MessagesSquare, Search, ShieldAlert, TrendingUp, Users, type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import {
  adminBroadcast, adminCheckAccess, adminGetReport, adminListContent, adminListJobRuns, adminListMembers, adminListThreads,
  adminMemberActivity, adminReply, adminRunDailyMessages, adminSetAccess, adminThreadMessages, adminUpdateContent, type AdminMember,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Smarty Wellness" },
      { name: "description", content: "Administration panel for Smarty Wellness." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type SectionKey = "reports" | "revenue" | "members" | "messages" | "content" | "jobs";
const SECTIONS: { key: SectionKey; label: string; description: string; Icon: LucideIcon; tone: string }[] = [
  { key: "reports", label: "Reports", description: "Sign-ups, activation, engagement and retention", Icon: BarChart3, tone: "border-primary" },
  { key: "revenue", label: "Revenue", description: "Members, monthly income, cancellations and churn", Icon: TrendingUp, tone: "border-calm" },
  { key: "members", label: "Members", description: "Customers, membership status, activity, free access and admins", Icon: Users, tone: "border-mind" },
  { key: "messages", label: "Messages", description: "Support requests and announcements to members", Icon: MessagesSquare, tone: "border-sun" },
  { key: "content", label: "Content", description: "Missions, challenges, experiments and rituals", Icon: LayoutList, tone: "border-coral" },
  { key: "jobs", label: "Scheduled jobs", description: "Daily coaching messages: schedule and history", Icon: CalendarClock, tone: "border-bloom" },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (s?: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");
const eur = (n: number) => `€${n.toFixed(2)}`;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

function AdminPage() {
  const { session, loading } = useAuth();
  const [section, setSection] = useState<SectionKey | null>(null);
  const access = useQuery({
    queryKey: ["admin-access", session?.user.id],
    enabled: !!session,
    queryFn: () => adminCheckAccess(),
  });
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);

  if (loading || (session && access.isLoading)) {
    return <PageShell><Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-primary" /></PageShell>;
  }
  if (!session || !access.data?.isAdmin) {
    return (
      <PageShell width="xl">
        <div className="mx-auto mt-10 max-w-sm rounded-3xl border-2 border-primary bg-card p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 text-xl font-extrabold">Admin access only</h1>
          <p className="mt-1 text-sm text-muted-foreground">This area is restricted to Smarty Wellness administrators.</p>
        </div>
      </PageShell>
    );
  }
  const active = SECTIONS.find((s) => s.key === section);
  return (
    <PageShell width="6xl">
      <PageHeader eyebrow="Administration" title={active ? active.label : "Admin panel"} subtitle={active ? active.description : "Everything that runs Smarty Wellness"} />
      {section ? (
        <div className="space-y-4">
          <button onClick={() => setSection(null)} className="inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="h-4 w-4" /> All sections</button>
          {section === "reports" && <ReportsSection />}
          {section === "revenue" && <RevenueSection />}
          {section === "members" && <MembersSection />}
          {section === "messages" && <MessagesSection />}
          {section === "content" && <ContentSection />}
          {section === "jobs" && <JobsSection />}
        </div>
      ) : (
        <Hub onOpen={setSection} />
      )}
    </PageShell>
  );
}

function useReport(from: string, to: string) {
  return useQuery({ queryKey: ["admin-report", from, to], queryFn: () => adminGetReport({ data: { from, to } }) });
}

function Hub({ onOpen }: { onOpen: (k: SectionKey) => void }) {
  const to = iso(new Date());
  const from = iso(new Date(Date.now() - 29 * 86_400_000));
  const { data } = useReport(from, to);
  const r = data?.report;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="All accounts" value={r?.total_users} />
        <Stat label="New · 30 days" value={r?.new_users} />
        <Stat label="Paying members" value={r ? r.subs_live.active + r.subs_live.cancelling : undefined} />
        <Stat label="Monthly revenue" value={data ? eur(data.revenue.mrr) : undefined} />
        <Stat label="Active today" value={r?.dau} />
        <Stat label="Active · 30 days" value={r?.mau} />
        <Stat label="Free access granted" value={r?.complimentary} />
        <Stat label="Open support requests" value={r?.open_support} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {SECTIONS.map(({ key, label, description, Icon, tone }) => (
          <button key={key} onClick={() => onOpen(key)} className={`relative flex min-h-[112px] flex-col items-start gap-2 rounded-2xl border-2 ${tone} bg-card p-4 text-left hover:bg-accent`}>
            {key === "messages" && (r?.open_support ?? 0) > 0 && (
              <span className="absolute right-3 top-3 grid h-6 min-w-6 place-items-center rounded-full bg-destructive px-2 text-xs font-bold text-destructive-foreground">{r!.open_support}</span>
            )}
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
            <span className="font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: ReactNode; help?: string }) {
  return (
    <div className="rounded-2xl border-2 border-primary bg-card p-4" title={help}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value ?? <Loader2 className="h-5 w-5 animate-spin text-primary" />}</p>
      {help && <p className="mt-1 text-[11px] text-muted-foreground">{help}</p>}
    </div>
  );
}

function RangePicker({ from, to, setFrom, setTo }: { from: string; to: string; setFrom: (s: string) => void; setTo: (s: string) => void }) {
  const preset = (days: number) => { setTo(iso(new Date())); setFrom(iso(new Date(Date.now() - (days - 1) * 86_400_000))); };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-primary bg-card p-3 text-sm">
      <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 rounded-lg border px-2 py-1" /></label>
      <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 rounded-lg border px-2 py-1" /></label>
      {[7, 30, 90, 365].map((d) => (
        <button key={d} onClick={() => preset(d)} className="rounded-full border-2 border-primary px-3 py-1 text-xs font-bold text-primary">{d} days</button>
      ))}
    </div>
  );
}

function useRange() {
  const [to, setTo] = useState(iso(new Date()));
  const [from, setFrom] = useState(iso(new Date(Date.now() - 29 * 86_400_000)));
  return { from, to, setFrom, setTo };
}

function Bars({ title, points }: { title: string; points: { d: string; n: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.n));
  return (
    <div className="rounded-2xl border-2 border-mind bg-card p-4">
      <p className="text-sm font-bold">{title}</p>
      {points.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No data in this period.</p> : (
        <div className="mt-3 flex h-32 items-end gap-1">
          {points.map((p) => (
            <div key={p.d} title={`${p.d}: ${p.n}`} className="flex-1 rounded-t bg-primary" style={{ height: `${(p.n / max) * 100}%`, minHeight: 2 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsSection() {
  const range = useRange();
  const { data, isLoading, error } = useReport(range.from, range.to);
  const r = data?.report;
  return (
    <div className="space-y-4">
      <RangePicker {...range} />
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading || !r ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
        <>
          <h3 className="font-extrabold uppercase">Acquisition & activation</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="New sign-ups" value={r.new_users} />
            <Stat label="Completed onboarding" value={`${r.onboarded_new} (${pct(r.onboarded_new, r.new_users)})`} />
            <Stat label="Did a first check-in" value={`${r.first_checkin_new} (${pct(r.first_checkin_new, r.new_users)})`} />
            <Stat label="Completed a ritual" value={`${r.first_ritual_new} (${pct(r.first_ritual_new, r.new_users)})`} />
            <Stat label="Completed a mission" value={`${r.first_mission_new} (${pct(r.first_mission_new, r.new_users)})`} />
            <Stat label="Used Smarty Coach" value={`${r.coach_users_new} (${pct(r.coach_users_new, r.new_users)})`} />
            <Stat label="Came back in week 2" value={`${r.retained_week1} (${pct(r.retained_week1, r.new_users)})`} help="New sign-ups active 7–13 days after joining." />
          </div>
          <h3 className="font-extrabold uppercase">Engagement</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Active on end date" value={r.dau} />
            <Stat label="Active · 7 days" value={r.wau} />
            <Stat label="Active · 30 days" value={r.mau} />
            <Stat label="Active in period" value={r.active_in_range} />
            <Stat label="Check-ins" value={r.checkins} />
            <Stat label="Rituals completed" value={r.rituals} />
            <Stat label="Missions completed" value={r.missions} />
            <Stat label="Challenge days" value={r.challenges} />
            <Stat label="Coach questions" value={r.coach_messages} />
          </div>
          <h3 className="font-extrabold uppercase">Retention</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Returning users" value={r.returning} help="Active on 2+ different days in the period." />
            <Stat label="Inactive 14+ days" value={r.inactive_14d} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Bars title="New sign-ups per day" points={r.daily_new_users} />
            <Bars title="Active users per day" points={r.daily_active} />
          </div>
        </>
      )}
    </div>
  );
}

function RevenueSection() {
  const range = useRange();
  const { data, isLoading } = useReport(range.from, range.to);
  const r = data?.report;
  return (
    <div className="space-y-4">
      <RangePicker {...range} />
      {isLoading || !r || !data ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Monthly recurring revenue" value={eur(data.revenue.mrr)} help="Paying members × monthly price (VAT included)." />
            <Stat label="Annual run rate" value={eur(data.revenue.arr)} />
            <Stat label="Revenue per paying member" value={eur(data.revenue.arppu)} />
            <Stat label="Churn in period" value={`${(data.revenue.churnRate * 100).toFixed(1)}%`} />
            <Stat label="Active members" value={r.subs_live.active} />
            <Stat label="Cancelling (paid until period end)" value={r.subs_live.cancelling} />
            <Stat label="Payment problems" value={r.subs_live.past_due} />
            <Stat label="New memberships in period" value={r.subs_live.new} />
            <Stat label="Cancellations in period" value={r.subs_live.cancelled} />
            <Stat label="Free access (granted)" value={r.complimentary} />
          </div>
          <p className="text-xs text-muted-foreground">
            Figures count real payments only. Test-mode memberships: {r.subs_test.active} active of {r.subs_test.total}. Detailed payouts, refunds and tax reports are in the Payments tab.
          </p>
        </>
      )}
    </div>
  );
}

function MembersSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-members"], queryFn: () => adminListMembers() });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => {
    const cutoff = Date.now() - 14 * 86_400_000;
    return (data?.members ?? []).filter((m) => {
      if (q && !`${m.email} ${m.name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (filter === "members") return m.status.startsWith("Member") || m.status.startsWith("Cancelling") || m.complimentary || m.admin;
      if (filter === "free") return m.status === "Free" && !m.complimentary && !m.admin;
      if (filter === "inactive") return !m.last_active || new Date(m.last_active).getTime() < cutoff;
      return true;
    });
  }, [data, q, filter]);
  const toggle = async (m: AdminMember, kind: "complimentary" | "admin") => {
    try {
      await adminSetAccess({ data: { userId: m.id, kind, on: !(kind === "admin" ? m.admin : m.complimentary) } });
      toast.success("Updated");
      void qc.invalidateQueries({ queryKey: ["admin-members"] });
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-full border-2 border-primary bg-card px-3">
          <Search className="h-4 w-4 text-primary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or name" className="h-10 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-full border-2 border-primary bg-card px-3 text-sm">
          <option value="all">All accounts</option><option value="members">Members</option><option value="free">Not paying</option><option value="inactive">Inactive 14+ days</option>
        </select>
      </div>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{list.length} accounts</p>
          {list.map((m) => (
            <div key={m.id} className="rounded-2xl border-2 border-mind bg-card p-3 text-sm">
              <button onClick={() => setOpen(open === m.id ? null : m.id)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
                <span>
                  <span className="block font-bold">{m.email || m.name}</span>
                  <span className="text-xs text-muted-foreground">Joined {fmt(m.created_at)} · Last active {fmt(m.last_active)} · {m.onboarded ? "Onboarded" : "Not onboarded"}</span>
                </span>
                <span className="flex flex-wrap gap-1 text-xs font-bold">
                  <span className="rounded-full border-2 border-primary px-2 py-0.5">{m.status}</span>
                  {m.complimentary && <span className="rounded-full border-2 border-calm px-2 py-0.5">Free access</span>}
                  {m.admin && <span className="rounded-full border-2 border-coral px-2 py-0.5">Admin</span>}
                </span>
              </button>
              {open === m.id && <MemberDetail m={m} onToggle={toggle} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberDetail({ m, onToggle }: { m: AdminMember; onToggle: (m: AdminMember, k: "complimentary" | "admin") => void }) {
  const { data } = useQuery({ queryKey: ["admin-activity", m.id], queryFn: () => adminMemberActivity({ data: { userId: m.id } }) });
  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      <p className="text-xs">Renewal / access end: <b>{fmt(m.renews)}</b> · Last sign-in: <b>{fmt(m.last_sign_in_at)}</b></p>
      <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><span className="font-bold">Activity</span></div>
      {!data ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {Object.entries(data.counts).map(([k, v]) => <div key={k} className="rounded-xl border p-2"><span className="capitalize text-muted-foreground">{k}</span><b className="block text-base">{v}</b></div>)}
          </div>
          {data.recent.length > 0 && (
            <p className="text-xs text-muted-foreground">Recent check-ins: {data.recent.map((c) => `${c.local_date} (${c.mood}, energy ${c.energy}, stress ${c.stress})`).join(" · ")}</p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onToggle(m, "complimentary")} className="rounded-full border-2 border-calm px-3 py-1 text-xs font-bold">{m.complimentary ? "Remove free access" : "Give free access"}</button>
        <button onClick={() => onToggle(m, "admin")} className="rounded-full border-2 border-coral px-3 py-1 text-xs font-bold">{m.admin ? "Remove admin" : "Make admin"}</button>
      </div>
    </div>
  );
}

function MessagesSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-threads"], queryFn: () => adminListThreads() });
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "members">("members");
  const send = async () => {
    try {
      const r = await adminBroadcast({ data: { title, body, audience } });
      toast.success(`Sent to ${r.sent} message centers`);
      setTitle(""); setBody("");
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-sun bg-card p-4">
        <p className="font-bold">Send an announcement</p>
        <p className="text-xs text-muted-foreground">Appears in each person's message center inside the app.</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="mt-3 h-10 w-full rounded-xl border px-3 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" rows={3} className="mt-2 w-full rounded-xl border p-3 text-sm" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={audience} onChange={(e) => setAudience(e.target.value as "all" | "members")} className="h-9 rounded-full border px-3 text-sm">
            <option value="members">Members only</option><option value="all">Everyone with an account</option>
          </select>
          <button onClick={send} disabled={!title.trim() || !body.trim()} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">Send</button>
        </div>
      </div>
      <p className="font-bold">Support requests</p>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (data?.threads ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No support requests yet.</p> : (
        (data?.threads ?? []).map((t) => (
          <div key={t.id} className={`rounded-2xl border-2 ${t.admin_unread ? "border-coral" : "border-sun"} bg-card p-3 text-sm`}>
            <button onClick={() => setOpen(open === t.id ? null : t.id)} className="flex w-full flex-wrap justify-between gap-2 text-left">
              <span><b>{t.subject}</b><span className="block text-xs text-muted-foreground">{t.email} · {t.category} · {fmt(t.updated_at)}</span></span>
              <span className="rounded-full border-2 border-primary px-2 py-0.5 text-xs font-bold capitalize">{t.admin_unread ? "New" : t.status}</span>
            </button>
            {open === t.id && <Thread id={t.id} onDone={() => { void qc.invalidateQueries({ queryKey: ["admin-threads"] }); }} />}
          </div>
        ))
      )}
    </div>
  );
}

function Thread({ id, onDone }: { id: string; onDone: () => void }) {
  const { data, refetch } = useQuery({ queryKey: ["admin-thread", id], queryFn: () => adminThreadMessages({ data: { threadId: id } }) });
  const [reply, setReply] = useState("");
  const act = async (status: "answered" | "closed") => {
    try {
      await adminReply({ data: { threadId: id, body: reply, status } });
      setReply(""); void refetch(); onDone();
      toast.success(status === "closed" ? "Closed" : "Reply sent");
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {(data?.messages ?? []).map((m) => (
        <div key={m.id} className={`rounded-xl p-2 ${m.sender === "admin" ? "ml-8 bg-primary/10" : "mr-8 bg-muted"}`}>
          <p className="whitespace-pre-wrap">{m.body}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{m.sender === "admin" ? "You" : "Member"} · {new Date(m.created_at).toLocaleString()}</p>
        </div>
      ))}
      <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Write a reply…" className="w-full rounded-xl border p-2" />
      <div className="flex gap-2">
        <button onClick={() => act("answered")} disabled={!reply.trim()} className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50">Send reply</button>
        <button onClick={() => act("closed")} className="rounded-full border-2 border-primary px-4 py-1.5 text-xs font-bold text-primary">{reply.trim() ? "Reply & close" : "Close"}</button>
      </div>
    </div>
  );
}

type ContentKey = "mission_definitions" | "challenge_definitions" | "experiment_definitions";
function ContentSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-content"], queryFn: () => adminListContent() });
  const [tab, setTab] = useState<ContentKey | "rituals">("mission_definitions");
  const save = async (table: ContentKey | "ritual_activity_definitions", id: string, patch: { active?: boolean; title?: string; detail?: string }) => {
    try {
      await adminUpdateContent({ data: { table, id, ...patch } });
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: ["admin-content"] });
    } catch (e) { toast.error((e as Error).message); }
  };
  const tabs: [typeof tab, string][] = [["mission_definitions", "Missions"], ["challenge_definitions", "Challenges"], ["experiment_definitions", "Experiments"], ["rituals", "Ritual activities"]];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-full border-2 border-primary px-3 py-1 text-xs font-bold ${tab === k ? "bg-primary text-primary-foreground" : "text-primary"}`}>{l}</button>)}
      </div>
      {isLoading || !data ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : tab === "rituals" ? (
        data.rituals.map((r) => <ContentRow key={r.id} title={r.title} detail={r.detail} meta={`${r.ritual_id} · ${r.minutes} min`} onSave={(p) => save("ritual_activity_definitions", r.id, p)} />)
      ) : (
        data[tab].map((r: any) => <ContentRow key={r.id} title={r.title} detail={r.detail} active={r.active} onSave={(p) => save(tab, r.id, p)} />)
      )}
    </div>
  );
}

function ContentRow({ title, detail, active, meta, onSave }: { title: string; detail: string; active?: boolean; meta?: string; onSave: (p: { active?: boolean; title?: string; detail?: string }) => void }) {
  const [t, setT] = useState(title);
  const [d, setD] = useState(detail);
  return (
    <div className="rounded-2xl border-2 border-coral bg-card p-3 text-sm">
      {meta && <p className="mb-1 text-xs text-muted-foreground">{meta}</p>}
      <input value={t} onChange={(e) => setT(e.target.value)} className="w-full rounded-lg border px-2 py-1 font-bold" />
      <textarea value={d} onChange={(e) => setD(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border p-2" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button onClick={() => onSave({ title: t, detail: d })} disabled={t === title && d === detail} className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground disabled:opacity-50">Save text</button>
        {typeof active === "boolean" && (
          <button onClick={() => onSave({ active: !active })} className="rounded-full border-2 border-primary px-3 py-1 text-xs font-bold text-primary">{active ? "Shown to members — hide" : "Hidden — show"}</button>
        )}
      </div>
    </div>
  );
}

function JobsSection() {
  const { data, refetch } = useQuery({ queryKey: ["admin-jobs"], queryFn: () => adminListJobRuns() });
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const r = await adminRunDailyMessages();
      toast.success(`Sent ${r.sent}, skipped ${r.skipped}`);
      void refetch();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-bloom bg-card p-4 text-sm">
        <p className="font-bold">Daily coaching message</p>
        <p className="mt-1 text-muted-foreground">Every day at 06:17 (Cyprus winter time, 04:17 UTC) each member with an active membership receives one short, practical message in their message center, based on their latest check-in. Members can turn it off in their account. Sending twice on the same day is prevented.</p>
        <button onClick={run} disabled={busy} className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{busy ? "Running…" : "Run now"}</button>
      </div>
      <p className="font-bold">History</p>
      {(data?.runs ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No runs yet.</p> : (data?.runs ?? []).map((r) => {
        const d = r.detail as Record<string, unknown>;
        return (
          <div key={r.id} className="flex flex-wrap justify-between gap-2 rounded-2xl border-2 border-bloom bg-card p-3 text-xs">
            <span>{new Date(r.started_at).toLocaleString()} · {String(d["trigger"] ?? "")}</span>
            <span className="font-bold capitalize">{r.status} · sent {String(d["sent"] ?? 0)} · skipped {String(d["skipped"] ?? 0)}{d["failed"] ? ` · failed ${String(d["failed"])}` : ""}</span>
          </div>
        );
      })}
    </div>
  );
}
