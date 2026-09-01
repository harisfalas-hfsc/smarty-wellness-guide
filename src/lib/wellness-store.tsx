import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BucketGoal,
  Challenge,
  CheckIn,
  CoachMessage,
  Mission,
  WellnessProfile,
  WellnessState,
} from "./wellness-types";

const STORAGE_KEY = "smarty-wellness:v1";

const emptyProfile: WellnessProfile = {
  personal: {
    name: "",
    age: "",
    gender: "",
    relationship: "",
    children: "",
    interests: "",
    goals: "",
  },
  dailyLife: {
    occupation: "",
    workingHours: "",
    commute: "",
    responsibilities: "",
    typicalSchedule: "",
    freeTime: "",
    familyResponsibilities: "",
  },
  physical: {
    activityLevel: "",
    trainingExperience: "",
    fitnessLevel: "",
    limitations: "",
    pain: "",
    energy: "",
  },
  nutrition: {
    habits: "",
    preferences: "",
    goals: "",
    restrictions: "",
    consistency: "",
  },
  mental: {
    stress: "",
    mood: "",
    motivation: "",
    socialConnection: "",
    outdoor: "",
    hobbies: "",
    reading: "",
    entertainment: "",
    personalTime: "",
    sleepRoutine: "",
  },
};

const starterMissions: Mission[] = [
  {
    id: "m-walk",
    title: "Walk after lunch",
    detail: "A short walk after your main meal steadies energy for the afternoon.",
    area: "movement",
    step: 1,
    totalSteps: 4,
    target: "10 minutes",
    completed: false,
  },
  {
    id: "m-read",
    title: "Read before bed",
    detail: "Replaces screen time and helps your sleep routine settle.",
    area: "personal",
    step: 1,
    totalSteps: 4,
    target: "2 pages",
    completed: false,
  },
  {
    id: "m-train",
    title: "Train this week",
    detail: "Consistency first. Two sessions is enough to build the habit.",
    area: "training",
    step: 1,
    totalSteps: 3,
    target: "2 sessions",
    completed: false,
  },
  {
    id: "m-call",
    title: "Call someone you love",
    detail: "Social connection is one of the strongest wellbeing levers.",
    area: "social",
    step: 1,
    totalSteps: 3,
    target: "1 call",
    completed: false,
  },
  {
    id: "m-home-meal",
    title: "Prepare meals at home",
    detail: "Cooking at home improves nutrition consistency without a diet.",
    area: "nutrition",
    step: 1,
    totalSteps: 4,
    target: "2 meals",
    completed: false,
  },
];

const starterChallenges: Challenge[] = [
  { id: "c-stairs", title: "Take the stairs", detail: "Every time today.", completed: false },
  { id: "c-walk", title: "Walk instead of driving", detail: "One short trip.", completed: false },
  { id: "c-outside", title: "20 minutes outside", detail: "Daylight, any pace.", completed: false },
  { id: "c-pages", title: "Read five pages", detail: "Anything you enjoy.", completed: false },
  { id: "c-call", title: "Call someone", detail: "Someone you have not spoken to lately.", completed: false },
  { id: "c-phone", title: "10 minutes without your phone", detail: "Leave it in another room.", completed: false },
  { id: "c-cook", title: "Cook something healthy", detail: "Simple is fine.", completed: false },
  { id: "c-sleep", title: "Go to bed 30 minutes earlier", detail: "Start the wind-down early.", completed: false },
];

const defaultState: WellnessState = {
  onboarded: false,
  profile: emptyProfile,
  checkIns: [],
  missions: starterMissions,
  challenges: starterChallenges,
  bucketList: [],
  experiments: [
    {
      id: "e-walk",
      title: "Walk 15 minutes after lunch",
      hypothesis: "Afternoon energy improves and stress drops.",
      days: 7,
      daysDone: 0,
      status: "available",
      measures: ["Energy", "Mood", "Stress", "Motivation"],
    },
    {
      id: "e-sleep",
      title: "Screens off 30 minutes before bed",
      hypothesis: "Sleep quality and morning mood improve.",
      days: 10,
      daysDone: 0,
      status: "available",
      measures: ["Sleep", "Mood", "Energy"],
    },
  ],
  coachMessages: [],
  completedActions: [],
};

