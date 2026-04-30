import test from "node:test";
import assert from "node:assert/strict";
import { weeklyProgram } from "@/data/program";
import { buildProgram } from "@/lib/programBuilder";
import { normalizeExerciseV2, normalizeProgramV2 } from "@/lib/programSchema";
import { calculateProgression } from "@/lib/progression";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { Exercise, PlannedSession, UserSettings } from "@/types/training";

const baseSettings: UserSettings = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  athleteName: "Test",
  sex: "male",
  loadUnit: "kg",
  currentWeightKg: 80,
  targetWeightKg: 75,
  benchOneRepMaxKg: 100,
  judoDays: [],
  cautionLevel: "normal",
  aiEnabled: false,
  darkMode: false,
  age: 30,
  heightCm: 175,
  gym: "",
  mainGoal: "Test",
  cardioLevel: "Modere",
  sleepQuality: "Regulier",
  recoveryProfile: "regular",
  medicalNotes: "",
  watchPoints: [],
  preferences: [],
  avoid: [],
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  externalSports: [],
  constraints: [],
  strengthReferences: [],
  sessionDurationPreference: "standard"
};

test("seed program is automatically enriched with v2 prescription and taxonomy", () => {
  const monday = weeklyProgram.find((session) => session.id === "monday-upper-force-judo")!;
  const bench = monday.exercises.find((exercise) => exercise.id === "bench-press-5x5")!;

  assert.equal(monday.mesocycleLength, 6);
  assert.equal(monday.deloadEvery, 5);
  assert.equal(bench.prescription?.sets, 5);
  assert.equal(bench.prescription?.repsMin, 5);
  assert.equal(bench.prescription?.load?.kg, 90);
  assert.equal(bench.prescription?.restSec, 150);
  assert.equal(bench.prescription?.restSecMax, 180);
  assert.equal(bench.taxonomy?.pattern, "chest-compound");
  assert.equal(bench.taxonomy?.jointStress?.wrist, "caution");
});

test("normalizer parses duration based cardio and bodyweight-style targets", () => {
  const exercise = normalizeExerciseV2({
    id: "test-cardio",
    name: "Marche soutenue",
    target: "35-45 min zone 2",
    rest: "Libre",
    cue: "Rythme facile."
  });

  assert.equal(exercise.prescription?.work, "duration");
  assert.equal(exercise.prescription?.durationMin, 35);
  assert.equal(exercise.prescription?.durationMinMax, 45);
  assert.equal(exercise.taxonomy?.pattern, "cardio-steady");
});

test("generated programs carry structured prescriptions on every exercise", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.ok(program.length > 0);
  assert.equal(program.every((session) => session.phase && session.mesocycleLength && session.deloadEvery), true);
  assert.equal(
    program.flatMap((session) => session.exercises).every((exercise) => exercise.prescription && exercise.taxonomy?.pattern),
    true
  );
});

test("progression can use structured prescription even when display strings are loose", () => {
  const exercise: Exercise = normalizeExerciseV2({
    id: "structured-bench",
    name: "Developpe couche",
    target: "travail du jour",
    plannedLoad: "charge calculee",
    rest: "repos calcule",
    cue: "Controle.",
    prescription: {
      sets: 5,
      repsMin: 5,
      repsMax: 5,
      restSec: 150,
      load: { kg: 90, kind: "estimated", source: "estimated", unit: "kg" },
      work: "reps"
    },
    taxonomy: {
      pattern: "chest-compound",
      equipment: ["salle-complete"],
      isCompound: true
    }
  });
  const session: PlannedSession = normalizeProgramV2([
    {
      id: "structured-session",
      weekday: "monday",
      title: "Structured",
      focus: "Test",
      duration: "60 min",
      intensity: "Soutenue",
      exercises: [exercise]
    }
  ])[0];

  const result = calculateProgression({
    plannedExercise: exercise,
    performance: {
      usedLoad: "",
      completedReps: "5/5/5/5/5",
      comment: ""
    },
    feedback: "ok",
    sessionDifficulty: 6,
    globalPain: 0,
    energy: 7,
    breath: "correct",
    session
  });

  assert.equal(result.decision, "augmenter");
  assert.equal(result.nextLoad, "92,5 kg");
  assert.equal(result.nextTarget, "travail du jour");
});
