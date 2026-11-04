import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PREMIUM_PLAN_AMOUNT } from "@/lib/membership";

type Pt = { d: string; n: number };
export type AdminReport = {
  total_users: number; new_users: number; onboarded_new: number; first_checkin_new: number; first_ritual_new: number;
  first_mission_new: number; coach_users_new: number; dau: number; wau: number; mau: number; active_in_range: number;
  checkins: number; rituals: number; missions: number; challenges: number; coach_messages: number; inactive_14d: number;
  returning: number; retained_week1: number; daily_new_users: Pt[]; daily_active: Pt[];
  subs_live: { active: number; cancelling: number; past_due: number; new: number; cancelled: number };
  subs_test: { active: number; total: number }; complimentary: number; open_support: number;
};

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminCheckAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

export const adminGetReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.from) || !/^\d{4}-\d{2}-\d{2}$/.test(d.to)) throw new Error("Invalid dates");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: report, error } = await context.supabase.rpc("admin_report", { _from: data.from, _to: data.to });
    if (error) throw new Error(error.message);
    const r = report as any;
    const active = Number(r.subs_live.active) + Number(r.subs_live.cancelling) ;
    const mrr = active * PREMIUM_PLAN_AMOUNT;
    const payingStart = active + Number(r.subs_live.cancelled);
    return {
      report: r as AdminReport,
      revenue: {
        mrr,
        arr: mrr * 12,
        arppu: active ? PREMIUM_PLAN_AMOUNT : 0,
        churnRate: payingStart ? Number(r.subs_live.cancelled) / payingStart : 0,
      },
    };
  });

export type AdminMember = {
  id: string; email: string; name: string | null; created_at: string; last_sign_in_at: string | null;
  last_active: string | null; status: string; renews: string | null; complimentary: boolean; admin: boolean; onboarded: boolean;
};

export const adminListMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ members: AdminMember[] }> => {
    const admin = await assertAdmin(context);
    const [{ data: users }, { data: profiles }, { data: subs }, { data: grants }, { data: roles }, { data: acts }] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("profiles").select("id, display_name, created_at, onboarded_at"),
      admin.from("subscriptions").select("user_id, status, current_period_end, cancel_at_period_end, environment, created_at").order("created_at", { ascending: false }),
      admin.from("membership_grants").select("user_id, expires_at"),
      admin.from("user_roles").select("user_id, role"),
      admin.from("check_ins").select("user_id, local_date").order("local_date", { ascending: false }).limit(5000),
    ]);
    const emails = new Map((users?.users ?? []).map((u) => [u.id, u]));
    const lastAct = new Map<string, string>();
    for (const a of acts ?? []) if (!lastAct.has(a.user_id)) lastAct.set(a.user_id, a.local_date);
    const subBy = new Map<string, any>();
    for (const s of subs ?? []) if (!subBy.has(s.user_id)) subBy.set(s.user_id, s);
    const members = (profiles ?? []).map((p) => {
      const u = emails.get(p.id);
      const s = subBy.get(p.id);
      const live = s && (["active", "trialing", "past_due"].includes(s.status) || (s.status === "canceled" && s.current_period_end && new Date(s.current_period_end) > new Date()));
      const status = !s ? "Free" : live ? (s.cancel_at_period_end ? "Cancelling" : s.status === "past_due" ? "Payment problem" : "Member") + (s.environment === "sandbox" ? " (test)" : "") : "Expired";
      return {
        id: p.id, email: u?.email ?? "", name: p.display_name, created_at: p.created_at,
        last_sign_in_at: u?.last_sign_in_at ?? null, last_active: lastAct.get(p.id) ?? null,
        status, renews: s?.current_period_end ?? null,
        complimentary: !!(grants ?? []).find((g) => g.user_id === p.id && (!g.expires_at || new Date(g.expires_at) > new Date())),
        admin: !!(roles ?? []).find((r) => r.user_id === p.id && r.role === "admin"),
        onboarded: !!p.onboarded_at,
      };
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { members };
  });

export const adminSetAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; kind: "complimentary" | "admin"; on: boolean }) => d)
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    if (data.kind === "admin") {
      if (data.userId === context.userId && !data.on) throw new Error("You can't remove your own admin access.");
      if (data.on) await admin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      else await admin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    } else {
      if (data.on) await admin.from("membership_grants").upsert({ user_id: data.userId, note: "Granted by admin" });
      else await admin.from("membership_grants").delete().eq("user_id", data.userId);
    }
    return { ok: true };
  });

