/**
 * Smarty Wellness state. The database (Lovable Cloud) is the source of truth;
 * TanStack Query caches it per signed-in user. The useWellness() interface is
 * unchanged so pages keep working. Writes are optimistic with rollback.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./auth";
import { deviceTimeZone, localDateKey } from "./dates";
import * as repo from "./data/wellness-repo";
import type { BucketGoal, CheckIn, CoachMessage, WellnessProfile, WellnessState } from "./wellness-types";

export const LEGACY_STORAGE_KEY = "smarty-wellness:v1";

const emptyState: WellnessState = {
  onboarded: false,
  profile: repo.rowToProfile(null),
  checkIns: [],
  missions: [],
  challenges: [],
  bucketList: [],
  experiments: [],
  coachMessages: [],
  completedActions: [],
};

interface WellnessContextValue {
  state: WellnessState;
  hydrated: boolean;
  error: Error | null;
  todayCheckIn: CheckIn | null;
  saveCheckIn: (checkIn: Omit<CheckIn, "id" | "date">) => void;
  updateProfile: (
    section: keyof WellnessProfile,
    values: Partial<WellnessProfile[keyof WellnessProfile]>,
  ) => void;
  completeOnboarding: () => void;
  toggleMission: (id: string) => void;
  toggleChallenge: (id: string) => void;
  setMissionStatus: (id: string, status: "active" | "paused") => void;
  addBucketGoal: (goal: Omit<BucketGoal, "id">) => void;
  removeBucketGoal: (id: string) => void;
  addCoachMessage: (message: Omit<CoachMessage, "id" | "at">) => void;
  reset: () => void;
}

const WellnessContext = createContext<WellnessContextValue | null>(null);

/** The user's LOCAL calendar date (YYYY-MM-DD), not the UTC date. */
export function todayKey() {
  return localDateKey();
}

