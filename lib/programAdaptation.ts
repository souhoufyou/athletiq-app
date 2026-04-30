import type {
  CompletedSession,
  Exercise,
  PlannedSession,
  ProgressionDecision,
  UserSettings
} from "@/types/training";
import { normalizeExerciseV2 } from "@/lib/programSchema";
import { getTrainingTrendReport } from "@/lib/trainingTrends";

type AdaptationPressure = "easy" | "hard" | "pain" | "normal";
type ExerciseSignal = {
  downCount: number;
  hardCount: number;
  maintainCount: number;
  painCount: number;
};

export const GLOBAL_DELOAD_NOTE = "Deload automatique: semaine allegee sur l'ensemble du programme.";
export const GLOBAL_DELOAD_GUIDE_NOTE = "Objectif du cycle: recuperer, garder une execution propre et laisser revenir les sensations.";

/**
 * Applies session feedback beyond the exercise just completed.
 * This is intentionally conservative: it adjusts the next exposure, not the whole mesocycle.
 */
export function adaptProgramAfterSession(
  program: PlannedSession[],
  completed: CompletedSession,
  settings: UserSettings,
  history: CompletedSession[] = [completed]
): PlannedSession[] {
  if (program.length === 0) return program;

  const completedIndex = program.findIndex((session) => session.id === completed.sessionId);
  if (completedIndex < 0) return program;

  const pressure = getAdaptationPressure(completed);
  const nextIndex = (completedIndex + 1) % program.length;
  const replacementByExercise = getReplacementByExercise(completed);
  const trendReport = getTrainingTrendReport(history, program, settings);
  const shouldDeload =
    trendReport.items.some((trend) => trend.action === "deload_next_week" || trend.action === "protect_recovery");
  const globalDeloadAlreadyApplied = program.some((session) => session.notes?.includes(GLOBAL_DELOAD_NOTE));
  const applyGlobalDeload = shouldDeload && !globalDeloadAlreadyApplied;
  const hasGoalDrift = trendReport.items.some((trend) => trend.action === "adjust_goal");
  const exerciseSignals = getExerciseSignals(history);
  const painExerciseIds = new Set(
    Object.values(completed.logs)
      .filter((log) => log.status === "pain")
      .map((log) => log.exerciseId)
  );

  if (
    pressure === "normal" &&
    replacementByExercise.size === 0 &&
    painExerciseIds.size === 0 &&
    !shouldDeload &&
    !hasGoalDrift &&
    exerciseSignals.size === 0
  ) {
    return program;
  }

  return program.map((session, index) => {
    const isNextSession = index === nextIndex;
    const isTrendDeloadSession = shouldDeload && isUpcomingSession(index, completedIndex, program.length, 2);
    const isGlobalDeloadSession = applyGlobalDeload && isUpcomingSession(index, completedIndex, program.length, Math.max(1, program.length - 1));
    const notes = new Set(session.notes ?? []);
    let intensity = session.intensity;

    if (isNextSession || isTrendDeloadSession) {
      if (pressure === "hard") {
        intensity = stepDownIntensity(intensity);
        notes.add("Adaptation automatique: derniere seance trop dure, volume reduit sur cette seance.");
      }

      if (pressure === "pain") {
        intensity = stepDownIntensity(intensity);
        notes.add("Adaptation automatique: douleur signalee, intensite reduite et variantes plus stables.");
      }

      if (pressure === "easy" && settings.cautionLevel !== "prudent") {
        notes.add("Adaptation automatique: derniere seance facile, progression possible si les sensations restent bonnes.");
      }

      if (isTrendDeloadSession) {
        intensity = stepDownIntensity(intensity);
        notes.add("Adaptation tendance: fatigue repetee, seance allegee pour recuperer avant de recharger.");
      }

      if (hasGoalDrift && settings.primaryGoal === "perte-gras") {
        notes.add("Adaptation objectif: poids stable en perte de gras, cardio doux augmente legerement.");
      }

      if (hasGoalDrift && settings.primaryGoal === "prise-masse") {
        notes.add("Adaptation objectif: poids trop stable en prise de masse, garder l'energie pour les charges et la recuperation.");
      }
    }

    if (isGlobalDeloadSession) {
      intensity = stepDownIntensity(stepDownIntensity(intensity));
      notes.add(GLOBAL_DELOAD_NOTE);
      notes.add(GLOBAL_DELOAD_GUIDE_NOTE);
    } else if (!shouldDeload && notes.has(GLOBAL_DELOAD_NOTE)) {
      notes.delete(GLOBAL_DELOAD_NOTE);
      notes.delete(GLOBAL_DELOAD_GUIDE_NOTE);
    }

    const exercises = session.exercises.map((exercise) => {
      const replacement = replacementByExercise.get(exercise.id);
      const samePainExercise = painExerciseIds.has(exercise.id);
      const signal = exerciseSignals.get(exercise.id);

      if (replacement) {
        notes.add(`Remplacement propose pour ${exercise.name}: ${replacement}`);
        return applyReplacementSuggestion(exercise, replacement);
      }

      if (samePainExercise) {
        notes.add(`Vigilance douleur sur ${exercise.name}: charge et amplitude a controler.`);
        return lowerExerciseStress(exercise, 10);
      }

      if (isNextSession && signal && shouldDeloadExercise(signal) && pressure !== "pain") {
        notes.add(`Deload local sur ${exercise.name}: l'exercice coince depuis plusieurs passages, on reduit pour relancer proprement.`);
        return applyLocalDeload(exercise, signal);
      }

      if (isGlobalDeloadSession) {
        return applyGlobalDeloadToExercise(exercise);
      }

      if (signal && shouldVaryExercise(signal) && pressure !== "pain") {
        notes.add(`Stagnation sur ${exercise.name}: stimulus modifie sans chercher plus lourd.`);
        return varyExerciseStimulus(exercise);
      }

      const stressReduction = Math.max(
        isNextSession && (pressure === "hard" || pressure === "pain") ? (pressure === "pain" ? 10 : 5) : 0,
        isTrendDeloadSession ? 10 : 0
      );

      if (stressReduction > 0) {
        return lowerExerciseStress(exercise, stressReduction);
      }

      if (isNextSession && hasGoalDrift && settings.primaryGoal === "perte-gras" && isCardioExercise(exercise)) {
        return increaseCardioDose(exercise);
      }

      return exercise;
    });

    return {
      ...session,
      intensity,
      notes: notes.size > 0 ? Array.from(notes) : undefined,
      exercises
    };
  });
}

