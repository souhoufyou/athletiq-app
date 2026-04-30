import type { LoadFeedback } from "@/lib/loadTuning";
import type { CalibrationEvent, Exercise, StrengthReference, UserSettings } from "@/types/training";

const MAX_CALIBRATION_EVENTS = 40;

export function appendCalibrationEvent(
  settings: UserSettings,
  event: CalibrationEvent | null | undefined
): UserSettings {
  if (!event) {
    return settings;
  }

  return appendCalibrationEvents(settings, [event]);
}

export function appendCalibrationEvents(settings: UserSettings, events: CalibrationEvent[]): UserSettings {
  if (events.length === 0) {
    return settings;
  }

  return {
    ...settings,
    calibrationEvents: [...events, ...(settings.calibrationEvents ?? [])].slice(0, MAX_CALIBRATION_EVENTS)
  };
}

export function createLoadFeedbackCalibrationEvent(
  exercise: Exercise,
  feedback: LoadFeedback,
  nextLoad?: string
): CalibrationEvent {
  const loadLabel = nextLoad ?? exercise.plannedLoad ?? "charge libre";

  if (feedback === "too-light") {
    return createCalibrationEvent({
      detail: `Charge montee a ${loadLabel} apres retour trop leger.`,
      kind: "load-feedback",
      subject: exercise.name,
      title: "Charge augmentee",
      tone: "progress"
    });
  }

  if (feedback === "too-heavy") {
    return createCalibrationEvent({
      detail: `Charge reduite a ${loadLabel} apres retour trop lourd.`,
      kind: "load-feedback",
      subject: exercise.name,
      title: "Charge reduite",
      tone: "warn"
    });
  }

  return createCalibrationEvent({
    detail: `Charge confirmee a ${loadLabel} pour les prochaines propositions.`,
    kind: "load-feedback",
    subject: exercise.name,
    title: "Charge validee",
    tone: "info"
  });
}

export function createReferenceLearnedCalibrationEvent(reference: StrengthReference): CalibrationEvent {
  return createCalibrationEvent({
    detail: `Repere appris automatiquement a ${reference.value}.`,
    kind: "reference-learned",
    subject: reference.lift,
    title: "Repere appris",
    tone: "progress"
  });
}

export function createReferenceLockCalibrationEvent(
  reference: StrengthReference,
  locked: boolean
): CalibrationEvent {
  return createCalibrationEvent({
    detail: locked
      ? `Ce repere est maintenant protege contre les mises a jour automatiques.`
      : `Ce repere peut a nouveau etre mis a jour automatiquement.`,
    kind: locked ? "reference-locked" : "reference-unlocked",
    subject: reference.lift,
    title: locked ? "Repere verrouille" : "Repere deverrouille",
    tone: locked ? "info" : "warn"
  });
}

export function createReferenceDeletedCalibrationEvent(reference: StrengthReference): CalibrationEvent {
  return createCalibrationEvent({
    detail: `Repere ${reference.value} retire du profil.`,
    kind: "reference-deleted",
    subject: reference.lift,
    title: "Repere supprime",
    tone: "warn"
  });
}

function createCalibrationEvent(
  input: Omit<CalibrationEvent, "createdAt" | "id">
): CalibrationEvent {
  const createdAt = new Date().toISOString();

  return {
    ...input,
    createdAt,
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`
  };
}
