import { appendCalibrationEvents, createReferenceLearnedCalibrationEvent } from "@/lib/calibrationEvents";
import { buildStrengthReferenceFromSet, estimateOneRepMaxFromSet } from "@/lib/strengthCalibration";
import type {
  BodyArea,
  CalibrationEvent,
  CompletedSession,
  MovementPattern,
  PlannedSession,
  RecoveryProfile,
  StrengthReference,
  TrainingConstraint,
  UserSettings
} from "@/types/training";

export function adaptSettingsAfterSession(
  settings: UserSettings,
  completed: CompletedSession,
  session?: PlannedSession,
  history: CompletedSession[] = []
): UserSettings {
  const painConstraints = buildPainConstraints(completed, settings.constraints);
  const fatigueWatchPoint = buildFatigueWatchPoint(completed);
  const watchPoints = appendUnique(
    settings.watchPoints,
    [
      ...painConstraints.map((constraint) => constraint.label),
      fatigueWatchPoint
    ].filter((item): item is string => Boolean(item)),
    20
  );
  const learnedResult = session
    ? learnStrengthReferences(settings.strengthReferences, completed, session, history)
    : { strengthReferences: settings.strengthReferences, events: [] as CalibrationEvent[] };
  const setBiasByPattern = session
    ? adaptSetBiasByPattern(settings.setBiasByPattern, completed, session)
    : settings.setBiasByPattern;
  const repBiasByPattern = session
    ? adaptRepBiasByPattern(settings.repBiasByPattern, completed, session)
    : settings.repBiasByPattern;
  const restBiasByPattern = session
    ? adaptRestBiasByPattern(settings.restBiasByPattern, completed, session)
    : settings.restBiasByPattern;
  const nextSettings = {
    ...settings,
    recoveryProfile: adaptRecoveryProfile(settings.recoveryProfile, completed),
    watchPoints,
    constraints: mergeConstraints(settings.constraints, painConstraints),
    strengthReferences: learnedResult.strengthReferences,
    setBiasByPattern,
    repBiasByPattern,
    restBiasByPattern,
    benchOneRepMaxKg: settings.benchOneRepMaxKg > 0
      ? settings.benchOneRepMaxKg
      : getLearnedBenchOneRepMax(learnedResult.strengthReferences)
  };

  return appendCalibrationEvents(nextSettings, learnedResult.events);
}

function buildPainConstraints(
  completed: CompletedSession,
  existing: TrainingConstraint[]
): TrainingConstraint[] {
  const constraints: TrainingConstraint[] = [];

  Object.values(completed.logs)
    .filter((log) => log.status === "pain")
    .forEach((log) => {
      const progression = completed.progressions?.[log.exerciseId];
      const exerciseName = progression?.exerciseName ?? log.exerciseId;
      const label = `Douleur sur ${exerciseName}${log.comment ? `: ${log.comment}` : ""}`;
      const area = inferBodyArea(`${exerciseName} ${log.comment}`);
      const alreadyExists = existing.some((constraint) => normalize(constraint.label) === normalize(label));

      if (!alreadyExists) {
        constraints.push({
          id: `pain-${completed.dateKey}-${log.exerciseId}`,
          area,
          label,
          severity: "caution",
          notes: progression?.replacementSuggestion,
          createdAt: completed.completedAt
        });
      }
    });

  return constraints;
}

function buildFatigueWatchPoint(completed: CompletedSession): string | undefined {
  if (completed.feedback.globalPain >= 4) {
    return `Douleur globale ${completed.feedback.globalPain}/10 le ${completed.dateKey}`;
  }

  if (completed.feedback.difficulty >= 8 || completed.feedback.energy <= 3) {
    return `Fatigue elevee le ${completed.dateKey}`;
  }

  return undefined;
}

