import type { Period } from "./data/daily-repo";

export type Question =
  | { key: string; label: string; type: "scale"; low: string; high: string }
  | { key: string; label: string; type: "choice"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "text"; placeholder?: string };

const scale = (key: string, label: string, low = "Low", high = "High"): Question => ({ key, label, type: "scale", low, high });
const yesNo = (key: string, label: string): Question => ({
  key, label, type: "choice",
  options: [{ value: "yes", label: "Yes" }, { value: "partly", label: "Partly" }, { value: "no", label: "No" }],
});

export const RITUAL_META: Record<Period, { title: string; eyebrow: string; tone: "yellow" | "green" | "purple"; route: "/morning" | "/midday" | "/evening"; emoji: string; purpose: string }> = {
  morning: { title: "Morning Activation", eyebrow: "Start with intention", tone: "yellow", route: "/morning", emoji: "🌅", purpose: "Start your day with energy, clarity and one clear priority." },
  midday: { title: "Midday Reset", eyebrow: "A short pause", tone: "green", route: "/midday", emoji: "🌿", purpose: "Interrupt the build-up of stress, move a little and refocus. Five minutes is enough." },
  evening: { title: "Evening Unwind", eyebrow: "Close the day", tone: "purple", route: "/evening", emoji: "🌙", purpose: "Step away from the day, slow down and prepare for good sleep." },
};

export const PERIOD_QUESTIONS: Record<Period, Question[]> = {
  morning: [
    scale("feeling", "How are you feeling today?", "Low", "Great"),
    scale("energy", "How is your energy?"),
    scale("sleep", "How was your sleep?", "Poor", "Great"),
    scale("motivation", "How is your motivation?"),
    scale("stress", "How stressed do you feel?", "Calm", "Very"),
    { key: "priority", label: "What is your main priority today?", type: "text", placeholder: "One thing that matters most" },
  ],
  midday: [
    scale("energy", "How is your energy now?"),
    scale("stress", "How is your stress level?", "Calm", "Very"),
    scale("concentration", "How is your concentration?", "Scattered", "Sharp"),
    { key: "sitting", label: "How long have you been sitting or inactive?", type: "choice", options: [
      { value: "<30", label: "Under 30 min" }, { value: "30-60", label: "30–60 min" }, { value: "1-2h", label: "1–2 hours" }, { value: ">2h", label: "Over 2 hours" },
    ] },
    yesNo("break", "Have you taken a break today?"),
  ],
  evening: [
    scale("day", "How was your day overall?", "Hard", "Great"),
    scale("energy", "How was your energy?"),
    scale("stress", "How stressful was your day?", "Calm", "Very"),
    yesNo("priority_done", "Did you achieve your main priority?"),
    yesNo("personal_time", "Did you have enough personal time?"),
    scale("satisfaction", "How satisfied are you with your day?"),
  ],
};

/** Optional deeper check-in areas — answer any, skip the rest. */
export const EXTRA_SECTIONS: { key: string; title: string; questions: Question[] }[] = [
  { key: "physical", title: "Physical wellbeing", questions: [
    scale("activity", "Physical activity so far", "None", "Lots"),
    scale("mobility", "Movement and mobility", "Stiff", "Free"),
    scale("soreness", "Muscle soreness", "None", "Very sore"),
    scale("condition", "General physical condition", "Poor", "Great"),
  ] },
  { key: "mental", title: "Mental wellbeing", questions: [
    scale("clarity", "Mental clarity", "Foggy", "Clear"),
    scale("emotional", "Emotional wellbeing", "Low", "Good"),
  ] },
  { key: "lifestyle", title: "Lifestyle", questions: [
    yesNo("outdoor", "Spent time outdoors?"),
    yesNo("social", "Connected with someone?"),
    yesNo("reading", "Read something?"),
  ] },
];

export const REFLECTION: Question[] = [
  { key: "achieved", label: "One thing you achieved today", type: "text" },
  { key: "improve", label: "One thing you could improve", type: "text" },
  { key: "grateful", label: "One thing you are grateful for", type: "text" },
];

