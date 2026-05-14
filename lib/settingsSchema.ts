import type {
  CalibrationEvent,
  ExerciseSwapPreferences,
  ExternalSport,
  LoadBiasByPattern,
  RepBiasByPattern,
  RecoveryProfile,
  RestBiasByPattern,
  SetBiasByPattern,
  StrengthReference,
  TrainingConstraint,
  UserSettings,
  Weekday
} from "@/types/training";

export const CURRENT_SETTINGS_SCHEMA_VERSION = 6;

const ALL_WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function normalizeUserSettings(
  rawSettings: Partial<UserSettings> | null | undefined,
  defaults: UserSettings
): UserSettings {
  const raw = rawSettings ?? {};
  const judoDays = normalizeWeekdays(raw.judoDays, defaults.judoDays);
  const strengthReferences = normalizeStrengthReferences(raw.strengthReferences, defaults.strengthReferences);
  const medicalNotes = normalizeString(raw.medicalNotes, defaults.medicalNotes);
  const watchPoints = normalizeStringArray(raw.watchPoints, defaults.watchPoints);
  const constraints = normalizeConstraints(raw.constraints, medicalNotes, watchPoints, defaults.constraints);
  const externalSports = normalizeExternalSports(raw.externalSports, judoDays, defaults.externalSports);
  const calibrationEvents = normalizeCalibrationEvents(raw.calibrationEvents, defaults.calibrationEvents);

  return {
    ...defaults,
    ...raw,
    schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
    sex: raw.sex ?? defaults.sex,
    athleteName: normalizeString(raw.athleteName, defaults.athleteName),
    currentWeightKg: normalizeNumber(raw.currentWeightKg, defaults.currentWeightKg),
    targetWeightKg: normalizeNumber(raw.targetWeightKg, defaults.targetWeightKg),
    benchOneRepMaxKg: normalizeNumber(raw.benchOneRepMaxKg, defaults.benchOneRepMaxKg),
    age: normalizeNumber(raw.age, defaults.age),
    heightCm: normalizeNumber(raw.heightCm, defaults.heightCm),
    gym: normalizeString(raw.gym, defaults.gym),
    mainGoal: normalizeString(raw.mainGoal, defaults.mainGoal),
    cardioLevel: normalizeString(raw.cardioLevel, defaults.cardioLevel),
    sleepQuality: normalizeString(raw.sleepQuality, defaults.sleepQuality),
    recoveryProfile: normalizeRecovery(raw.recoveryProfile, defaults.recoveryProfile),
    medicalNotes,
    watchPoints,
    preferences: normalizeStringArray(raw.preferences, defaults.preferences),
    avoid: normalizeStringArray(raw.avoid, defaults.avoid),
    judoDays,
    availableDays: normalizeWeekdays(raw.availableDays, defaults.availableDays),
    externalSports,
    constraints,
    strengthReferences,
    loadBiasByPattern: normalizeLoadBiasByPattern(raw.loadBiasByPattern),
    exerciseSwapPreferences: normalizeExerciseSwapPreferences(raw.exerciseSwapPreferences),
    setBiasByPattern: normalizeSetBiasByPattern(raw.setBiasByPattern),
    repBiasByPattern: normalizeRepBiasByPattern(raw.repBiasByPattern),
    restBiasByPattern: normalizeRestBiasByPattern(raw.restBiasByPattern),
    calibrationEvents,
    sessionDurationPreference: raw.sessionDurationPreference ?? defaults.sessionDurationPreference,
    weightLog: Array.isArray(raw.weightLog) ? raw.weightLog : defaults.weightLog
  };
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function normalizeWeekdays(value: unknown, fallback: Weekday[]): Weekday[] {
  if (!Array.isArray(value)) return fallback;
  const valid = value.filter((day): day is Weekday => ALL_WEEKDAYS.includes(day as Weekday));
  return Array.from(new Set(valid));
}

function normalizeRecovery(value: unknown, fallback: RecoveryProfile): RecoveryProfile {
  return value === "poor" || value === "irregular" || value === "regular" || value === "good"
    ? value
    : fallback;
}

function normalizeStrengthReferences(value: unknown, fallback: StrengthReference[]): StrengthReference[] {
  if (!Array.isArray(value)) return fallback;

  return value
    .filter((item): item is Partial<StrengthReference> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      lift: normalizeString(item.lift, "Reference"),
      value: normalizeString(item.value, ""),
      note: typeof item.note === "string" ? item.note : undefined,
      loadKg: typeof item.loadKg === "number" ? item.loadKg : undefined,
      reps: typeof item.reps === "number" ? item.reps : undefined,
      estimatedOneRepMaxKg: typeof item.estimatedOneRepMaxKg === "number" ? item.estimatedOneRepMaxKg : undefined,
      confidence: item.confidence,
      lastTestedAt: typeof item.lastTestedAt === "string" ? item.lastTestedAt : undefined,
      origin: item.origin === "learned" || item.origin === "manual" || item.origin === "onboarding"
        ? item.origin
        : undefined,
      locked: typeof item.locked === "boolean" ? item.locked : undefined
    }))
    .filter((item) => item.value);
}

