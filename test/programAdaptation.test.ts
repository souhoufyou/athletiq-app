import test from "node:test";
import assert from "node:assert/strict";
import { adaptProgramAfterSession } from "@/lib/programAdaptation";
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
    exercises: [
      {
        id: "bench",
        name: "Developpe couche",
        target: "4 x 8-10",
        plannedLoad: "80 kg",
        rest: "90 s",
        cue: "Controle"
      }
    ]
  },
  {
    id: "session-b",
    weekday: "wednesday",
    title: "B",
    focus: "Push",
    duration: "60 min",
    intensity: "Soutenue",
    exercises: [
      {
        id: "bench",
        name: "Developpe couche",
        target: "4 x 8-10",
        plannedLoad: "80 kg",
        rest: "90 s",
        cue: "Controle"
      }
    ]
  }
];

const threeDayProgram: PlannedSession[] = [
  program[0],
  program[1],
  {
    id: "session-c",
    weekday: "friday",
    title: "C",
    focus: "Legs",
    duration: "60 min",
    intensity: "Modérée",
    exercises: [
      {
        id: "leg-press",
        name: "Presse a cuisses",
        target: "4 x 10-12",
        plannedLoad: "180 kg",
        rest: "90 s",
        cue: "Controle"
      }
    ]
  }
];

test("hard session reduces next session stress", () => {
  const completed = makeCompletedSession({
    difficulty: 9,
    energy: 3,
    status: "hard"
  });

  const adapted = adaptProgramAfterSession(program, completed, settings);

  assert.equal(adapted[1].intensity, "Modérée");
  assert.equal(adapted[1].exercises[0].target, "3 x 8-10");
  assert.equal(adapted[1].exercises[0].plannedLoad, "76 kg");
  assert.match(adapted[1].notes?.join(" ") ?? "", /trop dure/);
});

test("repeated hard sessions trigger a stronger trend deload", () => {
  const completed = makeCompletedSession({
    difficulty: 9,
    energy: 3,
    status: "hard"
  });
  const previousHard = makeCompletedSession({
    difficulty: 8,
    energy: 4,
    id: "completed-previous-hard",
    status: "hard"
  });

  const adapted = adaptProgramAfterSession(program, completed, settings, [completed, previousHard]);

  assert.notEqual(adapted[1].intensity, "Soutenue");
  assert.equal(adapted[1].exercises[0].plannedLoad, "70,5 kg");
  assert.match(adapted[1].notes?.join(" ") ?? "", /fatigue repetee|Seance allegee/i);
});

test("global deload week lightens every upcoming session in the cycle", () => {
  const completed = makeCompletedSession({
    difficulty: 9,
    energy: 3,
    status: "hard"
  });
  const previousHard = makeCompletedSession({
    difficulty: 8,
    energy: 4,
    id: "completed-global-hard",
    status: "hard"
  });

  const adapted = adaptProgramAfterSession(threeDayProgram, completed, settings, [completed, previousHard]);

  assert.match(adapted[1].notes?.join(" ") ?? "", /Semaine plus legere/i);
  assert.match(adapted[2].notes?.join(" ") ?? "", /Semaine plus legere/i);
  assert.equal(adapted[1].exercises[0].plannedLoad, "70,5 kg");
  assert.equal(adapted[2].exercises[0].plannedLoad, "162 kg");
  assert.equal(adapted[2].exercises[0].target, "3 x 10-12");
});

test("repeated maintain decisions vary the stagnant exercise stimulus", () => {
  const completed = makeCompletedSession({
    difficulty: 5,
    energy: 7,
    progressionDecision: "maintenir",
    status: "ok"
  });
  const previousA = makeCompletedSession({
    difficulty: 5,
    energy: 7,
    id: "completed-maintain-a",
    progressionDecision: "maintenir",
    status: "ok"
  });
  const previousB = makeCompletedSession({
    difficulty: 5,
    energy: 7,
    id: "completed-maintain-b",
    progressionDecision: "maintenir",
    status: "ok"
  });

  const adapted = adaptProgramAfterSession(program, completed, settings, [completed, previousA, previousB]);

  assert.equal(adapted[1].exercises[0].target, "4 x 10-12");
  assert.match(adapted[1].exercises[0].cue, /stagnation/i);
  assert.match(adapted[1].notes?.join(" ") ?? "", /Stimulus|Stagnation/i);
});

