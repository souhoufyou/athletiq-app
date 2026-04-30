import test from "node:test";
import assert from "node:assert/strict";
import { adaptSettingsAfterSession } from "@/lib/profileAdaptation";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { CompletedSession, PlannedSession, UserSettings } from "@/types/training";

const settings: UserSettings = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  athleteName: "Test",
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
  mainGoal: "Test",
  cardioLevel: "Modere",
  sleepQuality: "Regulier",
  recoveryProfile: "regular",
  medicalNotes: "",
  watchPoints: [],
  preferences: [],
  avoid: [],
  availableDays: ["monday", "wednesday"],
  externalSports: [],
  constraints: [],
  strengthReferences: [],
  loadBiasByPattern: {},
  setBiasByPattern: {},
  repBiasByPattern: {},
  restBiasByPattern: {},
  sessionDurationPreference: "standard"
};

test("pain feedback becomes a profile constraint and irregular recovery", () => {
  const next = adaptSettingsAfterSession(settings, makeCompletedSession("pain", 6, 5, "douleur poignet"));

  assert.equal(next.recoveryProfile, "irregular");
  assert.equal(next.constraints.length, 1);
  assert.equal(next.constraints[0].area, "wrist");
  assert.match(next.watchPoints.join(" "), /Douleur sur Developpe couche/);
});

test("easy sessions can recover an irregular recovery profile", () => {
  const next = adaptSettingsAfterSession(
    { ...settings, recoveryProfile: "irregular" },
    makeCompletedSession("easy", 3, 8, "")
  );

  assert.equal(next.recoveryProfile, "regular");
});

test("repeated successful compound sessions create a learned strength reference", () => {
  const session: PlannedSession = {
    id: "session-a",
    weekday: "monday",
    title: "Push",
    focus: "Chest",
    duration: "60 min",
    intensity: "Soutenue",
    exercises: [
      {
        id: "bench",
        name: "Developpe couche barre",
        target: "4 x 8",
        plannedLoad: "80 kg",
        rest: "2 min",
        cue: "Controle",
        taxonomy: { pattern: "chest-compound", isCompound: true }
      }
    ]
  };
  const current = makeCompletedSession("ok", 5, 7, "");
  const previous = {
    ...makeCompletedSession("easy", 4, 8, ""),
    id: "completed-b",
    completedAt: "2026-04-24T11:00:00.000Z",
    dateKey: "2026-04-24"
  };

  const next = adaptSettingsAfterSession(
    { ...settings, benchOneRepMaxKg: 0 },
    current,
    session,
    [current, previous]
  );

  assert.equal(next.strengthReferences.length, 1);
  assert.equal(next.strengthReferences[0].lift, "Developpe couche barre");
  assert.equal(next.strengthReferences[0].estimatedOneRepMaxKg, 101.3);
  assert.equal(next.benchOneRepMaxKg, 101.3);
  assert.equal(next.calibrationEvents?.[0].kind, "reference-learned");
  assert.match(next.calibrationEvents?.[0].detail ?? "", /80 kg x 8/);
});

test("locked manual references are preserved over automatic learning", () => {
  const session: PlannedSession = {
    id: "session-a",
    weekday: "monday",
    title: "Push",
    focus: "Chest",
    duration: "60 min",
    intensity: "Soutenue",
    exercises: [
      {
        id: "bench",
        name: "Developpe couche barre",
        target: "4 x 8",
        plannedLoad: "80 kg",
        rest: "2 min",
        cue: "Controle",
        taxonomy: { pattern: "chest-compound", isCompound: true }
      }
    ]
  };
  const current = makeCompletedSession("ok", 5, 7, "");
  const previous = {
    ...makeCompletedSession("easy", 4, 8, ""),
    id: "completed-c",
    completedAt: "2026-04-24T11:00:00.000Z",
    dateKey: "2026-04-24"
  };

  const next = adaptSettingsAfterSession(
    {
      ...settings,
      strengthReferences: [
        {
          lift: "Developpe couche",
          value: "90 kg x 5",
          loadKg: 90,
          reps: 5,
          estimatedOneRepMaxKg: 105,
          confidence: "measured",
          origin: "manual",
          locked: true
        }
      ]
    },
    current,
    session,
    [current, previous]
  );

  assert.equal(next.strengthReferences[0].estimatedOneRepMaxKg, 105);
  assert.equal(next.strengthReferences[0].locked, true);
  assert.equal(next.strengthReferences[0].origin, "manual");
});

