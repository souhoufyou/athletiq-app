import type { CalorieEstimate, PlannedSession, SessionActivityType, SessionFeedback } from "@/types/training";

const baseMetByActivity: Record<SessionActivityType, number> = {
  muscu: 4.5,
  cardio: 6.2,
  judo: 9,
  marche: 3.4
};

export function estimateCalories({
  durationMs,
  feedback,
  session,
  weightKg
}: {
  durationMs: number;
  feedback: SessionFeedback;
  session: PlannedSession;
  weightKg: number;
}): CalorieEstimate {
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
  const intensity = clamp(feedback.difficulty, 1, 10);
  const activityType = detectActivityType(session);
  const intensityFactor = 0.75 + intensity * 0.05;
  const met = baseMetByActivity[activityType] * intensityFactor;
  const calories = Math.max(1, Math.round((met * 3.5 * weightKg * durationMinutes) / 200));

  return {
    activityType,
    calories,
    durationMinutes,
    intensity,
    weightKg,
    label: "Estimation approximative",
    note: "Calcul indicatif base sur duree, poids, type de seance et intensite ressentie. Ce n'est pas une mesure exacte."
  };
}

export function detectActivityType(session: PlannedSession): SessionActivityType {
  const text = `${session.title} ${session.focus} ${session.exercises
    .map((exercise) => `${exercise.name} ${exercise.target} ${exercise.cue}`)
    .join(" ")}`.toLowerCase();

  if (/judo/.test(text) && !/judo soir/.test(text)) {
    return "judo";
  }

  if (/marche|walk/.test(text) && !/developpe|rowing|presse|curl|triceps|machine/.test(text)) {
    return "marche";
  }

  if (/cardio|zone 2|tapis|rameur|stairmaster|intervalles|souffle/.test(text)) {
    return "cardio";
  }

  return "muscu";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
