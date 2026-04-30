import test from "node:test";
import assert from "node:assert/strict";
import { getTrainingTrendReport } from "@/lib/trainingTrends";
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
  sessionDurationPreference: "standard"
};

const program: PlannedSession[] = [
  {
    id: "session-a",
    weekday: "monday",
    title: "A",
    focus: "Push",
    duration: "60 min",
    intensity: "Soutenue",
    exercises: []
  },
  {
    id: "session-b",
    weekday: "wednesday",
    title: "B",
    focus: "Pull",
    duration: "60 min",
    intensity: "Modérée",
    exercises: []
  }
];

test("trend report waits for repeated evidence before strong conclusions", () => {
  const report = getTrainingTrendReport([makeSession({ index: 0, status: "hard", difficulty: 9, energy: 3 })], program, settings);

  assert.equal(report.confidence, "basse");
  assert.equal(report.items.length, 0);
  assert.match(report.summary, /attend/i);
});

test("repeated pain becomes a critical replacement trend", () => {
  const report = getTrainingTrendReport(
    [
      makeSession({ index: 0, status: "pain", globalPain: 4, comment: "douleur poignet" }),
      makeSession({ index: 1, status: "pain", globalPain: 4, comment: "douleur poignet encore" }),
      makeSession({ index: 2, status: "ok" })
    ],
    program,
    settings
  );

  const painTrend = report.items.find((item) => item.kind === "pain-repeat");

  assert.equal(painTrend?.severity, "critical");
  assert.equal(painTrend?.action, "replace_exercise");
  assert.match(painTrend?.detail ?? "", /poignet/i);
});

test("two hard sessions create a deload trend", () => {
  const report = getTrainingTrendReport(
    [
      makeSession({ index: 0, status: "hard", difficulty: 9, energy: 3 }),
      makeSession({ index: 1, status: "hard", difficulty: 8, energy: 4 }),
      makeSession({ index: 2, status: "ok" })
    ],
    program,
    settings
  );

  const hardTrend = report.items.find((item) => item.kind === "hard-run");

  assert.equal(hardTrend?.action, "deload_next_week");
  assert.match(report.summary, /recuperer|reduire/i);
});

test("repeated easy sessions propose cautious progression", () => {
  const report = getTrainingTrendReport(
    [
      makeSession({ index: 0, status: "easy", difficulty: 3, energy: 8 }),
      makeSession({ index: 1, status: "easy", difficulty: 4, energy: 8 }),
      makeSession({ index: 2, status: "ok" })
    ],
    program,
    settings
  );

  const easyTrend = report.items.find((item) => item.kind === "easy-run");

  assert.equal(easyTrend?.severity, "positive");
  assert.equal(easyTrend?.action, "increase_progression");
});

test("stable fat loss weight creates goal drift trend", () => {
  const report = getTrainingTrendReport(
    [
      makeSession({ index: 0, status: "ok" }),
      makeSession({ index: 1, status: "ok" })
    ],
    program,
    {
      ...settings,
      primaryGoal: "perte-gras",
      weightLog: [
        { date: "2026-04-28", kg: 80.2 },
        { date: "2026-04-25", kg: 80.1 },
        { date: "2026-04-22", kg: 80.1 },
        { date: "2026-04-19", kg: 80 }
      ]
    }
  );

  const goalTrend = report.items.find((item) => item.kind === "goal-drift");

  assert.equal(goalTrend?.action, "adjust_goal");
  assert.match(goalTrend?.detail ?? "", /perte de gras/i);
});

test("three maintain decisions create a stagnation trend", () => {
  const report = getTrainingTrendReport(
    [
      makeSession({ index: 0, status: "ok", progressionDecision: "maintenir" }),
      makeSession({ index: 1, status: "ok", progressionDecision: "maintenir" }),
      makeSession({ index: 2, status: "ok", progressionDecision: "maintenir" })
    ],
    program,
    settings
  );

  const stagnation = report.items.find((item) => item.kind === "stagnation");

  assert.equal(stagnation?.action, "vary_stimulus");
  assert.match(stagnation?.detail ?? "", /maintien/i);
});

function makeSession({
  comment = "",
  difficulty = 5,
  energy = 6,
  globalPain = 0,
  index,
  progressionDecision,
  status
}: {
  comment?: string;
  difficulty?: number;
  energy?: number;
  globalPain?: number;
  index: number;
  progressionDecision?: "augmenter" | "maintenir" | "baisser" | "remplacer" | "alerte";
  status: "easy" | "hard" | "ok" | "pain";
}): CompletedSession {
  const date = `2026-04-${String(28 - index).padStart(2, "0")}`;

  return {
    dateKey: date,
    sessionId: "session-a",
    startedAt: `${date}T10:00:00.000Z`,
    logs: {
      bench: {
        exerciseId: "bench",
        status,
        usedLoad: "80 kg",
        completedReps: status === "hard" ? "8/6/4/0" : "8/8/8/8",
        comment
      }
    },
    feedback: {
      difficulty,
      globalPain,
      energy,
      breath: "correct"
    },
    timer: {
      startedAt: `${date}T10:00:00.000Z`,
      isPaused: false,
      pausedTotalMs: 0
    },
    timing: {
      elapsedByExerciseMs: {}
    },
    id: `completed-${index}`,
    completedAt: `${date}T11:00:00.000Z`,
    title: `Seance ${index}`,
    focus: "Push",
    mainExercises: ["Developpe couche"],
    progressions: {
      bench: {
        exerciseId: "bench",
        exerciseName: "Developpe couche",
        nextLoad: "80 kg",
        nextTarget: "4 x 8-10",
        decision: progressionDecision ?? (status === "pain" ? "remplacer" : status === "hard" ? "baisser" : "augmenter"),
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