function normalizeLoadBiasByPattern(value: unknown): LoadBiasByPattern | undefined {
  if (!value || typeof value !== "object") return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, amount]) => typeof amount === "number" && Number.isFinite(amount))
    .map(([pattern, amount]) => [pattern, clamp(Number(amount), -0.18, 0.18)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeExerciseSwapPreferences(value: unknown): ExerciseSwapPreferences | undefined {
  if (!value || typeof value !== "object") return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([exerciseId, replacementId]) =>
      typeof exerciseId === "string"
      && exerciseId.trim().length > 0
      && typeof replacementId === "string"
      && replacementId.trim().length > 0
    )
    .map(([exerciseId, replacementId]) => [exerciseId.trim(), (replacementId as string).trim()]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeSetBiasByPattern(value: unknown): SetBiasByPattern | undefined {
  if (!value || typeof value !== "object") return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, amount]) => typeof amount === "number" && Number.isFinite(amount))
    .map(([pattern, amount]) => [pattern, clamp(Number(amount), -1, 1)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeRepBiasByPattern(value: unknown): RepBiasByPattern | undefined {
  if (!value || typeof value !== "object") return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, amount]) => typeof amount === "number" && Number.isFinite(amount))
    .map(([pattern, amount]) => [pattern, clamp(Number(amount), -2, 2)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeRestBiasByPattern(value: unknown): RestBiasByPattern | undefined {
  if (!value || typeof value !== "object") return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, amount]) => typeof amount === "number" && Number.isFinite(amount))
    .map(([pattern, amount]) => [pattern, clamp(Number(amount), -1, 1)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeCalibrationEvents(
  value: unknown,
  fallback: CalibrationEvent[] | undefined
): CalibrationEvent[] {
  if (!Array.isArray(value)) {
    return fallback ?? [];
  }

  return value
    .filter((item): item is Partial<CalibrationEvent> => Boolean(item) && typeof item === "object")
    .map((item, index) => ({
      id: normalizeString(item.id, `calibration-event-${index}`),
      createdAt: normalizeString(item.createdAt, new Date(0).toISOString()),
      kind:
        item.kind === "load-feedback" ||
        item.kind === "reference-deleted" ||
        item.kind === "reference-learned" ||
        item.kind === "reference-locked" ||
        item.kind === "reference-unlocked"
          ? item.kind
          : "load-feedback",
      tone: item.tone === "info" || item.tone === "progress" || item.tone === "warn" ? item.tone : "info",
      title: normalizeString(item.title, "Ajustement"),
      subject: normalizeString(item.subject, "Programme"),
      detail: normalizeString(item.detail, "")
    }))
    .filter((item) => item.title && item.subject && item.detail)
    .slice(0, 40);
}

function normalizeExternalSports(
  value: unknown,
  judoDays: Weekday[],
  fallback: ExternalSport[]
): ExternalSport[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is Partial<ExternalSport> => Boolean(item) && typeof item === "object")
      .map((item, index) => ({
        id: normalizeString(item.id, `sport-${index}`),
        name: normalizeString(item.name, "Sport externe"),
        days: normalizeWeekdays(item.days, []),
        intensity:
          item.intensity === "low" || item.intensity === "moderate" || item.intensity === "high"
            ? item.intensity
            : "moderate",
        notes: typeof item.notes === "string" ? item.notes : undefined
      }));
  }

  if (judoDays.length > 0) {
    return [
      {
        id: "judo",
        name: "Judo",
        days: judoDays,
        intensity: "high",
        notes: "Sport externe a prendre en compte dans la recuperation."
      }
    ];
  }

  return fallback;
}

function normalizeConstraints(
  value: unknown,
  medicalNotes: string,
  watchPoints: string[],
  fallback: TrainingConstraint[]
): TrainingConstraint[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is Partial<TrainingConstraint> => Boolean(item) && typeof item === "object")
      .map((item, index) => ({
        id: normalizeString(item.id, `constraint-${index}`),
        area: item.area ?? "other",
        label: normalizeString(item.label, "Contrainte"),
        severity:
          item.severity === "info" || item.severity === "caution" || item.severity === "avoid"
            ? item.severity
            : "caution",
        notes: typeof item.notes === "string" ? item.notes : undefined,
        avoidExerciseIds: Array.isArray(item.avoidExerciseIds)
          ? item.avoidExerciseIds.filter((exerciseId): exerciseId is string => typeof exerciseId === "string")
          : undefined,
        createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined
      }));
  }

  const derived = [
    ...watchPoints.map((point, index) => ({
      id: `watch-${index}`,
      area: inferBodyArea(point),
      label: point,
      severity: "caution" as const
    })),
    ...(medicalNotes
      ? [
          {
            id: "medical-notes",
            area: "other" as const,
            label: medicalNotes,
            severity: "info" as const
          }
        ]
      : [])
  ];

  return derived.length > 0 ? derived : fallback;
}

function inferBodyArea(value: string): TrainingConstraint["area"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("poignet")) return "wrist";
  if (normalized.includes("epaule") || normalized.includes("épaule")) return "shoulder";
  if (normalized.includes("dos")) return "back";
  if (normalized.includes("genou")) return "knee";
  if (normalized.includes("souffle") || normalized.includes("cardio")) return "cardio";
  return "other";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
