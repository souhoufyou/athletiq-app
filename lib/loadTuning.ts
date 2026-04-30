import type { Exercise, UserSettings } from "@/types/training";

const BIAS_STEP = 0.04;

export type LoadFeedback = "correct" | "too-heavy" | "too-light";

export function applyLoadFeedbackToSettings(
  settings: UserSettings,
  exercise: Exercise,
  feedback: LoadFeedback
): UserSettings {
  const pattern = exercise.taxonomy?.pattern;
  if (!pattern || feedback === "correct") return settings;

  const current = settings.loadBiasByPattern?.[pattern] ?? 0;
  const nextBias = clamp(current + (feedback === "too-light" ? BIAS_STEP : -BIAS_STEP), -0.18, 0.18);

  return {
    ...settings,
    loadBiasByPattern: {
      ...(settings.loadBiasByPattern ?? {}),
      [pattern]: nextBias
    }
  };
}

export function tuneExerciseLoad(exercise: Exercise, feedback: LoadFeedback): Exercise {
  if (feedback === "correct" || !exercise.plannedLoad) return exercise;

  const tunedLoad = tuneLoadDisplay(exercise.plannedLoad, feedback);
  return tunedLoad ? { ...exercise, plannedLoad: tunedLoad } : exercise;
}

function tuneLoadDisplay(display: string, feedback: Exclude<LoadFeedback, "correct">): string | undefined {
  const bilateral = display.match(/^(env\.\s*)?2 x (\d+(?:[,.]\d+)?) kg$/i);
  if (bilateral) {
    const prefix = bilateral[1] ?? "";
    const current = Number(bilateral[2].replace(",", "."));
    const next = tuneValue(current, feedback);
    return `${prefix}2 x ${formatNumber(next)} kg`;
  }

  const perArm = display.match(/^(env\.\s*)?(\d+(?:[,.]\d+)?) kg \/ (bras|cote)$/i);
  if (perArm) {
    const prefix = perArm[1] ?? "";
    const current = Number(perArm[2].replace(",", "."));
    const next = tuneValue(current, feedback);
    return `${prefix}${formatNumber(next)} kg / ${perArm[3]}`;
  }

  const standard = display.match(/^(env\.\s*)?(\d+(?:[,.]\d+)?) kg$/i);
  if (standard) {
    const prefix = standard[1] ?? "";
    const current = Number(standard[2].replace(",", "."));
    const next = tuneValue(current, feedback);
    return `${prefix}${formatNumber(next)} kg`;
  }

  return undefined;
}

function tuneValue(current: number, feedback: Exclude<LoadFeedback, "correct">): number {
  const factor = feedback === "too-light" ? 1.075 : 0.925;
  return roundToNearest(Math.max(2.5, current * factor), current >= 40 ? 5 : 2.5);
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