test("repeated hard and down decisions trigger a local deload on the next exposure", () => {
  const completed = makeCompletedSession({
    difficulty: 8,
    energy: 4,
    progressionDecision: "maintenir",
    status: "hard"
  });
  const previousA = makeCompletedSession({
    difficulty: 8,
    energy: 3,
    id: "completed-deload-a",
    progressionDecision: "baisser",
    status: "hard"
  });
  const previousB = makeCompletedSession({
    difficulty: 7,
    energy: 4,
    id: "completed-deload-b",
    progressionDecision: "baisser",
    status: "hard"
  });

  const adapted = adaptProgramAfterSession(program, completed, settings, [completed, previousA, previousB]);

  assert.equal(adapted[1].exercises[0].target, "3 x 8-10");
  assert.equal(adapted[1].exercises[0].plannedLoad, "70,5 kg");
  assert.match(adapted[1].exercises[0].cue, /Seance allegee/i);
  assert.match(adapted[1].notes?.join(" ") ?? "", /Seance allegee/i);
});

test("fat loss goal drift increases easy cardio dose on next session", () => {
  const cardioProgram: PlannedSession[] = [
    program[0],
    {
      ...program[1],
      exercises: [
        {
          id: "cardio-z2",
          name: "Tapis incline zone 2",
          target: "20-30 min",
          rest: "Libre",
          cue: "Souffle propre.",
          muscleGroups: ["cardio"],
          classification: "cardio",
          taxonomy: { pattern: "cardio-steady" }
        }
      ]
    }
  ];
  const completed = makeCompletedSession({
    difficulty: 5,
    energy: 7,
    progressionDecision: "maintenir",
    status: "ok"
  });
  const previous = makeCompletedSession({
    difficulty: 5,
    energy: 7,
    id: "completed-weight-flat",
    progressionDecision: "maintenir",
    status: "ok"
  });

  const adapted = adaptProgramAfterSession(
    cardioProgram,
    completed,
    {
      ...settings,
      primaryGoal: "perte-gras",
      weightLog: [
        { date: "2026-04-28", kg: 80.2 },
        { date: "2026-04-25", kg: 80.1 },
        { date: "2026-04-22", kg: 80.1 },
        { date: "2026-04-19", kg: 80 }
      ]
    },
    [completed, previous]
  );

  assert.equal(adapted[1].exercises[0].target, "25-35 min");
  assert.match(adapted[1].notes?.join(" ") ?? "", /poids stable|cardio doux/i);
});

test("pain replacement is applied to future occurrences of the same exercise", () => {
  const completed = makeCompletedSession({
    difficulty: 6,
    energy: 6,
    globalPain: 5,
    status: "pain",
    replacementSuggestion: "Chest press prise neutre"
  });

  const adapted = adaptProgramAfterSession(program, completed, settings);

  assert.match(adapted[1].exercises[0].name, /Alternative/);
  assert.match(adapted[1].exercises[0].cue, /Chest press prise neutre/);
  assert.equal(adapted[1].intensity, "Modérée");
});

function makeCompletedSession({
  difficulty,
  energy,
  globalPain = 0,
  id = "completed-a",
  progressionDecision,
  replacementSuggestion,
  status
}: {
  difficulty: number;
  energy: number;
  globalPain?: number;
  id?: string;
  progressionDecision?: "augmenter" | "maintenir" | "baisser" | "remplacer" | "alerte";
  replacementSuggestion?: string;
  status: "easy" | "hard" | "ok" | "pain";
}): CompletedSession {
  return {
    dateKey: "2026-04-27",
    sessionId: "session-a",
    startedAt: "2026-04-27T10:00:00.000Z",
    logs: {
      bench: {
        exerciseId: "bench",
        status,
        usedLoad: "80 kg",
        completedReps: "8/7/6/5",
        comment: status === "pain" ? "douleur poignet" : "trop dur"
      }
    },
    feedback: {
      difficulty,
      globalPain,
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
    id,
    completedAt: "2026-04-27T11:00:00.000Z",
    title: "A",
    focus: "Push",
    mainExercises: ["Developpe couche"],
    progressions: {
      bench: {
        exerciseId: "bench",
        exerciseName: "Developpe couche",
        nextLoad: "72 kg",
        nextTarget: "3 x 8-10",
        decision: progressionDecision ?? (replacementSuggestion ? "remplacer" : "baisser"),
        reason: "Test",
        replacementSuggestion
      }
    },
    nextSessionTitle: "B",
    nextSessionDateKey: "2026-04-29",
    totalDurationMs: 3600000,
    exerciseDurationsMs: {}
  };
}
