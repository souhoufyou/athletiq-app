import test from "node:test";
import assert from "node:assert/strict";
import { getAdaptiveSnapshot } from "@/lib/adaptiveInsights";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { PlannedSession, UserSettings } from "@/types/training";

const settings: UserSettings = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  athleteName: "Test",
  sex: "female",
  loadUnit: "kg",
  currentWeightKg: 70,
  targetWeightKg: 65,
  benchOneRepMaxKg: 0,
  judoDays: [],
  cautionLevel: "normal",
  aiEnabled: false,
  darkMode: false,
  age: 30,
  heightCm: 170,
  gym: "",
  mainGoal: "Recomposition",
  cardioLevel: "Bon",
  sleepQuality: "Irregulier",
  recoveryProfile: "irregular",
  medicalNotes: "",
  watchPoints: ["poignet"],
  preferences: [],
  avoid: ["dips"],
  availableDays: ["monday", "wednesday", "friday"],
  externalSports: [{ id: "judo", name: "Judo", days: ["monday"], intensity: "high" }],
  constraints: [],
  strengthReferences: [],
  sessionDurationPreference: "standard"
};

const program: PlannedSession[] = [
  {
    id: "a",
    weekday: "wednesday",
    title: "A",
    focus: "Test",
    duration: "45 min",
    intensity: "Modérée",
    notes: ["Adaptation automatique: derniere seance trop dure, volume reduit sur cette seance."],
    exercises: []
  }
];

test("adaptive snapshot summarizes profile signals", () => {
  const snapshot = getAdaptiveSnapshot(settings, program, []);

  assert.equal(snapshot.recoveryLabel, "Irreguliere");
  assert.equal(snapshot.scheduleLabel, "1 seance / 3 jours");
  assert.equal(snapshot.externalSportsLabel, "Judo");
  assert.equal(snapshot.constraintsLabel, "2 signaux");
  assert.equal(snapshot.loadBasisLabel, "Estimation profil");
  assert.ok(snapshot.notes.some((note) => /volume reduit/i.test(note)));
});
