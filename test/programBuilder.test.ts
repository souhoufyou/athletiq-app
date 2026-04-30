import test from "node:test";
import assert from "node:assert/strict";
import { buildProgram } from "@/lib/programBuilder";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { UserSettings } from "@/types/training";

const baseSettings: UserSettings = {
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

test("program frequency controls number of generated sessions", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(program.length, 3);
  assert.deepEqual(program.map((session) => session.title), ["Push", "Pull", "Legs"]);
});

test("judo days are avoided when there are enough free days", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "recomposition",
    weeklyFrequency: 3,
    judoDays: ["monday", "friday"],
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(program.length, 3);
  assert.equal(program.some((session) => session.weekday === "monday" || session.weekday === "friday"), false);
});

test("available days cap and place generated sessions", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 5,
    availableDays: ["tuesday", "saturday"],
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(program.length, 2);
  assert.deepEqual(program.map((session) => session.weekday), ["tuesday", "saturday"]);
});

test("external sports are avoided when enough available days remain", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "recomposition",
    weeklyFrequency: 3,
    availableDays: ["monday", "tuesday", "wednesday", "thursday"],
    externalSports: [
      {
        id: "judo",
        name: "Judo",
        days: ["monday"],
        intensity: "high"
      }
    ],
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(program.some((session) => session.weekday === "monday"), false);
});

test("different goals produce different program structures", () => {
  const mass = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });
  const fatLoss = buildProgram({
    ...baseSettings,
    primaryGoal: "perte-gras",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.notDeepEqual(
    mass.map((session) => session.title),
    fatLoss.map((session) => session.title)
  );
  assert.equal(fatLoss.some((session) => /cardio/i.test(`${session.title} ${session.focus}`)), true);
});

test("female mass profile prioritizes lower-body support earlier than the default male split", () => {
  const male = buildProgram({
    ...baseSettings,
    sex: "male",
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });
  const female = buildProgram({
    ...baseSettings,
    sex: "female",
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.deepEqual(male.map((session) => session.title), ["Push", "Pull", "Legs", "Upper volume"]);
  assert.equal(female[0].title, "Push");
  assert.equal(female[1].title, "Legs");
  assert.equal(female.some((session) => session.title === "Lower volume"), true);
  assert.equal(female.some((session) => session.title === "Upper volume"), false);
});

test("performance profile with high external sport avoids conditioning too early", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "performance",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    externalSports: [
      {
        id: "judo",
        name: "Judo",
        days: ["monday", "thursday"],
        intensity: "high"
      }
    ]
  });

  assert.equal(program.some((session) => /Conditionnement/i.test(session.title)), false);
  assert.equal(program.some((session) => session.phase === "maintenance"), true);
});

test("fat loss with limited recovery prefers steady work over HIIT at low frequency", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "perte-gras",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    recoveryProfile: "poor"
  });

  assert.deepEqual(program.map((session) => session.title), ["Full body A", "Cardio steady-state"]);
});

test("beginner experience reduces set count on generated targets", () => {
  const beginner = buildProgram({
    ...baseSettings,
    primaryGoal: "performance",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "debutant"
  });
  const intermediate = buildProgram({
    ...baseSettings,
    primaryGoal: "performance",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.match(intermediate[0].exercises[0].target, /^4 x/);
  assert.match(beginner[0].exercises[0].target, /^3 x/);
});

test("beginner low-frequency mass plan switches to simpler full-body structure", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "debutant"
  });

  assert.deepEqual(program.map((session) => session.title), ["Full body A", "Full body B", "Full body C"]);
  assert.equal(program.every((session) => session.exercises.length <= 4), true);
  assert.equal(program.every((session) => session.mesocycleLength === 4), true);
});

test("advanced long sessions add more specialization volume", () => {
  const standard = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    sessionDurationPreference: "standard"
  });
  const advancedLong = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "avance",
    sessionDurationPreference: "long"
  });

  assert.equal(advancedLong[0].duration, "70-85 min");
  assert.ok(advancedLong[0].exercises.length > standard[0].exercises.length);
  assert.equal(advancedLong.every((session) => session.deloadEvery === 4), true);
  assert.equal(advancedLong.every((session) => session.mesocycleLength === 7), true);
});