test("hard feedback lowers future set bias for the matching pattern", () => {
  const session: PlannedSession = {
    id: "session-a",
    weekday: "monday",
    title: "Push",
    focus: "Chest",
    duration: "60 min",
    intensity: "Soutenue",
    exercises: [
      {
        id: "bench",
        name: "Developpe couche barre",
        target: "4 x 8",
        plannedLoad: "80 kg",
        rest: "2 min",
        cue: "Controle",
        taxonomy: { pattern: "chest-compound", isCompound: true }
      }
    ]
  };

  const next = adaptSettingsAfterSession(settings, makeCompletedSession("hard", 8, 4, ""), session);

  assert.equal(next.setBiasByPattern?.["chest-compound"], -0.5);
});

test("hard feedback lowers future rep bias for the matching pattern", () => {
  const session: PlannedSession = {
    id: "session-a",
    weekday: "monday",
    title: "Push",
    focus: "Chest",
    duration: "60 min",
    intensity: "Soutenue",
    exercises: [
      {
        id: "bench",
        name: "Developpe couche barre",
        target: "4 x 8-10",
        plannedLoad: "80 kg",
        rest: "2 min",
        cue: "Controle",
        taxonomy: { pattern: "chest-compound", isCompound: true }
      }
    ]
  };

  const next = adaptSettingsAfterSession(settings, makeCompletedSession("hard", 8, 4, ""), session);

  assert.equal(next.repBiasByPattern?.["chest-compound"], -1);
});

test("hard feedback increases future rest bias for the matching pattern", () => {
  const session: PlannedSession = {
    id: "session-a",
    weekday: "monday",
    title: "Push",
    focus: "Chest",
    duration: "60 min",
    intensity: "Soutenue",
    exercises: [
      {
        id: "bench",
        name: "Developpe couche barre",
        target: "4 x 8-10",
        plannedLoad: "80 kg",
        rest: "90 s",
        cue: "Controle",
        taxonomy: { pattern: "chest-compound", isCompound: true }
      }
    ]
  };

  const next = adaptSettingsAfterSession(settings, makeCompletedSession("hard", 8, 4, ""), session);

  assert.equal(next.restBiasByPattern?.["chest-compound"], 1);
});

function makeCompletedSession(
  status: "easy" | "hard" | "ok" | "pain",
  difficulty: number,
  energy: number,
  comment: string
): CompletedSession {
  return {
    dateKey: "2026-04-27",
    sessionId: "session-a",
    startedAt: "2026-04-27T10:00:00.000Z",
    logs: {
      bench: {
        exerciseId: "bench",
        status,
        usedLoad: "80 kg",
        completedReps: "8/8/8/8",
        comment
      }
    },
    feedback: {
      difficulty,
      globalPain: status === "pain" ? 4 : 0,
      energy,
      breath: "correct"
    },
    timer: {
      startedAt: "2026-04-27T10:00:00.000Z",
      isPaused: false,
      pausedTotalMs: 0
    },
    timing: {
      elapsedByExerciseMs: {}
    },
    id: "completed-a",
    completedAt: "2026-04-27T11:00:00.000Z",
    title: "A",
    focus: "Push",
    mainExercises: ["Developpe couche"],
    progressions: {
      bench: {
        exerciseId: "bench",
        exerciseName: "Developpe couche",
        nextLoad: "80 kg",
        nextTarget: "4 x 8-10",
        decision: status === "pain" ? "remplacer" : "maintenir",
        reason: "Test",
        replacementSuggestion: status === "pain" ? "Chest press prise neutre" : undefined
      }
    },
    nextSessionTitle: "B",
    nextSessionDateKey: "2026-04-29",
    totalDurationMs: 3600000,
    exerciseDurationsMs: {}
  };
}