interface WellnessContextValue {
  state: WellnessState;
  hydrated: boolean;
  todayCheckIn: CheckIn | null;
  saveCheckIn: (checkIn: Omit<CheckIn, "id" | "date">) => void;
  updateProfile: (
    section: keyof WellnessProfile,
    values: Partial<WellnessProfile[keyof WellnessProfile]>,
  ) => void;
  completeOnboarding: () => void;
  toggleMission: (id: string) => void;
  toggleChallenge: (id: string) => void;
  addBucketGoal: (goal: Omit<BucketGoal, "id">) => void;
  removeBucketGoal: (id: string) => void;
  addCoachMessage: (message: Omit<CoachMessage, "id" | "at">) => void;
  reset: () => void;
}

const WellnessContext = createContext<WellnessContextValue | null>(null);

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function WellnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WellnessState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as WellnessState & {
          checkIns?: Array<CheckIn & { need?: CheckIn["needs"][number] | null }>;
        };
        setState({
          ...defaultState,
          ...stored,
          checkIns: (stored.checkIns ?? []).map((checkIn) => ({
            ...checkIn,
            needs:
              checkIn.needs ?? (checkIn.need ? [checkIn.need] : []),
          })),
        });
      }
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const saveCheckIn = useCallback<WellnessContextValue["saveCheckIn"]>((checkIn) => {
    const date = todayKey();
    setState((s) => ({
      ...s,
      checkIns: [
        { ...checkIn, id: makeId("ci"), date },
        ...s.checkIns.filter((c) => c.date !== date),
      ],
    }));
  }, []);

  const updateProfile = useCallback<WellnessContextValue["updateProfile"]>((section, values) => {
    setState((s) => ({
      ...s,
      profile: { ...s.profile, [section]: { ...s.profile[section], ...values } },
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({ ...s, onboarded: true }));
  }, []);

  const toggleMission = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      missions: s.missions.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
      completedActions: s.completedActions.includes(id)
        ? s.completedActions.filter((a) => a !== id)
        : [...s.completedActions, id],
    }));
  }, []);

  const toggleChallenge = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      challenges: s.challenges.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c)),
      completedActions: s.completedActions.includes(id)
        ? s.completedActions.filter((a) => a !== id)
        : [...s.completedActions, id],
    }));
  }, []);

  const addBucketGoal = useCallback<WellnessContextValue["addBucketGoal"]>((goal) => {
    setState((s) => ({ ...s, bucketList: [{ ...goal, id: makeId("bg") }, ...s.bucketList] }));
  }, []);

  const removeBucketGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, bucketList: s.bucketList.filter((g) => g.id !== id) }));
  }, []);

  const addCoachMessage = useCallback<WellnessContextValue["addCoachMessage"]>((message) => {
    setState((s) => ({
      ...s,
      coachMessages: [
        ...s.coachMessages,
        { ...message, id: makeId("cm"), at: new Date().toISOString() },
      ],
    }));
  }, []);

  const reset = useCallback(() => setState(defaultState), []);

  const todayCheckIn = useMemo(
    () => state.checkIns.find((c) => c.date === todayKey()) ?? null,
    [state.checkIns],
  );

  const value = useMemo<WellnessContextValue>(
    () => ({
      state,
      hydrated,
      todayCheckIn,
      saveCheckIn,
      updateProfile,
      completeOnboarding,
      toggleMission,
      toggleChallenge,
      addBucketGoal,
      removeBucketGoal,
      addCoachMessage,
      reset,
    }),
    [
      state,
      hydrated,
      todayCheckIn,
      saveCheckIn,
      updateProfile,
      completeOnboarding,
      toggleMission,
      toggleChallenge,
      addBucketGoal,
      removeBucketGoal,
      addCoachMessage,
      reset,
    ],
  );

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  const ctx = useContext(WellnessContext);
  if (!ctx) throw new Error("useWellness must be used inside WellnessProvider");
  return ctx;
}
