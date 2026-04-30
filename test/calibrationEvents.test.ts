import test from "node:test";
import assert from "node:assert/strict";
import {
  appendCalibrationEvent,
  createLoadFeedbackCalibrationEvent,
  createReferenceDeletedCalibrationEvent,
  createReferenceLockCalibrationEvent
} from "@/lib/calibrationEvents";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { Exercise, StrengthReference, UserSettings } from "@/types/training";

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
  calibrationEvents: [],
  sessionDurationPreference: "standard",
  primaryGoal: "prise-masse",
  experienceLevel: "intermediaire",
  equipment: "salle-complete",
  weeklyFrequency: 4
};

test("appends a load feedback event with the right tone", () => {
  const exercise: Exercise = {
    id: "ex-overhead-press",
    name: "Developpe militaire",
    target: "4 x 6-8",
    plannedLoad: "env. 50 kg",
    rest: "2 min",
    cue: "Controle",
    taxonomy: { pattern: "shoulders-compound" }
  };

  const next = appendCalibrationEvent(
    settings,
    createLoadFeedbackCalibrationEvent(exercise, "too-heavy", "env. 45 kg")
  );

  assert.equal(next.calibrationEvents?.length, 1);
  assert.equal(next.calibrationEvents?.[0].title, "Charge reduite");
  assert.equal(next.calibrationEvents?.[0].tone, "warn");
  assert.match(next.calibrationEvents?.[0].detail ?? "", /45 kg/);
});

test("creates lock and delete events for references", () => {
  const reference: StrengthReference = {
    lift: "Developpe couche barre",
    value: "80 kg x 8",
    loadKg: 80,
    reps: 8,
    estimatedOneRepMaxKg: 101.3,
    confidence: "estimated",
    origin: "learned",
    locked: false
  };

  const locked = createReferenceLockCalibrationEvent(reference, true);
  const deleted = createReferenceDeletedCalibrationEvent(reference);

  assert.equal(locked.kind, "reference-locked");
  assert.equal(locked.tone, "info");
  assert.equal(deleted.kind, "reference-deleted");
  assert.match(deleted.detail, /80 kg x 8/);
});
