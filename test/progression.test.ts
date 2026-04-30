import test from "node:test";
import assert from "node:assert/strict";
import { weeklyProgram } from "@/data/program";
import { calculateProgression, summarizeProgressions } from "@/lib/progression";
import type { Exercise, PlannedSession } from "@/types/training";

const monday = weeklyProgram.find((session) => session.id === "monday-upper-force-judo")!;
const tuesday = weeklyProgram.find((session) => session.id === "tuesday-lower-cardio")!;
const friday = weeklyProgram.find((session) => session.id === "friday-shoulders-arms-judo")!;

const bench = monday.exercises.find((exercise) => exercise.id === "bench-press-5x5")!;
const legPress = tuesday.exercises.find((exercise) => exercise.id === "leg-press-5x10")!;
const romanianDeadlift = tuesday.exercises.find((exercise) => exercise.id === "rdl-or-hip-thrust")!;
const cardio = tuesday.exercises.find((exercise) => exercise.id === "incline-treadmill-zone-2")!;
const cableCurl = friday.exercises.find((exercise) => exercise.id === "cable-curl")!;
const hypertrophySession: PlannedSession = {
  id: "session-hypertrophy",
  weekday: "thursday",
  title: "Hypertrophie",
  focus: "Machines",
  duration: "60 min",
  intensity: "Modérée",
  exercises: []
};
const chestPressMachine: Exercise = {
  id: "chest-press-machine",
  name: "Chest press machine",
  target: "4 x 8-10",
  plannedLoad: "80 kg",
  rest: "90 s",
  cue: "Controle"
};

test("bench OK all sets proposes a conservative load increase", () => {
  const result = calculateProgression({
    plannedExercise: bench,
    performance: {
      usedLoad: "90 kg",
      completedReps: "5/5/5/5/5",
      comment: ""
    },
    feedback: "ok",
    sessionDifficulty: 7,
    globalPain: 1,
    energy: 7,
    breath: "correct",
    session: monday
  });

  assert.equal(result.decision, "augmenter");
  assert.equal(result.nextLoad, "92,5 kg");
  assert.equal(result.nextTarget, "5 x 5");
});

test("very easy leg press is capped by current guardrails", () => {
  const result = calculateProgression({
    plannedExercise: legPress,
    performance: {
      usedLoad: "180 kg",
      completedReps: "10/10/10/10/10",
      comment: "Tres facile, beaucoup plus possible."
    },
    feedback: "easy",
    sessionDifficulty: 5,
    globalPain: 1,
    energy: 8,
    breath: "bon",
    session: tuesday
  });

  assert.equal(result.decision, "augmenter");
  assert.equal(result.nextLoad, "182,5 kg");
  assert.match(result.warning ?? "", /plafonn/);
});

test("pain on hinge movement suggests replacement and blocks safety", () => {
  const result = calculateProgression({
    plannedExercise: romanianDeadlift,
    performance: {
      usedLoad: "100 kg",
      completedReps: "8/7/6/0",
      comment: "Douleur dos en bas du mouvement."
    },
    feedback: "pain",
    sessionDifficulty: 8,
    globalPain: 3,
    energy: 5,
    breath: "correct",
    session: tuesday
  });

  assert.equal(result.decision, "remplacer");
  assert.equal(result.nextLoad, "90 kg");
  assert.match(result.replacementSuggestion ?? "", /Hip thrust|leg curl/i);
  assert.equal(result.guardrailResult?.allowed, false);
  assert.equal(result.guardrailResult?.violations.some((violation) => violation.rule === "pain-block"), true);
});

