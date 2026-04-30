import type { Exercise, UserSettings } from "@/types/training";

export function rememberExerciseSwap(
  settings: UserSettings,
  originalExercise: Exercise,
  replacement: Exercise
): UserSettings {
  if (!originalExercise.id || !replacement.id || originalExercise.id === replacement.id) {
    return settings;
  }

  return {
    ...settings,
    exerciseSwapPreferences: {
      ...(settings.exerciseSwapPreferences ?? {}),
      [originalExercise.id]: replacement.id
    }
  };
}

export function getRememberedSwapId(
  settings: UserSettings,
  exerciseId: string
): string | undefined {
  const remembered = settings.exerciseSwapPreferences?.[exerciseId];
  return typeof remembered === "string" && remembered.trim().length > 0 ? remembered : undefined;
}
