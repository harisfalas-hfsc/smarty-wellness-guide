/**
 * useDaily(): the signed-in user's daily wellness data (last 35 days), cached
 * per user with TanStack Query. Every action persists to the database, then
 * refreshes daily data AND missions/challenges (logged habits credit them).
 */
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./auth";
import { todayKey } from "./wellness-store";
import { addDays, progressPct, sumBy, weekDates } from "./daily-metrics";
import { daily, loadDaily, RITUAL_ID, type DailyData, type Period } from "./data/daily-repo";

export const PERIODS: Period[] = ["morning", "midday", "evening"];

export function useDaily() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const today = todayKey();
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["daily", userId ?? "anon", today],
    queryFn: () => loadDaily(userId!, addDays(today, -35)),
    enabled: Boolean(userId),
    retry: 2,
    staleTime: 15_000,
  });

  /** Run a write, show feedback, refresh everything that could change. */
  const run = useCallback(
    async (write: (uid: string) => Promise<unknown>, success?: string, fail = "Couldn't save that. Please try again.") => {
      if (!userId) return false;
      setBusy(true);
      try {
        await write(userId);
        if (success) toast.success(success);
        return true;
      } catch (err) {
        console.error(err);
        toast.error(fail);
        return false;
      } finally {
        setBusy(false);
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["daily", userId] }),
          qc.invalidateQueries({ queryKey: ["wellness", userId] }),
        ]);
      }
    },
    [qc, userId],
  );

  const data: DailyData | undefined = query.data;

  const summary = useMemo(() => {
    if (!data) return null;
    const water = sumBy(data.hydration, today, (r) => r.local_date, (r) => r.amount_ml);
    const protein = sumBy(data.protein, today, (r) => r.local_date, (r) => Number(r.grams));
    const breathingSec = sumBy(data.breathing, today, (r) => r.local_date, (r) => r.duration_seconds);
    const personalToday = sumBy(data.personal, today, (r) => r.local_date, (r) => r.minutes);
    const week = weekDates(today);
    const personalWeek = data.personal.filter((r) => week.includes(r.local_date)).reduce((a, r) => a + r.minutes, 0);
    const prefs = data.prefs;
    const personalGoal = prefs?.personal_time_goal_min ?? null;
    const personalIsWeekly = prefs?.personal_time_goal_period === "weekly";
    const ritualStatus = Object.fromEntries(
      PERIODS.map((p) => {
        const acts = data.activities.filter((a) => a.ritual_id === RITUAL_ID[p]);
        const done = acts.filter((a) => data.activityDone.some((c) => c.activity_id === a.id && c.local_date === today)).length;
        const finished = data.ritualDone.some((r) => r.ritual_id === RITUAL_ID[p] && r.local_date === today);
        const checkedIn = data.periodCheckIns.some((c) => c.period === p && c.local_date === today);
        return [p, { done, total: acts.length, finished, checkedIn, state: finished ? "completed" : done || checkedIn ? "in-progress" : "pending" }];
      }),
    ) as Record<Period, { done: number; total: number; finished: boolean; checkedIn: boolean; state: "completed" | "in-progress" | "pending" }>;
    return {
      water, waterTarget: prefs?.water_target_ml ?? null, waterPct: progressPct(water, prefs?.water_target_ml),
      protein, proteinTarget: prefs?.protein_target_g ?? null, proteinPct: progressPct(protein, prefs?.protein_target_g),
      breathingMin: Math.round(breathingSec / 60), breathingCount: data.breathing.filter((b) => b.local_date === today).length,
      personalToday, personalWeek, personalGoal, personalIsWeekly,
      personalPct: progressPct(personalIsWeekly ? personalWeek : personalToday, personalGoal),
      ritualStatus,
    };
  }, [data, today]);

  return { data, summary, today, loading: query.isLoading, error: query.error as Error | null, busy, run, api: daily, userId };
}