export const adminMemberActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const count = async (t: any, extra?: (q: any) => any) => {
      let q = admin.from(t).select("*", { count: "exact", head: true }).eq("user_id", data.userId);
      if (extra) q = extra(q);
      const { count: c } = await q;
      return c ?? 0;
    };
    const [checkins, rituals, missions, challenges, coach, goals, experiments, breathing] = await Promise.all([
      count("check_ins"), count("ritual_completions"), count("mission_completions"), count("challenge_completions"),
      count("coach_messages", (q) => q.eq("role", "user")), count("bucket_goals"), count("user_experiments"), count("breathing_sessions"),
    ]);
    const { data: recent } = await admin.from("check_ins").select("local_date, mood, energy, stress").eq("user_id", data.userId).order("local_date", { ascending: false }).limit(10);
    return { counts: { checkins, rituals, missions, challenges, coach, goals, experiments, breathing }, recent: recent ?? [] };
  });

// ---- Support & messages
export const adminListThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const { data: threads } = await admin.from("support_threads").select("*").order("updated_at", { ascending: false }).limit(200);
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const email = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return { threads: (threads ?? []).map((t) => ({ ...t, email: email.get(t.user_id) ?? "" })) };
  });

export const adminThreadMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { threadId: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    await admin.from("support_threads").update({ admin_unread: false }).eq("id", data.threadId);
    const { data: msgs } = await admin.from("support_messages").select("*").eq("thread_id", data.threadId).order("created_at");
    return { messages: msgs ?? [] };
  });

export const adminReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { threadId: string; body: string; status?: "open" | "answered" | "closed" }) => {
    if (d.body.trim().length > 5000) throw new Error("Message too long");
    return d;
  })
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { data: t } = await admin.from("support_threads").select("user_id, subject").eq("id", data.threadId).single();
    if (!t) throw new Error("Not found");
    if (data.body.trim()) {
      await admin.from("support_messages").insert({ thread_id: data.threadId, user_id: t.user_id, sender: "admin", body: data.body.trim() });
      await admin.from("inbox_messages").insert({ user_id: t.user_id, kind: "support", title: `Reply: ${t.subject}`, body: data.body.trim() });
    }
    await admin.from("support_threads").update({
      status: data.status ?? "answered", member_unread: !!data.body.trim(), admin_unread: false, updated_at: new Date().toISOString(),
    }).eq("id", data.threadId);
    return { ok: true };
  });

export const adminBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; body: string; audience: "all" | "members" }) => {
    if (!d.title.trim() || !d.body.trim()) throw new Error("Title and message are required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { data: profiles } = await admin.from("profiles").select("id");
    let ids = (profiles ?? []).map((p) => p.id);
    if (data.audience === "members") {
      const keep: string[] = [];
      for (const id of ids) {
        const { data: ok } = await admin.rpc("has_active_subscription", { user_uuid: id });
        if (ok) keep.push(id);
      }
      ids = keep;
    }
    if (ids.length) {
      await admin.from("inbox_messages").insert(ids.map((user_id) => ({ user_id, kind: "announcement", title: data.title.trim(), body: data.body.trim() })));
    }
    return { sent: ids.length };
  });

// ---- Content
const CONTENT_TABLES = ["mission_definitions", "challenge_definitions", "experiment_definitions"] as const;
type ContentTable = (typeof CONTENT_TABLES)[number];

export const adminListContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const [m, c, e, r] = await Promise.all([
      admin.from("mission_definitions").select("id, title, detail, active, sort_order").order("sort_order"),
      admin.from("challenge_definitions").select("id, title, detail, active, sort_order").order("sort_order"),
      admin.from("experiment_definitions").select("id, title, hypothesis, active, sort_order").order("sort_order"),
      admin.from("ritual_activity_definitions").select("id, ritual_id, title, detail, minutes, sort_order").order("ritual_id").order("sort_order"),
    ]);
    return {
      mission_definitions: m.data ?? [],
      challenge_definitions: c.data ?? [],
      experiment_definitions: (e.data ?? []).map((x) => ({ ...x, detail: x.hypothesis })),
      rituals: r.data ?? [],
    };
  });

export const adminUpdateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: ContentTable | "ritual_activity_definitions"; id: string; active?: boolean; title?: string; detail?: string }) => {
    if (![...CONTENT_TABLES, "ritual_activity_definitions"].includes(d.table)) throw new Error("Invalid table");
    return d;
  })
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const patch: Record<string, unknown> = {};
    if (data.table !== "ritual_activity_definitions" && typeof data.active === "boolean") patch["active"] = data.active;
    if (data.title?.trim()) patch["title"] = data.title.trim();
    if (data.detail?.trim()) patch[data.table === "experiment_definitions" ? "hypothesis" : "detail"] = data.detail.trim();
    const { error } = await admin.from(data.table).update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Jobs
export const adminListJobRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const { data } = await admin.from("job_runs").select("*").order("started_at", { ascending: false }).limit(30);
    return { runs: data ?? [] };
  });

export const adminRunDailyMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const { runDailyMessages } = await import("@/lib/daily-messages.server");
    return runDailyMessages(admin, "manual");
  });