test("short sessions reduce exercise count and duration", () => {
  const standard = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    sessionDurationPreference: "standard",
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });
  const short = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    sessionDurationPreference: "short",
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(short[0].duration, "35-45 min");
  assert.ok(short[0].exercises.length < standard[0].exercises.length);
});

test("avoid list removes matching exercises", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    avoid: ["dips"],
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  const names = program.flatMap((session) => session.exercises.map((exercise) => exercise.name.toLowerCase()));
  assert.equal(names.some((name) => name.includes("dips")), false);
});

test("wrist constraint avoids the most wrist-demanding chest-compound option", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "recomposition",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    constraints: [
      {
        id: "constraint-wrist",
        area: "wrist",
        label: "Poignet sensible",
        severity: "caution"
      }
    ]
  });

  assert.notEqual(program[0].exercises[0].id, "ex-bench-barbell");
});

test("back constraint prefers a friendlier hinge pattern than romanian deadlift", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    constraints: [
      {
        id: "constraint-back",
        area: "back",
        label: "Bas du dos sensible",
        severity: "caution"
      }
    ]
  });

  const hinge = program.flatMap((session) => session.exercises).find((exercise) => exercise.taxonomy?.pattern === "legs-hinge");
  assert.equal(hinge?.id, "ex-hip-thrust");
});

test("shoulder constraint favors the guided shoulder press over overhead press", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "performance",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    constraints: [
      {
        id: "constraint-shoulder",
        area: "shoulder",
        label: "Epaule a surveiller",
        severity: "caution"
      }
    ]
  });

  const shoulderCompound = program
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.taxonomy?.pattern === "shoulders-compound");
  assert.equal(shoulderCompound?.id, "ex-machine-shoulder-press");
  assert.equal(
    shoulderCompound?.selectionInsight?.reasons.some((reason) => /epaule/i.test(reason.title)),
    true
  );
});

test("limited recovery leaves a visible rationale on stable variations", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    recoveryProfile: "poor"
  });

  const explainedExercise = program.flatMap((session) => session.exercises).find((exercise) =>
    exercise.selectionInsight?.reasons.some((reason) => /recuperation protegee/i.test(reason.title))
  );

  assert.ok(explainedExercise);
});

test("remembered swaps replace the default exercise when the same slot comes back", () => {
  const defaultProgram = buildProgram({
    ...baseSettings,
    primaryGoal: "performance",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  const defaultShoulderCompound = defaultProgram
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.taxonomy?.pattern === "shoulders-compound");
  assert.equal(defaultShoulderCompound?.id, "ex-overhead-press");

  const learnedProgram = buildProgram({
    ...baseSettings,
    primaryGoal: "performance",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    exerciseSwapPreferences: {
      "ex-overhead-press": "ex-machine-shoulder-press"
    }
  });

  const learnedShoulderCompound = learnedProgram
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.taxonomy?.pattern === "shoulders-compound");
  assert.equal(learnedShoulderCompound?.id, "ex-machine-shoulder-press");
});

test("set bias by pattern reduces series on regenerated slots", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    setBiasByPattern: {
      "chest-compound": -0.5
    }
  });

  const chestCompound = program[0].exercises.find((exercise) => exercise.taxonomy?.pattern === "chest-compound");
  assert.match(chestCompound?.target ?? "", /^3 x/);
});

test("rep bias by pattern shifts regenerated slots toward lower reps", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    repBiasByPattern: {
      "chest-compound": -1
    }
  });

  const chestCompound = program[0].exercises.find((exercise) => exercise.taxonomy?.pattern === "chest-compound");
  assert.equal(chestCompound?.target, "4 x 6-8");
});

test("rest bias by pattern increases rest on regenerated slots", () => {
  const program = buildProgram({
    ...baseSettings,
    primaryGoal: "performance",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire",
    restBiasByPattern: {
      "shoulders-compound": 1
    }
  });

  const shoulderCompound = program
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.taxonomy?.pattern === "shoulders-compound");
  assert.equal(shoulderCompound?.rest, "2 min 15");
});

