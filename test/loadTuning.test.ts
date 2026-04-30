import test from "node:test";
import assert from "node:assert/strict";
import { applyLoadFeedbackToSettings, tuneExerciseLoad } from "@/lib/loadTuning";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { Exercise, UserSettings } from "@/types/training";

const settings: UserSettings = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  athleteName: "Test",
  sex: "male",
  loadUnit: "kg",
  currentWeightKg: 80,
  targetWeightKg: 75,
  benchOneRepMaxKg: 116.7,
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
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  externalSports: [],
  constraints: [],
  strengthReferences: [],
  loadBiasByPattern: {},
  sessionDurationPreference: "standard",
  primaryGoal: "prise-masse",
  experienceLevel: "intermediaire",
  equipment: "salle-complete",
  weeklyFrequency: 4
};

test("too heavy feedback lowers the displayed session load", () => {
  const exercise: Exercise = {
    id: "ex-overhead-press",
    name: "Developpe militaire",
    target: "4 x 6-8",
    plannedLoad: "env. 50 kg",
    rest: "2 min",
    cue: "Controle",
    taxonomy: { pattern: "shoulders-compound" }
  };

  assert.equal(tuneExerciseLoad(exercise, "too-heavy").plannedLoad, "env. 45 kg");
});

test("too light feedback raises per-arm loads cleanly", () => {
  const exercise: Exercise = {
    id: "ex-row-dumbbell",
    name: "Rowing haltere un bras",
    target: "3 x 10-12 par bras",
    plannedLoad: "env. 30 kg / bras",
    rest: "90 s",
    cue: "Controle",
    taxonomy: { pattern: "back-horizontal" }
  };

  assert.equal(tuneExerciseLoad(exercise, "too-light").plannedLoad, "env. 32,5 kg / bras");
});

test("feedback updates the persistent pattern bias", () => {
  const exercise: Exercise = {
    id: "ex-overhead-press",
    name: "Developpe militaire",
    target: "4 x 6-8",
    plannedLoad: "env. 50 kg",
    rest: "2 min",
    cue: "Controle",
    taxonomy: { pattern: "shoulders-compound" }
  };

  const next = applyLoadFeedbackToSettings(settings, exercise, "too-heavy");
  assert.equal(next.loadBiasByPattern?.["shoulders-compound"], -0.04);
});