test("cardio with oppression becomes a safety alert", () => {
  const result = calculateProgression({
    plannedExercise: cardio,
    performance: {
      usedLoad: "Tapis incline 8 %",
      completedReps: "20 min",
      comment: "Oppression inhabituelle."
    },
    feedback: "hard",
    sessionDifficulty: 9,
    globalPain: 1,
    energy: 4,
    breath: "oppression",
    session: tuesday
  });

  assert.equal(result.decision, "alerte");
  assert.equal(result.nextLoad, "Marche douce sur tapis incline");
  assert.match(result.warning ?? "", /Alerte securite|Reduire l'intensite/);
});

test("skipped exercise keeps prescription without penalizing the user", () => {
  const result = calculateProgression({
    plannedExercise: bench,
    performance: {
      usedLoad: "90 kg",
      completedReps: "",
      comment: ""
    },
    feedback: "skipped",
    sessionDifficulty: 6,
    globalPain: 0,
    energy: 6,
    breath: "correct",
    session: monday
  });

  assert.equal(result.decision, "maintenir");
  assert.equal(result.nextLoad, "90 kg");
  assert.equal(result.nextTarget, "5 x 5");
});

test("judo-night grip work blocks same-day load increase", () => {
  const result = calculateProgression(
    {
      plannedExercise: cableCurl,
      performance: {
        usedLoad: "20 kg",
        completedReps: "15/15/15",
        comment: "Facile."
      },
      feedback: "easy",
      sessionDifficulty: 5,
      globalPain: 0,
      energy: 8,
      breath: "bon",
      session: friday
    },
    { judoTonight: true }
  );

  assert.equal(result.decision, "maintenir");
  assert.equal(result.nextLoad, "20 kg");
  assert.equal(result.guardrailResult?.violations.some((violation) => violation.rule === "judo-tonight"), true);
});

test("prudent profile reduces an otherwise valid bench increment", () => {
  const result = calculateProgression(
    {
      plannedExercise: bench,
      performance: {
        usedLoad: "90 kg",
        completedReps: "5/5/5/5/5",
        comment: ""
      },
      feedback: "ok",
      sessionDifficulty: 6,
      globalPain: 0,
      energy: 7,
      breath: "correct",
      session: monday
    },
    { cautionLevel: "prudent", benchOneRepMaxKg: 130 }
  );

  assert.equal(result.decision, "augmenter");
  assert.equal(result.nextLoad, "91,5 kg");
  assert.match(result.reason, /Profil prudent/);
});

test("high RIR adds reps before load on easy completed work", () => {
  const result = calculateProgression({
    plannedExercise: bench,
    performance: {
      usedLoad: "90 kg",
      completedReps: "5/5/5/5/5",
      comment: "",
      rir: 4
    },
    feedback: "easy",
    sessionDifficulty: 4,
    globalPain: 0,
    energy: 8,
    breath: "bon",
    session: monday
  });

  assert.equal(result.decision, "maintenir");
  assert.equal(result.nextLoad, "90 kg");
  assert.equal(result.nextTarget, "5 x 6");
  assert.match(result.warning ?? "", /RIR/);
});

test("performance goal keeps load progression on an easy compound despite high RIR", () => {
  const result = calculateProgression(
    {
      plannedExercise: bench,
      performance: {
        usedLoad: "90 kg",
        completedReps: "5/5/5/5/5",
        comment: "",
        rir: 4
      },
      feedback: "easy",
      sessionDifficulty: 4,
      globalPain: 0,
      energy: 8,
      breath: "bon",
      session: monday
    },
    { primaryGoal: "performance" }
  );

  assert.equal(result.decision, "augmenter");
  assert.equal(result.nextLoad, "92,5 kg");
  assert.match(result.reason, /performance/i);
});

test("mass goal prefers reps before load on machine work with room in the range", () => {
  const result = calculateProgression(
    {
      plannedExercise: chestPressMachine,
      performance: {
        usedLoad: "80 kg",
        completedReps: "8/8/8/8",
        comment: ""
      },
      feedback: "ok",
      sessionDifficulty: 6,
      globalPain: 0,
      energy: 7,
      breath: "correct",
      session: hypertrophySession
    },
    { primaryGoal: "prise-masse" }
  );

  assert.equal(result.decision, "maintenir");
  assert.equal(result.nextLoad, "80 kg");
  assert.equal(result.nextTarget, "4 x 9-10");
  assert.match(result.warning ?? "", /repetitions/i);
});

test("fat loss goal stays rep-first on easy machine work", () => {
  const result = calculateProgression(
    {
      plannedExercise: chestPressMachine,
      performance: {
        usedLoad: "80 kg",
        completedReps: "8/8/8/8",
        comment: "facile"
      },
      feedback: "easy",
      sessionDifficulty: 4,
      globalPain: 0,
      energy: 7,
      breath: "bon",
      session: hypertrophySession
    },
    { primaryGoal: "perte-gras" }
  );

  assert.equal(result.decision, "maintenir");
  assert.equal(result.nextLoad, "80 kg");
  assert.equal(result.nextTarget, "4 x 10");
  assert.match(result.reason, /perte de gras/i);
});

test("bench one rep max caps unsafe top-end progression", () => {
  const result = calculateProgression(
    {
      plannedExercise: bench,
      performance: {
        usedLoad: "85 kg",
        completedReps: "5/5/5/5/5",
        comment: ""
      },
      feedback: "ok",
      sessionDifficulty: 6,
      globalPain: 0,
      energy: 7,
      breath: "correct",
      session: monday
    },
    { benchOneRepMaxKg: 100, cautionLevel: "normal" }
  );

  assert.equal(result.decision, "maintenir");
  assert.equal(result.nextLoad, "85 kg");
  assert.match(result.warning ?? "", /1RM|Recalibrer/);
});

test("repeated hard history blocks a fresh load increase", () => {
  const result = calculateProgression(
    {
      plannedExercise: bench,
      performance: {
        usedLoad: "90 kg",
        completedReps: "5/5/5/5/5",
        comment: ""
      },
      feedback: "ok",
      sessionDifficulty: 6,
      globalPain: 0,
      energy: 7,
      breath: "correct",
      session: monday
    },
    {
      recentHistory: [
        { dateKey: "2026-04-27", load: "90 kg", rpe: 9, completedReps: "5/4/3/0/0", status: "hard", decision: "baisser", energy: 3 },
        { dateKey: "2026-04-20", load: "90 kg", rpe: 9, completedReps: "5/5/4/3/0", status: "hard", decision: "maintenir", energy: 4 }
      ]
    }
  );

  assert.equal(result.decision, "maintenir");
  assert.equal(result.nextLoad, "90 kg");
  assert.match(result.warning ?? "", /recuperation|bloque la progression/i);
});

test("three maintain decisions trigger a stimulus variation on isolation work", () => {
  const result = calculateProgression(
    {
      plannedExercise: cableCurl,
      performance: {
        usedLoad: "20 kg",
        completedReps: "12/12/12",
        comment: ""
      },
      feedback: "easy",
      sessionDifficulty: 5,
      globalPain: 0,
      energy: 7,
      breath: "bon",
      session: friday
    },
    {
      recentHistory: [
        { dateKey: "2026-04-26", load: "20 kg", rpe: 6, completedReps: "12/12/12", status: "ok", decision: "maintenir" },
        { dateKey: "2026-04-19", load: "20 kg", rpe: 6, completedReps: "12/12/12", status: "ok", decision: "maintenir" },
        { dateKey: "2026-04-12", load: "20 kg", rpe: 6, completedReps: "12/12/12", status: "ok", decision: "maintenir" }
      ]
    }
  );

  assert.equal(result.decision, "remplacer");
  assert.match(result.replacementSuggestion ?? "", /poulie|machine|reps/i);
  assert.match(result.warning ?? "", /Stagnation/);
});

test("hard session with many missed reps and fatigue reduces volume", () => {
  const result = calculateProgression({
    plannedExercise: bench,
    performance: {
      usedLoad: "90 kg",
      completedReps: "5/3/0/0/0",
      comment: "Trop lourd aujourd'hui."
    },
    feedback: "hard",
    sessionDifficulty: 9,
    globalPain: 1,
    energy: 3,
    breath: "difficile",
    session: monday
  });

  assert.equal(result.decision, "baisser");
  assert.equal(result.nextLoad, "90 kg");
  assert.equal(result.nextTarget, "4 x 5");
  assert.match(result.warning ?? "", /recuperation|Fatigue|sommeil/i);
});

test("repeated hard history plus a new hard session triggers a local deload", () => {
  const result = calculateProgression(
    {
      plannedExercise: bench,
      performance: {
        usedLoad: "90 kg",
        completedReps: "5/5/5/5/5",
        comment: "trop lourd aujourd'hui"
      },
      feedback: "hard",
      sessionDifficulty: 8,
      globalPain: 0,
      energy: 4,
      breath: "difficile",
      session: monday
    },
    {
      recentHistory: [
        { dateKey: "2026-04-27", load: "90 kg", rpe: 9, completedReps: "5/5/4/3/0", status: "hard", decision: "maintenir", energy: 3 },
        { dateKey: "2026-04-20", load: "90 kg", rpe: 9, completedReps: "5/4/3/0/0", status: "hard", decision: "baisser", energy: 3 }
      ]
    }
  );

  assert.equal(result.decision, "baisser");
  assert.equal(result.nextLoad, "85,5 kg");
  assert.equal(result.nextTarget, "4 x 5");
  assert.match(result.warning ?? "", /Deload local/i);
});

test("summarizeProgressions groups progression, stable and watch decisions", () => {
  const summary = summarizeProgressions({
    bench: {
      exerciseId: "bench",
      exerciseName: "Developpe couche",
      decision: "augmenter",
      nextLoad: "92,5 kg",
      nextTarget: "5 x 5",
      reason: "OK"
    },
    curl: {
      exerciseId: "curl",
      exerciseName: "Curl",
      decision: "maintenir",
      nextLoad: "20 kg",
      nextTarget: "3 x 12",
      reason: "Judo ce soir"
    },
    rdl: {
      exerciseId: "rdl",
      exerciseName: "Souleve roumain",
      decision: "remplacer",
      nextLoad: "90 kg",
      nextTarget: "4 x 8",
      reason: "Douleur",
      warning: "Alerte douleur"
    }
  });

  assert.equal(summary.progressing.length, 1);
  assert.equal(summary.unchanged.length, 1);
  assert.equal(summary.watch.length, 1);
  assert.equal(summary.nextSessionAdjustments.length, 3);
});