function getExerciseSignals(history: CompletedSession[]): Map<string, ExerciseSignal> {
  const signals = new Map<string, ExerciseSignal>();

  for (const session of history.slice(0, 6)) {
    const progressions = session.progressions ?? {};

    for (const [exerciseId, progression] of Object.entries(progressions)) {
      const current = signals.get(exerciseId) ?? { downCount: 0, hardCount: 0, maintainCount: 0, painCount: 0 };
      const log = session.logs[exerciseId];

      if (progression.decision === "maintenir") current.maintainCount += 1;
      if (progression.decision === "baisser") current.downCount += 1;
      if (progression.decision === "remplacer" || progression.decision === "alerte") current.painCount += 1;
      if (log?.status === "hard") current.hardCount += 1;
      if (log?.status === "pain") current.painCount += 1;

      signals.set(exerciseId, current);
    }
  }

  return new Map(
    [...signals.entries()].filter(([, signal]) =>
      shouldDeloadExercise(signal) || shouldVaryExercise(signal)
    )
  );
}

function shouldDeloadExercise(signal: ExerciseSignal): boolean {
  return signal.painCount === 0 && (signal.downCount >= 2 || (signal.hardCount >= 2 && signal.maintainCount >= 1));
}

function shouldVaryExercise(signal: ExerciseSignal): boolean {
  return signal.maintainCount >= 3;
}

function isUpcomingSession(index: number, completedIndex: number, programLength: number, windowSize: number): boolean {
  for (let offset = 1; offset <= windowSize; offset += 1) {
    if (index === (completedIndex + offset) % programLength) {
      return true;
    }
  }

  return false;
}

function getAdaptationPressure(completed: CompletedSession): AdaptationPressure {
  const logs = Object.values(completed.logs);
  const painCount = logs.filter((log) => log.status === "pain").length;
  const hardCount = logs.filter((log) => log.status === "hard").length;
  const easyCount = logs.filter((log) => log.status === "easy").length;
  const doneCount = logs.filter((log) => log.status && log.status !== "skipped").length;
  const feedback = completed.feedback;

  if (painCount > 0 || feedback.globalPain >= 4 || feedback.breath === "vertige" || feedback.breath === "oppression") {
    return "pain";
  }

  if (hardCount >= 2 || feedback.difficulty >= 8 || feedback.energy <= 3) {
    return "hard";
  }

  if (doneCount > 0 && easyCount >= Math.ceil(doneCount * 0.75) && feedback.difficulty <= 4 && feedback.energy >= 7) {
    return "easy";
  }

  return "normal";
}

function getReplacementByExercise(completed: CompletedSession): Map<string, string> {
  const replacements = new Map<string, string>();

  Object.entries(completed.progressions ?? {}).forEach(([exerciseId, progression]) => {
    const shouldReplace: ProgressionDecision[] = ["remplacer", "alerte"];

    if (progression.replacementSuggestion && shouldReplace.includes(progression.decision)) {
      replacements.set(exerciseId, progression.replacementSuggestion);
    }
  });

  return replacements;
}

function applyReplacementSuggestion(exercise: Exercise, replacementSuggestion: string): Exercise {
  return {
    ...lowerExerciseStress(exercise, 10),
    name: `Alternative: ${shortenSuggestion(replacementSuggestion)}`,
    cue: `Remplacement recommande suite au retour de seance: ${replacementSuggestion}`
  };
}

function lowerExerciseStress(exercise: Exercise, percent: number): Exercise {
  return normalizeExerciseV2({
    ...exercise,
    target: reduceTarget(exercise.target),
    plannedLoad: reduceLoad(exercise.plannedLoad, percent),
    rest: increaseRest(exercise.rest)
  });
}