function tempId(prefix: string) {
  return `${prefix}-tmp-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export const wellnessQueryKey = (userId: string) => ["wellness", userId] as const;

export function WellnessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  // Clear any previous account's data the moment the signed-in user changes.
  const prevUser = useRef<string | null>(userId);
  useEffect(() => {
    // Only clear on sign-out or account switch, not on the first sign-in load.
    if (prevUser.current !== userId && prevUser.current !== null) {
      qc.removeQueries({ queryKey: ["wellness"] });
      qc.removeQueries({ queryKey: ["daily"] });
      prevUser.current = userId;
    }
  }, [userId, qc]);

  const query = useQuery({
    queryKey: wellnessQueryKey(userId ?? "anon"),
    queryFn: () => repo.loadWellnessState(userId!),
    enabled: Boolean(userId),
    retry: 2,
    staleTime: 30_000,
  });

  const state = userId && query.data ? query.data : emptyState;

  /** Optimistically apply `update`, persist with `write`, roll back on failure. */
  const mutate = useCallback(
    (update: (s: WellnessState) => WellnessState, write: (uid: string) => Promise<unknown>, failMsg: string) => {
      if (!userId) return;
      const key = wellnessQueryKey(userId);
      const previous = qc.getQueryData<WellnessState>(key);
      if (previous) qc.setQueryData(key, update(previous));
      write(userId)
        .catch((err: unknown) => {
          console.error(err);
          if (previous) qc.setQueryData(key, previous);
          toast.error(failMsg);
        })
        .finally(() => void qc.invalidateQueries({ queryKey: key }));
    },
    [qc, userId],
  );

  const saveCheckIn = useCallback<WellnessContextValue["saveCheckIn"]>(
    (checkIn) => {
      const date = todayKey();
      mutate(
        (s) => ({ ...s, checkIns: [{ ...checkIn, id: tempId("ci"), date }, ...s.checkIns.filter((c) => c.date !== date)] }),
        (uid) => repo.upsertCheckIn(uid, date, checkIn),
        "Couldn't save your check-in. Please try again.",
      );
    },
    [mutate],
  );

  const updateProfile = useCallback<WellnessContextValue["updateProfile"]>(
    (section, values) => {
      mutate(
        (s) => ({ ...s, profile: { ...s.profile, [section]: { ...s.profile[section], ...values } } }),
        (uid) => repo.upsertProfileSection(uid, section, values),
        "Couldn't save your profile. Please try again.",
      );
    },
    [mutate],
  );

  const completeOnboarding = useCallback(() => {
    mutate((s) => ({ ...s, onboarded: true }), (uid) => repo.setOnboarded(uid, deviceTimeZone()), "Couldn't finish onboarding.");
  }, [mutate]);

  const toggleMission = useCallback(
    (id: string) => {
      const today = todayKey();
      const current = qc.getQueryData<WellnessState>(wellnessQueryKey(userId ?? "anon"))?.missions.find((m) => m.id === id);
      const undo = Boolean(current?.completed && current.completedDate === today);
      mutate(
        (s) => ({
          ...s,
          missions: s.missions.map((m) => {
            if (m.id !== id) return m;
            if (!undo) return { ...m, completed: true, completedDate: today, status: m.status === "available" ? "active" : m.status };
            const { completedDate: _c, ...rest } = m;
            return { ...rest, completed: false };
          }),
        }),
        (uid) => repo.setMissionDone(uid, id, today, !undo),
        "Couldn't update that mission.",
      );
    },
    [mutate, qc, userId],
  );

  const toggleChallenge = useCallback(
    (id: string) => {
      const today = todayKey();
      const current = qc.getQueryData<WellnessState>(wellnessQueryKey(userId ?? "anon"))?.challenges.find((c) => c.id === id);
      const undo = Boolean(current?.completed && current.completedDate === today);
      mutate(
        (s) => ({
          ...s,
          challenges: s.challenges.map((c) => {
            if (c.id !== id) return c;
            if (!undo) return { ...c, completed: true, completedDate: today };
            const { completedDate: _c, ...rest } = c;
            return { ...rest, completed: false };
          }),
        }),
        (uid) => repo.setChallengeDone(uid, id, today, !undo),
        "Couldn't update that challenge.",
      );
    },
    [mutate, qc, userId],
  );

  const setMissionStatus = useCallback(
    (id: string, status: "active" | "paused") => {
      mutate(
        (s) => ({ ...s, missions: s.missions.map((m) => (m.id === id ? { ...m, status } : m)) }),
        (uid) => repo.setMissionStatus(uid, id, status),
        "Couldn't update that mission.",
      );
    },
    [mutate],
  );

  const addBucketGoal = useCallback<WellnessContextValue["addBucketGoal"]>(
    (goal) => {
      mutate(
        (s) => ({ ...s, bucketList: [{ ...goal, id: tempId("bg") }, ...s.bucketList] }),
        (uid) => repo.insertBucketGoal(uid, goal),
        "Couldn't save that goal.",
      );
    },
    [mutate],
  );

  const removeBucketGoal = useCallback(
    (id: string) => {
      mutate(
        (s) => ({ ...s, bucketList: s.bucketList.filter((g) => g.id !== id) }),
        (uid) => repo.deleteBucketGoal(uid, id),
        "Couldn't remove that goal.",
      );
    },
    [mutate],
  );

  const addCoachMessage = useCallback<WellnessContextValue["addCoachMessage"]>(
    (message) => {
      mutate(
        (s) => ({ ...s, coachMessages: [...s.coachMessages, { ...message, id: tempId("cm"), at: new Date().toISOString() }] }),
        (uid) => repo.insertCoachMessage(uid, message),
        "Couldn't save that message.",
      );
    },
    [mutate],
  );

  const reset = useCallback(() => {
    mutate(
      (s) => ({ ...emptyState, missions: s.missions.map(({ completedDate: _c, ...m }) => ({ ...m, completed: false })), challenges: s.challenges.map(({ completedDate: _c, ...c }) => ({ ...c, completed: false })), experiments: s.experiments.map((e) => ({ ...e, status: "available" as const, daysDone: 0 })) }),
      (uid) => repo.clearAllWellnessData(uid),
      "Couldn't clear your data.",
    );
  }, [mutate]);

  const today = todayKey();
  const todayCheckIn = useMemo(() => state.checkIns.find((c) => c.date === today) ?? null, [state.checkIns, today]);

  const value = useMemo<WellnessContextValue>(
    () => ({
      state,
      hydrated: Boolean(userId) && query.isSuccess,
      error: (query.error as Error | null) ?? null,
      todayCheckIn,
      saveCheckIn,
      updateProfile,
      completeOnboarding,
      toggleMission,
      toggleChallenge,
      setMissionStatus,
      addBucketGoal,
      removeBucketGoal,
      addCoachMessage,
      reset,
    }),
    [state, userId, query.isSuccess, query.error, todayCheckIn, saveCheckIn, updateProfile, completeOnboarding, toggleMission, toggleChallenge, setMissionStatus, addBucketGoal, removeBucketGoal, addCoachMessage, reset],
  );

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  const ctx = useContext(WellnessContext);
  if (!ctx) throw new Error("useWellness must be used inside WellnessProvider");
  return ctx;
}
