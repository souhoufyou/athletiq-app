import test from "node:test";
import assert from "node:assert/strict";
import { CURRENT_SETTINGS_SCHEMA_VERSION, normalizeUserSettings } from "@/lib/settingsSchema";
import type { UserSettings } from "@/types/training";

const defaults: UserSettings = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  athleteName: "Default",
  sex: "prefer-not-to-say",
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
  mainGoal: "Recomposition",
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
  loadBiasByPattern: {},
  exerciseSwapPreferences: {},
  setBiasByPattern: {},
  repBiasByPattern: {},
  restBiasByPattern: {},
  sessionDurationPreference: "standard"
};

test("normalizes legacy settings to the current schema", () => {
  const migrated = normalizeUserSettings(
    {
      athleteName: "Sofiane",
      currentWeightKg: 93.5,
      targetWeightKg: 84,
      judoDays: ["monday", "friday"],
      watchPoints: ["Poignet droit a surveiller"],
      medicalNotes: "Apnee du sommeil moderee"
    },
    defaults
  );

  assert.equal(migrated.schemaVersion, CURRENT_SETTINGS_SCHEMA_VERSION);
  assert.equal(migrated.athleteName, "Sofiane");
  assert.deepEqual(migrated.judoDays, ["monday", "friday"]);
  assert.equal(migrated.externalSports[0].name, "Judo");
  assert.equal(migrated.constraints.some((constraint) => constraint.area === "wrist"), true);
  assert.equal(migrated.medicalNotes, "Apnee du sommeil moderee");
});

test("invalid array fields fall back to safe defaults", () => {
  const migrated = normalizeUserSettings(
    {
      athleteName: "Test",
      judoDays: ["monday", "not-a-day" as never],
      preferences: "machines" as never,
      availableDays: undefined
    },
    defaults
  );

  assert.deepEqual(migrated.judoDays, ["monday"]);
  assert.deepEqual(migrated.preferences, []);
  assert.deepEqual(migrated.availableDays, defaults.availableDays);
});

test("preserves explicit external sports and strength references", () => {
  const migrated = normalizeUserSettings(
    {
      externalSports: [
        {
          id: "football",
          name: "Football",
          days: ["sunday"],
          intensity: "moderate"
        }
      ],
      strengthReferences: [
        {
          lift: "Developpe couche",
          value: "80 kg x 5",
          estimatedOneRepMaxKg: 93,
          confidence: "estimated",
          origin: "learned",
          locked: true
        }
      ],
      loadBiasByPattern: {
        "shoulders-compound": -0.04
      },
      exerciseSwapPreferences: {
        "ex-bench-barbell": "ex-bench-incline-machine"
      },
      setBiasByPattern: {
        "chest-compound": -0.5
      },
      repBiasByPattern: {
        "chest-compound": -1
      },
      restBiasByPattern: {
        "shoulders-compound": 1
      },
      calibrationEvents: [
        {
          id: "event-1",
          createdAt: "2026-04-29T08:30:00.000Z",
          kind: "reference-learned",
          tone: "progress",
          title: "Repere appris",
          subject: "Developpe couche",
          detail: "Repere appris automatiquement a 80 kg x 5."
        }
      ]
    },
    defaults
  );

  assert.equal(migrated.externalSports[0].id, "football");
  assert.equal(migrated.strengthReferences[0].estimatedOneRepMaxKg, 93);
  assert.equal(migrated.strengthReferences[0].confidence, "estimated");
  assert.equal(migrated.strengthReferences[0].origin, "learned");
  assert.equal(migrated.strengthReferences[0].locked, true);
  assert.equal(migrated.loadBiasByPattern?.["shoulders-compound"], -0.04);
  assert.equal(migrated.exerciseSwapPreferences?.["ex-bench-barbell"], "ex-bench-incline-machine");
  assert.equal(migrated.setBiasByPattern?.["chest-compound"], -0.5);
  assert.equal(migrated.repBiasByPattern?.["chest-compound"], -1);
  assert.equal(migrated.restBiasByPattern?.["shoulders-compound"], 1);
  assert.equal(migrated.calibrationEvents?.[0].kind, "reference-learned");
  assert.equal(migrated.calibrationEvents?.[0].subject, "Developpe couche");
});
