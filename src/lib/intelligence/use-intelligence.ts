/**
 * useIntelligence(): the engine applied to the signed-in user's cached data,
 * plus recommendation outcomes (accept / complete / dismiss / postpone) that
 * feed back into future recommendations. Saves a daily life-gap and pattern
 * snapshot so history is preserved.
 */
import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useWellness } from "@/lib/wellness-store";
import { useDaily } from "@/lib/daily";
import { addDays } from "@/lib/daily-metrics";
import { analyse, type RecommendationCandidate } from "./engine";

export type RecStatus = "accepted" | "completed" | "dismissed" | "postponed";

export function useIntelligence() {
  const { state } = useWellness();
  const { data, today, userId, loading } = useDaily();
  const qc = useQueryClient();
  const key = ["rec-outcomes", userId ?? "anon", today];

  const outcomesQ = useQuery({
    queryKey: key,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("recommendations")
        .select("rec_key, status, local_date, postponed_until")
        .eq("user_id", userId!).gte("local_date", addDays(today, -30));
      if (error) throw new Error(error.message);
      return rows;
    },
  });

  const intel = useMemo(
    () => analyse(state, data ?? null, today, outcomesQ.data ?? []),
    [state, data, today, outcomesQ.data],
  );

  const todays = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of outcomesQ.data ?? []) if (o.local_date === today && o.rec_key) m.set(o.rec_key, o.status);
    return m;
  }, [outcomesQ.data, today]);

  // One snapshot per day (upsert), only once real data has loaded.
  const saved = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || !data || saved.current === `${userId}:${today}`) return;
    saved.current = `${userId}:${today}`;
    void supabase.from("insight_snapshots").upsert(
      [
        { user_id: userId, kind: "life_gap", local_date: today, payload: intel.gaps as unknown as Json, updated_at: new Date().toISOString() },
        { user_id: userId, kind: "patterns", local_date: today, payload: intel.patterns as unknown as Json, updated_at: new Date().toISOString() },
      ],
      { onConflict: "user_id,kind,local_date" },
    );
  }, [userId, data, today, intel]);

  async function setOutcome(rec: RecommendationCandidate, status: RecStatus) {
    if (!userId) return;
    const { error } = await supabase.from("recommendations").upsert({
      user_id: userId, local_date: today, rec_key: rec.key, kind: "daily", area: rec.area,
      headline: rec.headline, action: rec.action, reason: rec.why, level: "primary",
      est_minutes: rec.minutes, difficulty: rec.difficulty, benefit: rec.benefit, status,
      postponed_until: status === "postponed" ? addDays(today, 1) : null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,local_date,rec_key" });
    if (error) { toast.error("Couldn't save that. Please try again."); return; }
    toast.success({ accepted: "Added to your day.", completed: "Nice — marked as done.", dismissed: "Got it. We'll suggest something else.", postponed: "Moved to tomorrow." }[status]);
    await qc.invalidateQueries({ queryKey: key });
  }

  return { intel, todays, setOutcome, loading: loading || outcomesQ.isLoading };
}