export const MORNING_INTENTION: Question[] = [
  { key: "intention", label: "Your intention for today", type: "text", placeholder: "e.g. Stay calm in meetings" },
  { key: "gratitude", label: "Optional: something you're glad about", type: "text" },
];

/** Midday personal reset: what do you need most right now? */
export const RESET_NEEDS: { key: string; label: string; emoji: string; suggestion: string; activityKind: "breathing" | "move" | "focus" | "outside" | "pause" }[] = [
  { key: "relax", label: "Relaxation", emoji: "🌊", suggestion: "Two minutes of slow breathing with long exhales.", activityKind: "breathing" },
  { key: "move", label: "Movement", emoji: "🚶", suggestion: "Stand up and walk or stretch for three minutes.", activityKind: "move" },
  { key: "focus", label: "Focus", emoji: "🎯", suggestion: "Box breathing for one minute, then pick one single next task.", activityKind: "focus" },
  { key: "energy", label: "Energy", emoji: "⚡", suggestion: "A glass of water and ten minutes of daylight outside.", activityKind: "outside" },
  { key: "break", label: "A mental break", emoji: "☁️", suggestion: "Five minutes away from screens. Look out of a window. Do nothing.", activityKind: "pause" },
];

/** Practical, human messages — rotated by day, never generic quotes. */
const MESSAGES: Record<Period, string[]> = {
  morning: [
    "You don't need a perfect day. You need one decision you'll keep. Pick it now.",
    "Your energy is limited. Spend the best of it on the thing you chose, before the day chooses for you.",
    "Drink water, move a little, decide your priority. The rest of the day gets easier from here.",
    "Nobody else is responsible for how today goes for you. Start small and start now.",
    "Ten good minutes now beat an hour of good intentions later.",
  ],
  midday: [
    "Stress builds quietly. A few minutes of pause now protects your whole afternoon.",
    "You've been giving your attention away all morning. Take a little back.",
    "Stand up. Breathe. Drink. Then choose the next single thing.",
  ],
  evening: [
    "Done is better than perfect. Notice what you did, not only what's left.",
    "The day is finished. What you carry into tonight is your choice.",
    "Consistency, not perfection. Showing up tonight counts.",
    "Rest is not a reward for finishing everything. It's how you'll do better tomorrow.",
  ],
};

export function messageFor(period: Period, date: string): string {
  const list = MESSAGES[period];
  const n = date.split("-").reduce((a, s) => a + Number(s), 0);
  return list[n % list.length]!;
}

export const CLOSING: Record<Period, string> = {
  morning: "Morning Activation done. You've started on purpose — now go live your priority.",
  midday: "Reset complete. Back to your afternoon with a clearer head.",
  evening: "Day closed. Whatever happened today, you showed up for yourself. Sleep well.",
};

export const PERSONAL_CATEGORIES = [
  { value: "reading", label: "Reading", emoji: "📖" },
  { value: "hobbies", label: "Hobbies", emoji: "🎨" },
  { value: "relaxation", label: "Relaxation", emoji: "🛋️" },
  { value: "outdoor", label: "Outdoors", emoji: "🌳" },
  { value: "learning", label: "Learning", emoji: "🧠" },
  { value: "development", label: "Personal growth", emoji: "🌱" },
  { value: "alone", label: "Time alone", emoji: "🧘" },
  { value: "other", label: "Other", emoji: "✨" },
] as const;

export const BREATHING_PATTERNS = [
  { key: "relax", label: "Relax", purpose: "Calm down and slow your heart rate.", steps: [{ label: "Breathe in", s: 4 }, { label: "Breathe out slowly", s: 6 }] },
  { key: "box", label: "Focus", purpose: "Box breathing to clear your head.", steps: [{ label: "Breathe in", s: 4 }, { label: "Hold", s: 4 }, { label: "Breathe out", s: 4 }, { label: "Hold", s: 4 }] },
  { key: "balance", label: "Balance", purpose: "Even breathing for general wellbeing.", steps: [{ label: "Breathe in", s: 5 }, { label: "Breathe out", s: 5 }] },
] as const;
