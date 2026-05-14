import { normalizeExerciseV2, normalizeProgramV2 } from "@/lib/programSchema";
import type { BodyArea, Exercise, PlannedSession, ProgramTemplate, UserSettings, Weekday } from "@/types/training";

const DEFAULT_WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function instantiateProgramTemplate(
  template: ProgramTemplate,
  settings?: Pick<
    UserSettings,
    | "availableDays"
    | "avoid"
    | "constraints"
    | "externalSports"
    | "judoDays"
    | "primaryGoal"
    | "sessionDurationPreference"
    | "weeklyFrequency"
  >
): PlannedSession[] {
  const sessionTemplates = selectSessionTemplates(template, settings);
  const availableDays = chooseTrainingDays(settings, sessionTemplates.length);

  return normalizeProgramV2(
    sessionTemplates.map((session, index) => {
      const weekday = session.weekday ?? availableDays[index % availableDays.length] ?? DEFAULT_WEEKDAYS[index % DEFAULT_WEEKDAYS.length];
      const { exercises, notes } = adaptExercises(session.exercises, settings);
      const duration = adaptDurationLabel(session.duration, settings?.sessionDurationPreference);

      return {
        id: `${template.id}:${session.id}`,
        weekday,
        scheduleLabel: session.scheduleLabel,
        title: session.title,
        focus: session.focus,
        duration,
        intensity: session.intensity,
        phase: session.phase,
        notes: buildSessionNotes(session.notes, settings, notes),
        exercises
      };
    })
  );
}

export function createActiveProgramMeta(
  template: ProgramTemplate,
  source: "manual" | "onboarding" | "preset" | "recommended",
  profileId?: string
) {
  return {
    programId: template.id,
    programName: template.name,
    selectedAt: new Date().toISOString(),
    source,
    profileId,
    templateVersion: 1
  };
}

function normalizeWeekdays(days: Weekday[] | undefined): Weekday[] {
  return days && days.length > 0 ? days : DEFAULT_WEEKDAYS;
}

function selectSessionTemplates(
  template: ProgramTemplate,
  settings?: Pick<UserSettings, "weeklyFrequency" | "sessionDurationPreference">
) {
  const requested = settings?.weeklyFrequency;
  const desiredCount = requested
    ? Math.max(2, Math.min(template.sessions.length, requested))
    : Math.min(template.frequency, template.sessions.length);

  return template.sessions.slice(0, desiredCount);
}

function chooseTrainingDays(
  settings: Pick<UserSettings, "availableDays" | "externalSports" | "judoDays"> | undefined,
  sessionCount: number
): Weekday[] {
  const availableDays = normalizeWeekdays(settings?.availableDays);
  const externalDays = new Set<Weekday>([
    ...(settings?.judoDays ?? []),
    ...((settings?.externalSports ?? []).flatMap((sport) => sport.days))
  ]);
  const freeDays = availableDays.filter((day) => !externalDays.has(day));

  if (freeDays.length >= sessionCount) {
    return freeDays;
  }

  return availableDays;
}

function adaptExercises(
  exercises: Exercise[],
  settings?: Pick<UserSettings, "avoid" | "constraints" | "primaryGoal" | "sessionDurationPreference">
): { exercises: Exercise[]; notes: string[] } {
  const removed: string[] = [];
  const filtered = exercises.filter((exercise) => {
    const shouldRemove = shouldRemoveExercise(exercise, settings);
    if (shouldRemove) {
      removed.push(exercise.name);
    }
    return !shouldRemove;
  });
  const safeExercises = filtered.length >= 2 ? filtered : exercises;
  const shortened = shortenForDuration(safeExercises, settings);
  const notes: string[] = [];

  if (removed.length > 0 && filtered.length >= 2) {
    notes.push(`Exercices retires car refuses ou contre-indiques: ${removed.join(", ")}.`);
  }

  if (settings?.sessionDurationPreference === "short" && shortened.length < safeExercises.length) {
    notes.push("Format court: volume concentre sur les exercices les plus utiles.");
  }

  if (settings?.primaryGoal === "perte-gras" || settings?.primaryGoal === "sante") {
    notes.push("Cardio dose progressivement selon ton objectif.");
  }

  return { exercises: shortened, notes };
}

function shouldRemoveExercise(
  exercise: Exercise,
  settings?: Pick<UserSettings, "avoid" | "constraints">
): boolean {
  const normalizedExercise = normalize(`${exercise.id} ${exercise.name} ${exercise.target} ${exercise.cue}`);
  const avoidTokens = (settings?.avoid ?? []).map(normalize).filter(Boolean);

  if (avoidTokens.some((token) => normalizedExercise.includes(token))) {
    return true;
  }

  const normalized = normalizeExerciseV2(exercise);
  const avoidAreas = (settings?.constraints ?? [])
    .filter((constraint) => constraint.severity === "avoid")
    .map((constraint) => constraint.area)
    .filter((area): area is BodyArea => area !== "other" && area !== "cardio");

  return avoidAreas.some((area) => normalized.taxonomy?.jointStress?.[area] === "avoid");
}

function shortenForDuration(
  exercises: Exercise[],
  settings?: Pick<UserSettings, "primaryGoal" | "sessionDurationPreference">
): Exercise[] {
  if (settings?.sessionDurationPreference !== "short" || exercises.length <= 5) {
    return exercises;
  }

  const cardioIndex = exercises.findIndex((exercise) => isCardioExercise(exercise));
  const shouldKeepCardio = cardioIndex >= 0 && (settings?.primaryGoal === "perte-gras" || settings?.primaryGoal === "sante");

  if (!shouldKeepCardio) {
    return exercises.slice(0, 5);
  }

  const kept = exercises.filter((_, index) => index !== cardioIndex).slice(0, 4);
  return [...kept, exercises[cardioIndex]];
}

function isCardioExercise(exercise: Exercise): boolean {
  const text = normalize(`${exercise.id} ${exercise.name} ${exercise.target} ${exercise.cue}`);
  return /cardio|zone 2|tapis|velo|rameur|elliptique|marche|stairmaster/.test(text);
}

function adaptDurationLabel(duration: string, preference?: UserSettings["sessionDurationPreference"]): string {
  if (preference === "short") return "35-45 min";
  if (preference === "long") return duration.includes("90") ? duration : `${duration} max`;
  return duration;
}

function buildSessionNotes(
  originalNotes: string[] | undefined,
  settings: Pick<UserSettings, "weeklyFrequency"> | undefined,
  adaptationNotes: string[]
): string[] | undefined {
  const notes = [...(originalNotes ?? []), ...adaptationNotes];

  if (settings?.weeklyFrequency) {
    notes.push(`Plan instancie pour ${settings.weeklyFrequency} seances par semaine.`);
  }

  return notes.length > 0 ? Array.from(new Set(notes)) : undefined;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