function varyExerciseStimulus(exercise: Exercise): Exercise {
  return normalizeExerciseV2({
    ...exercise,
    target: varyTarget(exercise.target),
    rest: increaseRest(exercise.rest),
    cue: `${exercise.cue} Adaptation stagnation: garder la charge, ralentir le tempo et chercher une execution plus propre.`
  });
}

function applyLocalDeload(exercise: Exercise, signal: ExerciseSignal): Exercise {
  const reductionPercent = signal.downCount >= 2 ? 12 : 10;

  return normalizeExerciseV2({
    ...exercise,
    target: reduceTarget(exercise.target),
    plannedLoad: reduceLoad(exercise.plannedLoad, reductionPercent),
    rest: increaseRest(exercise.rest),
    cue: `${exercise.cue} Deload local: calmer la fatigue sur cet exercice avant de reprogresser proprement.`
  });
}

function applyGlobalDeloadToExercise(exercise: Exercise): Exercise {
  if (isCardioExercise(exercise)) {
    return normalizeExerciseV2({
      ...exercise,
      target: reduceTarget(exercise.target),
      cue: `${exercise.cue} Deload global: rester facile, souffle propre et recuperation prioritaire.`
    });
  }

  return normalizeExerciseV2({
    ...exercise,
    target: reduceTarget(exercise.target),
    plannedLoad: reduceLoad(exercise.plannedLoad, 10),
    rest: increaseRest(exercise.rest),
    cue: `${exercise.cue} Deload global: garder 2-3 reps en reserve sur tout l'exercice.`
  });
}

function increaseCardioDose(exercise: Exercise): Exercise {
  return normalizeExerciseV2({
    ...exercise,
    target: increaseDurationTarget(exercise.target, 5),
    cue: `${exercise.cue} Adaptation objectif: ajouter 5 minutes faciles si le souffle reste propre.`
  });
}

function reduceTarget(target: string): string {
  const setMatch = target.match(/^(\d+)(?:-(\d+))?\s*x\s*(.+)$/i);
  if (setMatch) {
    const low = Math.max(1, Number(setMatch[1]) - 1);
    const high = setMatch[2] ? Math.max(low, Number(setMatch[2]) - 1) : undefined;
    return `${high ? `${low}-${high}` : low} x ${setMatch[3]}`.trim();
  }

  const minutesMatch = target.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/i);
  if (minutesMatch) {
    const high = Number(minutesMatch[2] ?? minutesMatch[1]);
    return `${Math.max(10, high - 5)} min facile`;
  }

  return `${target}, volume reduit`;
}

function varyTarget(target: string): string {
  const setMatch = target.match(/^(\d+)(?:-(\d+))?\s*x\s*(\d+)(?:\s*[-a]\s*(\d+))?/i);
  if (setMatch) {
    const sets = Number(setMatch[1]);
    const minReps = Number(setMatch[3]);
    const maxReps = Number(setMatch[4] ?? setMatch[3]);
    return `${sets} x ${minReps + 2}-${maxReps + 2}`;
  }

  return `${target}, tempo controle`;
}

function increaseDurationTarget(target: string, minutes: number): string {
  const rangeMatch = target.match(/(\d+)\s*-\s*(\d+)\s*min/i);
  if (rangeMatch) {
    return `${Number(rangeMatch[1]) + minutes}-${Number(rangeMatch[2]) + minutes} min`;
  }

  const minutesMatch = target.match(/(\d+)\s*min/i);
  if (minutesMatch) {
    return target.replace(minutesMatch[0], `${Number(minutesMatch[1]) + minutes} min`);
  }

  return `${target}, +${minutes} min facile`;
}

function isCardioExercise(exercise: Exercise): boolean {
  return exercise.classification === "cardio" ||
    exercise.muscleGroups?.includes("cardio") ||
    exercise.taxonomy?.pattern === "cardio-steady" ||
    exercise.taxonomy?.pattern === "cardio-hiit" ||
    /cardio|tapis|marche|rameur|velo|zone 2|intervalles/i.test(`${exercise.name} ${exercise.target}`);
}

function reduceLoad(load: string | undefined, percent: number): string | undefined {
  if (!load) return load;
  const match = load.match(/(\d+(?:[,.]\d+)?)\s*kg/i);
  if (!match) return load;

  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) return load;

  const next = Math.max(0, Math.round((value * (1 - percent / 100)) * 2) / 2);
  return load.replace(match[0], `${formatNumber(next)} kg`);
}

function increaseRest(rest: string): string {
  const seconds = rest.match(/(\d+)\s*s/i);
  if (seconds) {
    return rest.replace(seconds[0], `${Number(seconds[1]) + 15} s`);
  }

  const minutes = rest.match(/(\d+)\s*min/i);
  if (minutes) {
    return rest;
  }

  return rest;
}

function stepDownIntensity(intensity: PlannedSession["intensity"]): PlannedSession["intensity"] {
  if (intensity === "Soutenue") return "Modérée";
  if (intensity === "Modérée") return "Légère";
  return intensity;
}

function shortenSuggestion(value: string): string {
  return value.split(/[.;]/)[0].trim();
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}