test("sex and bodyweight calibrate conservative starting loads when no strength reference exists", () => {
  const female = buildProgram({
    ...baseSettings,
    sex: "female",
    benchOneRepMaxKg: 0,
    strengthReferences: [],
    primaryGoal: "recomposition",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });
  const male = buildProgram({
    ...baseSettings,
    sex: "male",
    benchOneRepMaxKg: 0,
    strengthReferences: [],
    primaryGoal: "recomposition",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  const femaleLoad = Number(female[0].exercises[0].plannedLoad?.match(/\d+(?:,\d+)?/)?.[0].replace(",", "."));
  const maleLoad = Number(male[0].exercises[0].plannedLoad?.match(/\d+(?:,\d+)?/)?.[0].replace(",", "."));

  assert.ok(Number.isFinite(femaleLoad));
  assert.ok(Number.isFinite(maleLoad));
  assert.ok(maleLoad > femaleLoad);
});

test("bench one rep max calibrates chest-compound planned load", () => {
  const program = buildProgram({
    ...baseSettings,
    benchOneRepMaxKg: 120,
    strengthReferences: [],
    primaryGoal: "recomposition",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(program[0].exercises[0].plannedLoad, "87,5 kg");
});

test("working-set strength references calibrate generated loads through estimated one rep max", () => {
  const program = buildProgram({
    ...baseSettings,
    benchOneRepMaxKg: 0,
    strengthReferences: [
      {
        lift: "Developpe couche",
        value: "100 kg x 5",
        loadKg: 100,
        reps: 5,
        estimatedOneRepMaxKg: 116.7,
        confidence: "estimated"
      }
    ],
    primaryGoal: "recomposition",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(program[0].exercises[0].plannedLoad, "85 kg");
});

test("latest learned chest reference can override an older bench seed value", () => {
  const program = buildProgram({
    ...baseSettings,
    benchOneRepMaxKg: 100,
    strengthReferences: [
      {
        lift: "Developpe couche barre",
        value: "80 kg x 8",
        loadKg: 80,
        reps: 8,
        estimatedOneRepMaxKg: 101.3,
        confidence: "estimated",
        lastTestedAt: "2026-04-29T11:00:00.000Z"
      }
    ],
    primaryGoal: "recomposition",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.equal(program[0].exercises[0].plannedLoad, "72,5 kg");
});

test("baseline-only loads are marked as estimates and rounded coarsely", () => {
  const program = buildProgram({
    ...baseSettings,
    sex: "male",
    benchOneRepMaxKg: 0,
    strengthReferences: [],
    primaryGoal: "recomposition",
    weeklyFrequency: 2,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  assert.match(program[0].exercises[0].plannedLoad ?? "", /^env\. \d+ kg$/);
});

test("accessory dumbbell-style loads are scaled to the implement, not copied from machine totals", () => {
  const program = buildProgram({
    ...baseSettings,
    sex: "male",
    benchOneRepMaxKg: 0,
    strengthReferences: [],
    primaryGoal: "prise-masse",
    weeklyFrequency: 3,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });
  const goblet = program.flatMap((session) => session.exercises).find((exercise) => exercise.id === "ex-goblet-squat");

  assert.equal(goblet?.plannedLoad, "env. 35 kg");
});

test("pattern load bias makes future generated loads more conservative", () => {
  const standard = buildProgram({
    ...baseSettings,
    benchOneRepMaxKg: 116.7,
    strengthReferences: [],
    loadBiasByPattern: {},
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });
  const adjusted = buildProgram({
    ...baseSettings,
    benchOneRepMaxKg: 116.7,
    strengthReferences: [],
    loadBiasByPattern: { "shoulders-compound": -0.08 },
    primaryGoal: "prise-masse",
    weeklyFrequency: 4,
    equipment: "salle-complete",
    experienceLevel: "intermediaire"
  });

  const standardShoulders = standard
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.taxonomy?.pattern === "shoulders-compound");
  const adjustedShoulders = adjusted
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.taxonomy?.pattern === "shoulders-compound");

  assert.equal(standardShoulders?.plannedLoad, "env. 40 kg");
  assert.equal(adjustedShoulders?.plannedLoad, "env. 35 kg");
});
