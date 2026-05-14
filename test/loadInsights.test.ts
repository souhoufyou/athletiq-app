import test from "node:test";
import assert from "node:assert/strict";
import { getExerciseLoadInsight } from "@/lib/loadInsights";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { Exercise, UserSettings } from "@/types/training";

const baseSettings: UserSettings = {
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
  sessionDurationPreference: "standard",
  primaryGoal: "prise-masse",
  experienceLevel: "intermediaire",
  equipment: "salle-complete",
  weeklyFrequency: 4
};

test("direct chest reference is explained as a user reference", () => {
  const exercise: Exercise = {
    id: "ex-bench-barbell",
    name: "Developpe couche barre",
    target: "4 x 6-8",
    plannedLoad: "85 kg",
    rest: "2 min",
    cue: "Controle",
    taxonomy: { pattern: "chest-compound" }
  };

  const insight = getExerciseLoadInsight(exercise, baseSettings);
  assert.equal(insight?.badge, "Repere");
});

test("estimated shoulder load is explained as derived from bench", () => {
  const exercise: Exercise = {
    id: "ex-overhead-press",
    name: "Developpe militaire",
    target: "4 x 6-8",
    plannedLoad: "env. 50 kg",
    rest: "2 min",
    cue: "Controle",
    taxonomy: { pattern: "shoulders-compound" }
  };

  const insight = getExerciseLoadInsight(exercise, baseSettings);
  assert.equal(insight?.badge, "Derivee");
});

test("estimated load without a matching reference is explained as a starting estimate", () => {
  const exercise: Exercise = {
    id: "ex-row-cable",
    name: "Rowing poulie basse",
    target: "4 x 10-12",
    plannedLoad: "env. 35 kg",
    rest: "90 s",
    cue: "Controle",
    taxonomy: { pattern: "back-horizontal" }
  };

  const insight = getExerciseLoadInsight(exercise, baseSettings);
  assert.equal(insight?.badge, "Estimee");
});