function adaptSetBiasByPattern(
  existing: UserSettings["setBiasByPattern"],
  completed: CompletedSession,
  session: PlannedSession
): UserSettings["setBiasByPattern"] {
  const next = { ...(existing ?? {}) };
  const deltas = new Map<MovementPattern, number>();

  for (const exercise of session.exercises) {
    const effectiveExercise = completed.replacements?.[exercise.id] ?? exercise;
    const pattern = effectiveExercise.taxonomy?.pattern;
    const log = completed.logs[exercise.id];
    if (!pattern || !log?.status) continue;

    const delta = getPatternSetBiasDelta(log.status, completed.feedback.difficulty, completed.feedback.energy);
    if (delta === 0) continue;
    deltas.set(pattern, delta);
  }

  for (const [pattern, delta] of deltas.entries()) {
    const current = next[pattern] ?? 0;
    const updated = clamp(current + delta, -1, 1);
    if (updated === 0) {
      delete next[pattern];
    } else {
      next[pattern] = updated;
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function adaptRepBiasByPattern(
  existing: UserSettings["repBiasByPattern"],
  completed: CompletedSession,
  session: PlannedSession
): UserSettings["repBiasByPattern"] {
  const next = { ...(existing ?? {}) };
  const deltas = new Map<MovementPattern, number>();

  for (const exercise of session.exercises) {
    const effectiveExercise = completed.replacements?.[exercise.id] ?? exercise;
    const pattern = effectiveExercise.taxonomy?.pattern;
    const log = completed.logs[exercise.id];
    if (!pattern || !log?.status) continue;

    const delta = getPatternRepBiasDelta(log.status, completed.feedback.difficulty, completed.feedback.energy);
    if (delta === 0) continue;
    deltas.set(pattern, delta);
  }

  for (const [pattern, delta] of deltas.entries()) {
    const current = next[pattern] ?? 0;
    const updated = clamp(current + delta, -2, 2);
    if (updated === 0) {
      delete next[pattern];
    } else {
      next[pattern] = updated;
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function adaptRestBiasByPattern(
  existing: UserSettings["restBiasByPattern"],
  completed: CompletedSession,
  session: PlannedSession
): UserSettings["restBiasByPattern"] {
  const next = { ...(existing ?? {}) };
  const deltas = new Map<MovementPattern, number>();

  for (const exercise of session.exercises) {
    const effectiveExercise = completed.replacements?.[exercise.id] ?? exercise;
    const pattern = effectiveExercise.taxonomy?.pattern;
    const log = completed.logs[exercise.id];
    if (!pattern || !log?.status) continue;

    const delta = getPatternRestBiasDelta(log.status, completed.feedback.difficulty, completed.feedback.energy);
    if (delta === 0) continue;
    deltas.set(pattern, delta);
  }

  for (const [pattern, delta] of deltas.entries()) {
    const current = next[pattern] ?? 0;
    const updated = clamp(current + delta, -1, 1);
    if (updated === 0) {
      delete next[pattern];
    } else {
      next[pattern] = updated;
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function getPatternSetBiasDelta(
  status: NonNullable<CompletedSession["logs"][string]["status"]>,
  difficulty: number,
  energy: number
): number {
  if (status === "pain" || status === "skipped") return -1;
  if (status === "hard") return -0.5;
  if (status === "easy" && difficulty <= 6 && energy >= 6) return 0.5;
  return 0;
}

function getPatternRepBiasDelta(
  status: NonNullable<CompletedSession["logs"][string]["status"]>,
  difficulty: number,
  energy: number
): number {
  if (status === "pain") return -2;
  if (status === "hard") return -1;
  if (status === "easy" && difficulty <= 5 && energy >= 7) return 1;
  return 0;
}

function getPatternRestBiasDelta(
  status: NonNullable<CompletedSession["logs"][string]["status"]>,
  difficulty: number,
  energy: number
): number {
  if (status === "pain") return 1;
  if (status === "hard") return 1;
  if (status === "easy" && difficulty <= 4 && energy >= 7) return -1;
  return 0;
}

function adaptRecoveryProfile(current: RecoveryProfile, completed: CompletedSession): RecoveryProfile {
  const breathAlert = completed.feedback.breath === "vertige" || completed.feedback.breath === "oppression";
  const hasPain = completed.feedback.globalPain >= 4 ||
    Object.values(completed.logs).some((log) => log.status === "pain");
  const fatigueHigh = completed.feedback.difficulty >= 8 || completed.feedback.energy <= 3;
  const easySession =
    completed.feedback.difficulty <= 4 &&
    completed.feedback.globalPain <= 1 &&
    completed.feedback.energy >= 7 &&
    Object.values(completed.logs).filter((log) => log.status === "easy").length >=
      Math.ceil(Math.max(1, Object.values(completed.logs).length) * 0.6);

  if (breathAlert || completed.feedback.globalPain >= 6) return "poor";
  if (hasPain || fatigueHigh) return current === "poor" ? "poor" : "irregular";
  if (easySession && (current === "poor" || current === "irregular")) return "regular";

  return current;
}

function mergeConstraints(existing: TrainingConstraint[], additions: TrainingConstraint[]): TrainingConstraint[] {
  const next = [...existing];

  for (const addition of additions) {
    if (!next.some((constraint) => normalize(constraint.label) === normalize(addition.label))) {
      next.push(addition);
    }
  }

  return next.slice(-30);
}

function appendUnique(existing: string[], additions: string[], max: number): string[] {
  const next = [...existing];

  for (const addition of additions) {
    if (!next.some((item) => normalize(item) === normalize(addition))) {
      next.push(addition);
    }
  }

  return next.slice(-max);
}

function inferBodyArea(value: string): BodyArea {
  const text = normalize(value);
  if (text.includes("poignet") || text.includes("wrist")) return "wrist";
  if (text.includes("epaule") || text.includes("shoulder")) return "shoulder";
  if (text.includes("coude") || text.includes("elbow")) return "elbow";
  if (text.includes("dos") || text.includes("lombaire") || text.includes("back")) return "back";
  if (text.includes("genou") || text.includes("knee")) return "knee";
  if (text.includes("hanche") || text.includes("hip")) return "hip";
  if (text.includes("cheville") || text.includes("ankle")) return "ankle";
  if (text.includes("nuque") || text.includes("cou") || text.includes("neck")) return "neck";
  if (text.includes("souffle") || text.includes("cardio")) return "cardio";
  return "other";
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function learnStrengthReferences(
  existing: StrengthReference[],
  completed: CompletedSession,
  session: PlannedSession,
  history: CompletedSession[]
): { strengthReferences: StrengthReference[]; events: CalibrationEvent[] } {
  const next = [...existing];
  const events: CalibrationEvent[] = [];

  for (const exercise of session.exercises) {
    const effectiveExercise = completed.replacements?.[exercise.id] ?? exercise;
    const pattern = effectiveExercise.taxonomy?.pattern;
    if (!isLearnablePattern(pattern) || effectiveExercise.taxonomy?.isCompound === false) continue;

    const samples = collectSuccessfulSamples(exercise.id, history);
    if (samples.length < 2) continue;

    const estimates = samples
      .map((sample) => ({
        ...sample,
        estimatedOneRepMaxKg: estimateOneRepMaxFromSet(sample.loadKg, sample.reps, "kg")
      }))
      .filter((sample): sample is typeof sample & { estimatedOneRepMaxKg: number } => Boolean(sample.estimatedOneRepMaxKg));

    if (estimates.length < 2) continue;

    const lowest = Math.min(...estimates.map((sample) => sample.estimatedOneRepMaxKg));
    const highest = Math.max(...estimates.map((sample) => sample.estimatedOneRepMaxKg));
    if (lowest <= 0 || highest / lowest > 1.15) continue;

    const best = estimates.sort((a, b) => b.estimatedOneRepMaxKg - a.estimatedOneRepMaxKg)[0];
    const learned = buildStrengthReferenceFromSet(effectiveExercise.name, best.loadKg, best.reps, "kg");
    if (!learned) continue;

    learned.note = `Appris automatiquement apres ${estimates.length} seances valides.`;
    learned.lastTestedAt = completed.completedAt;
    learned.origin = "learned";
    learned.locked = false;

    const existingIndex = next.findIndex((reference) => referencesMatchPattern(reference, pattern));
    if (existingIndex >= 0) {
      const existingReference = next[existingIndex];
      if (existingReference.locked || existingReference.origin === "manual") {
        continue;
      }
      next[existingIndex] = learned;
    } else {
      next.push(learned);
    }

    events.push(createReferenceLearnedCalibrationEvent(learned));
  }

  return {
    strengthReferences: next.slice(-12),
    events
  };
}

function collectSuccessfulSamples(exerciseId: string, history: CompletedSession[]) {
  return history
    .map((session) => session.logs[exerciseId])
    .filter((log): log is CompletedSession["logs"][string] => Boolean(log))
    .filter((log) => log.status === "ok" || log.status === "easy")
    .map((log) => {
      const loadKg = parseKg(log.usedLoad);
      const reps = parseRepresentativeReps(log.completedReps);
      return loadKg && reps ? { loadKg, reps } : undefined;
    })
    .filter((sample): sample is { loadKg: number; reps: number } => Boolean(sample))
    .slice(0, 3);
}

function getLearnedBenchOneRepMax(strengthReferences: StrengthReference[]): number {
  const chestReference = strengthReferences.find((reference) => referencesMatchPattern(reference, "chest-compound"));
  return chestReference?.estimatedOneRepMaxKg ?? 0;
}

function referencesMatchPattern(reference: StrengthReference, pattern: MovementPattern): boolean {
  const text = normalize(reference.lift);
  return getPatternKeywords(pattern).some((keyword) => text.includes(keyword));
}

function getPatternKeywords(pattern: MovementPattern): string[] {
  if (pattern === "chest-compound") return ["developpe couche", "bench"];
  if (pattern === "legs-quad") return ["squat", "presse", "leg"];
  if (pattern === "back-horizontal" || pattern === "back-vertical") return ["tirage", "rowing", "traction", "pull"];
  if (pattern === "legs-hinge") return ["hip thrust", "souleve", "hinge", "rdl"];
  if (pattern === "shoulders-compound") return ["developpe militaire", "developpe epaules", "shoulder"];
  return [];
}

function isLearnablePattern(pattern: MovementPattern | undefined): pattern is MovementPattern {
  return Boolean(pattern && getPatternKeywords(pattern).length > 0);
}

function parseKg(value: string): number | undefined {
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*kg/i);
  if (!match) return undefined;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseRepresentativeReps(value: string): number | undefined {
  const repeated = value.match(/\d+\s*x\s*(\d+)/i);
  if (repeated) return Number(repeated[1]);

  const values = (value.match(/\d+/g) ?? []).map((item) => Number(item)).filter((item) => item > 0);
  if (values.length === 0) return undefined;

  return Math.max(...values);
}
