import type { MoodKey, NeedKey } from "./wellness-types";

export const MOODS: { key: MoodKey; label: string; emoji: string }[] = [
  { key: "great", label: "Great", emoji: "😄" },
  { key: "good", label: "Good", emoji: "🙂" },
  { key: "okay", label: "Okay", emoji: "😐" },
  { key: "not-great", label: "Not great", emoji: "😕" },
  { key: "bad", label: "Bad", emoji: "😞" },
];

export const NEEDS: { key: NeedKey; label: string; emoji: string }[] = [
  { key: "move", label: "Move me", emoji: "🚶" },
  { key: "calm", label: "Calm me", emoji: "🌿" },
  { key: "focus", label: "Focus me", emoji: "🎯" },
  { key: "motivate", label: "Motivate me", emoji: "🔥" },
  { key: "connect", label: "Connect me", emoji: "💬" },
  { key: "switch-off", label: "Help me switch off", emoji: "🌙" },
  { key: "surprise", label: "Surprise me", emoji: "✨" },
];
