import type { PlannedSession } from "@/types/training";
import { getSessionExerciseCategory, type SessionExerciseCategory } from "@/components/session/SessionExerciseIcon";

/**
 * Pick a single dominant category for a planned session, used to drive the
 * icon and the type label shown on the home screen.
 *
 *  1. Title keywords win (Push / Pull / Legs / Upper / Lower / Cardio / Abdos / Mobilité)
 *  2. Otherwise, fall back to a per-exercise vote
 */
export function getSessionCategory(session: PlannedSession): SessionExerciseCategory {
  const titleCategory = categoryFromTitle(session.title) ?? categoryFromTitle(session.focus);
  if (titleCategory) return titleCategory;

  const scores: Partial<Record<SessionExerciseCategory, number>> = {};
  for (const exercise of session.exercises) {
    const category = getSessionExerciseCategory(exercise);
    if (category === "default") continue;
    scores[category] = (scores[category] ?? 0) + 1;
  }

  let best: SessionExerciseCategory = "default";
  let bestScore = 0;
  for (const [category, score] of Object.entries(scores) as Array<[SessionExerciseCategory, number]>) {
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return best;
}

function categoryFromTitle(text: string | undefined): SessionExerciseCategory | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/\b(push|poussée|pouss[eé]e)\b/.test(t)) return "push";
  if (/\b(pull|tirage|traction)\b/.test(t)) return "pull";
  if (/\b(upper|haut\s+du\s+corps)\b/.test(t)) return "upper";
  if (/\b(lower|bas\s+du\s+corps)\b/.test(t)) return "lower";
  if (/\b(legs|jambes|cuisses|fessiers)\b/.test(t)) return "legs";
  if (/\b(cardio|tapis|marche|course|hiit|endurance)\b/.test(t)) return "cardio";
  if (/\b(abdos|core|gainage|abdominaux)\b/.test(t)) return "core";
  if (/\b(mobilit[eé]|stretching|étirement|etirement|yoga)\b/.test(t)) return "mobility";
  return null;
}

export function getSessionTypeLabel(category: SessionExerciseCategory): string {
  switch (category) {
    case "push": return "Push";
    case "pull": return "Pull";
    case "legs": return "Jambes";
    case "upper": return "Upper";
    case "lower": return "Lower";
    case "cardio": return "Cardio";
    case "core": return "Abdos / Core";
    case "mobility": return "Mobilité";
    case "default": return "Renforcement";
  }
}

/**
 * Best-effort upper bound of a session duration string in milliseconds.
 * Accepts "45-55 min", "45 min", "1h", "1h30", etc. Falls back to 45 min.
 */
export function parseDurationToMs(duration: string | undefined): number {
  if (!duration) return 45 * 60_000;
  const text = duration.toLowerCase().replace(/–/g, "-");

  const range = text.match(/(\d+)\s*-\s*(\d+)\s*min/);
  if (range) return Number(range[2]) * 60_000;

  const minutes = text.match(/(\d+)\s*min/);
  if (minutes) return Number(minutes[1]) * 60_000;

  const hMinutes = text.match(/(\d+)\s*h\s*(\d+)?/);
  if (hMinutes) {
    return Number(hMinutes[1]) * 3_600_000 + Number(hMinutes[2] ?? 0) * 60_000;
  }

  return 45 * 60_000;
}
