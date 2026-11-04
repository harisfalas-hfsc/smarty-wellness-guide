// Daily coaching message: one short, practical note per member per day,
// written into their message center. Rule-based (no AI cost), driven by
// the member's most recent check-in.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;

const GENERAL = [
  ["Start small today", "Pick one thing from your plan and do it before lunch. Small wins build momentum."],
  ["Drink a glass of water now", "Most of us start the day a little dehydrated. A glass of water is the easiest win you'll get today."],
  ["Take a 10-minute walk", "A short walk after a meal helps your energy, mood and digestion. No gear needed."],
  ["Three slow breaths", "Before your next task, breathe in for 4, out for 6 — three times. It resets your focus."],
  ["Protect your evening", "Put your phone away 30 minutes before bed tonight. Your sleep will thank you."],
  ["Connect with someone", "Send a quick message to a friend or family member today. Connection is part of wellness."],
  ["Move every hour", "Stand up and stretch for one minute every hour you sit. Your back and mind will feel lighter."],
  ["Be kind to yourself", "Progress isn't perfect. Notice one thing you did well yesterday."],
  ["Get some daylight", "Spend a few minutes outside this morning. Daylight helps your energy and your sleep."],
  ["Plan tomorrow tonight", "Write down tomorrow's one most important thing before bed. Less to think about in the morning."],
] as const;

function localDate(tz: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function pickMessage(
  checkIn: { stress: number; energy: number; sleep: number; mood: string } | null,
  seed: number,
): { title: string; body: string } {
  if (checkIn) {
    if (checkIn.stress >= 4) return { title: "Ease the pressure today", body: "Your last check-in showed high stress. Try the 2-minute breathing exercise and choose just one priority for today." };
    if (checkIn.sleep <= 2) return { title: "Rest comes first", body: "You slept poorly recently. Keep today gentle, get some daylight early and aim for an earlier night." };
    if (checkIn.energy <= 2) return { title: "Gentle energy boost", body: "Energy was low last time. A glass of water, a short walk and a protein-rich meal can lift you without forcing it." };
    if (checkIn.energy >= 4) return { title: "Use your good energy", body: "You're feeling energetic — a great day to take one step on a goal or try today's challenge." };
  }
  const g = GENERAL[seed % GENERAL.length]!;
  return { title: g[0], body: g[1] };
}

export async function runDailyMessages(admin: Admin, trigger: "schedule" | "manual") {
  const { data: run } = await admin.from("job_runs").insert({ job: "daily_coach_messages", detail: { trigger } }).select("id").single();
  let sent = 0, skipped = 0, failed = 0;
  try {
    const [{ data: profiles }, { data: prefs }] = await Promise.all([
      admin.from("profiles").select("id, timezone"),
      admin.from("wellness_preferences").select("user_id, daily_messages"),
    ]);
    const optedOut = new Set((prefs ?? []).filter((p) => p.daily_messages === false).map((p) => p.user_id));
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    for (const p of profiles ?? []) {
      if (optedOut.has(p.id)) { skipped++; continue; }
      const { data: active } = await admin.rpc("has_active_subscription", { user_uuid: p.id });
      if (!active) { skipped++; continue; }
      const { data: ci } = await admin.from("check_ins").select("stress, energy, sleep, mood")
        .eq("user_id", p.id).order("local_date", { ascending: false }).limit(1).maybeSingle();
      const msg = pickMessage(ci, dayIndex + p.id.charCodeAt(0));
      const { error } = await admin.from("inbox_messages").insert({
        user_id: p.id, kind: "daily_coach", title: msg.title, body: msg.body, local_date: localDate(p.timezone),
      });
      if (!error) sent++;
      else if (error.code === "23505") skipped++;
      else failed++;
    }
    await admin.from("job_runs").update({ status: failed ? "partial" : "ok", finished_at: new Date().toISOString(), detail: { trigger, sent, skipped, failed } }).eq("id", run!.id);
  } catch (e) {
    await admin.from("job_runs").update({ status: "failed", finished_at: new Date().toISOString(), detail: { trigger, sent, skipped, failed, error: (e as Error).message } }).eq("id", run!.id);
    throw e;
  }
  return { sent, skipped, failed };
}
