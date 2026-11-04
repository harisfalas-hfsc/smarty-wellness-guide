/**
 * useDevelopment(): goals, milestones, experiments, reviews and a year of
 * light habit history for the signed-in user, cached per user.
 */
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./auth";
import { todayKey } from "./wellness-store";
import { addDays } from "./daily-metrics";
import { dev, loadDevelopment } from "./data/development-repo";

export function useDevelopment() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const today = todayKey();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["development", userId ?? "anon", today],
    queryFn: () => loadDevelopment(userId!, addDays(today, -400)),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });
  const run = useCallback(async (write: (uid: string) => Promise<unknown>, success?: string) => {
    if (!userId) return false;
    setBusy(true);
    try {
      await write(userId);
      if (success) toast.success(success);
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save that. Please try again.");
      return false;
    } finally {
      setBusy(false);
      await qc.invalidateQueries({ queryKey: ["development"] });
    }
  }, [userId, qc]);
  return { data: query.data ?? null, loading: query.isLoading, error: query.error as Error | null, today, userId, busy, run, api: dev };
}
