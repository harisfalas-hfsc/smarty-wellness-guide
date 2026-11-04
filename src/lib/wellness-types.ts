/**
 * Smarty Wellness — data foundation.
 *
 * These types describe every entity the product needs. Intelligence
 * (recommendation engine, coach reasoning, life-gap engine) is NOT implemented
 * yet; these structures exist so it can be added without reshaping the app.
 */

export type Scale5 = 1 | 2 | 3 | 4 | 5;

export type MoodKey = "great" | "good" | "okay" | "not-great" | "bad";

export type NeedKey =
  | "move"
  | "calm"
  | "focus"
  | "motivate"
  | "connect"
  | "switch-off"
  | "surprise";

export interface CheckIn {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  mood: MoodKey;
  energy: Scale5;
  stress: Scale5;
  motivation: Scale5;
  sleep: Scale5;
  needs: NeedKey[];
  note?: string;
}

export interface WellnessProfile {
  personal: {
    name: string;
    age: string;
    gender: string;
    relationship: string;
    children: string;
    interests: string;
    goals: string;
  };
  dailyLife: {
    occupation: string;
    workingHours: string;
    commute: string;
    responsibilities: string;
    typicalSchedule: string;
    freeTime: string;
    familyResponsibilities: string;
  };
  physical: {
    activityLevel: string;
    trainingExperience: string;
    fitnessLevel: string;
    limitations: string;
    pain: string;
    energy: string;
  };
  nutrition: {
    habits: string;
    preferences: string;
    goals: string;
    restrictions: string;
    consistency: string;
  };
  mental: {
    stress: string;
    mood: string;
    motivation: string;
    socialConnection: string;
    outdoor: string;
    hobbies: string;
    reading: string;
    entertainment: string;
    personalTime: string;
    sleepRoutine: string;
  };
}

export type SmartyProduct = "wellness" | "workout" | "diet" | "move";

export interface Recommendation {
  id: string;
  /** Priority: primary is visually dominant, only one at a time. */
  level: "primary" | "secondary" | "optional";
  headline: string; // "Today, your biggest opportunity is movement."
  action: string; // "Walk for 20 minutes after lunch."
  reason: string; // human-readable why
  product: SmartyProduct;
  ctaLabel: string;
  /** Set when the action opens another Smarty product. */
  externalUrl?: string;
}

export interface Mission {
  id: string;
  title: string;
  detail: string;
  area:
    | "movement" | "training" | "nutrition" | "mind" | "social" | "personal"
    | "sleep" | "hydration" | "development";
  /** Progressive habit ladder — current step and its target. */
  step: number;
  totalSteps: number;
  target: string;
  completed: boolean;
  completedDate?: string;
  /** available = not started; completed = finished every step. */
  status?: "available" | "active" | "paused" | "completed";
  objective?: string;
  completionCriteria?: string;
  /** "manual" or the habit that credits it automatically. */
  metric?: string;
  daysPerStep?: number;
  /** Days completed at the current step. */
  stepDays?: number;
  totalCompletions?: number;
}

export interface Challenge {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  completedDate?: string;
  category?: string;
  cadence?: "daily" | "weekly" | "short";
  instructions?: string;
  objective?: string;
  metric?: string;
  goal?: number | null;
  targetDays?: number;
  durationDays?: number;
}

export interface BucketGoal {
  id: string;
  title: string;
  why: string;
  category: string;
  targetDate: string;
  progress: number; // 0-100
}

export type TrendStatus = "improving" | "stable" | "needs-attention" | "changed";

export interface TrendItem {
  label: string;
  then: string;
  now: string;
  status: TrendStatus;
}

export interface WellnessReview {
  id: string;
  periodLabel: string;
  summary: string;
  trends: TrendItem[];
}

export interface Experiment {
  id: string;
  title: string;
  hypothesis: string;
  days: number;
  daysDone: number;
  status: "active" | "completed" | "available";
  measures: string[];
}

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  at: string;
}

export interface WellnessState {
  onboarded: boolean;
  profile: WellnessProfile;
  checkIns: CheckIn[];
  missions: Mission[];
  challenges: Challenge[];
  bucketList: BucketGoal[];
  experiments: Experiment[];
  coachMessages: CoachMessage[];
  completedActions: string[];
}
