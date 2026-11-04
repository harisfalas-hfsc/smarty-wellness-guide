import type { Challenge, CheckIn, Mission, NeedKey, Recommendation, WellnessState } from "./wellness-types";

/**
 * Recommendation foundation.
 *
 * This is deliberately a small, transparent rule set — NOT a pretend AI.
 * The real engine will eventually weigh: who the person is, how they are today,
 * what changed, when they are free, where they are, whether the action is
 * realistic, and what has worked before. The UI contract below is what the
 * future engine must return.
 */

export const SMARTY_APPS = {
  workout: { name: "SMARTY WORKOUT", claim: "Train Better", url: "https://smarty-workout-buddy.lovable.app" },
  diet: { name: "SMARTY DIET", claim: "Fuel Better", url: "https://smarty-meals-hub.lovable.app" },
  move: { name: "SMARTY MOVE", claim: "Move Better", url: "https://smarty-motion-pro.lovable.app" },
} as const;

const WELCOME: Recommendation = {
  id: "r-welcome",
  level: "primary",
  headline: "Start with a one-minute check-in.",
  action: "Tell Smarty how you are today.",
  reason: "Smarty needs a starting point before it can suggest anything realistic.",
  product: "wellness",
  ctaLabel: "CHECK IN",
};

export function buildRecommendations(state: WellnessState, checkIn: CheckIn | null): Recommendation[] {
  if (!checkIn) return [WELCOME];

  const list: Recommendation[] = [];

  if (checkIn.stress >= 4 || checkIn.needs.includes("calm") || checkIn.needs.includes("switch-off")) {
    list.push({
      id: "r-calm",
      level: "primary",
      headline: "Today, your biggest opportunity is recovery.",
      action: "Take a 15 minute walk outside without your phone.",
      reason: "You reported high stress today. Low-intensity movement lowers it without adding load.",
      product: "wellness",
      ctaLabel: "START",
    });
  } else if (checkIn.energy >= 4 || checkIn.needs.includes("move")) {
    list.push({
      id: "r-train",
      level: "primary",
      headline: "Today, your biggest opportunity is training.",
      action: "Use the energy you have and complete one session.",
      reason: "Your energy is good and your activity has been low. This is the right day to train.",
      product: "workout",
      ctaLabel: "START A WORKOUT",
      externalUrl: SMARTY_APPS.workout.url,
    });
  } else {
    list.push({
      id: "r-move",
      level: "primary",
      headline: "Today, your biggest opportunity is movement.",
      action: "Walk for 20 minutes after lunch.",
      reason: "Energy is moderate. A short walk is realistic today and keeps momentum.",
      product: "move",
      ctaLabel: "START",
      externalUrl: SMARTY_APPS.move.url,
    });
  }

  const openMission = state.missions.find((m) => !m.completed);
  if (openMission) {
    list.push({
      id: "r-mission",
      level: "secondary",
      headline: `Mission: ${openMission.title}`,
      action: `${openMission.target} — step ${openMission.step} of ${openMission.totalSteps}.`,
      reason: "Small, repeatable actions build the habit before the size of the action matters.",
      product: "wellness",
      ctaLabel: "OPEN MISSIONS",
    });
  }

  if (checkIn.sleep <= 2) {
    list.push({
      id: "r-sleep",
      level: "optional",
      headline: "Optional: protect tonight's sleep.",
      action: "Screens off 30 minutes before bed.",
      reason: "You reported poor sleep. Tomorrow's energy starts tonight.",
      product: "wellness",
      ctaLabel: "ADD TO TODAY",
    });
  } else {
    list.push({
      id: "r-nutrition",
      level: "optional",
      headline: "Optional: nutrition consistency.",
      action: "Prepare one meal at home today.",
      reason: "Consistency matters more than a perfect plan.",
      product: "diet",
      ctaLabel: "BUILD MY PLAN",
      externalUrl: SMARTY_APPS.diet.url,
    });
  }

  return list;
}

const NEED_MISSION: Partial<Record<NeedKey, string>> = {
  move: "m-walk",
  calm: "m-read",
  focus: "m-read",
  motivate: "m-train",
  connect: "m-call",
  "switch-off": "m-read",
};

const NEED_CHALLENGE: Partial<Record<NeedKey, string>> = {
  move: "c-stairs",
  calm: "c-outside",
  focus: "c-phone",
  motivate: "c-walk",
  connect: "c-call",
  "switch-off": "c-sleep",
  surprise: "c-cook",
};

function findByPreference<T extends { id: string }>(items: T[], preferredIds: string[]) {
  for (const id of preferredIds) {
    const match = items.find((item) => item.id === id);
    if (match) return match;
  }
  return items[0];
}

/** Select one clear action from today's answers instead of presenting an unrelated carousel. */
export function getTodaysMission(state: WellnessState, checkIn: CheckIn | null): Mission | undefined {
  const preferredIds = checkIn
    ? [
        ...checkIn.needs.map((need) => NEED_MISSION[need]).filter((id): id is string => Boolean(id)),
        ...(checkIn.stress >= 4 || checkIn.sleep <= 2 ? ["m-read"] : []),
        ...(checkIn.energy >= 4 ? ["m-train"] : []),
        "m-walk",
      ]
    : ["m-walk"];
  // Completed or paused missions never come back as recommendations.
  return findByPreference(state.missions.filter((m) => m.status !== "completed" && m.status !== "paused"), preferredIds);
}

/** Choose a separate, optional extra that reflects the same check-in. */
export function getTodaysChallenge(state: WellnessState, checkIn: CheckIn | null): Challenge | undefined {
  const preferredIds = checkIn
    ? [
        ...checkIn.needs.map((need) => NEED_CHALLENGE[need]).filter((id): id is string => Boolean(id)),
        ...(checkIn.sleep <= 2 ? ["c-sleep"] : []),
        ...(checkIn.stress >= 4 ? ["c-phone"] : []),
        "c-outside",
      ]
    : ["c-outside"];
  return findByPreference(state.challenges, preferredIds);
}
