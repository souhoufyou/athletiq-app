import test from "node:test";
import assert from "node:assert/strict";
import { weeklyProgram } from "@/data/program";
import { getLiveCoachAdvice } from "@/lib/liveCoaching";
import { defaultSessionFeedback } from "@/lib/session";

const monday = weeklyProgram.find((session) => session.id === "monday-upper-force-judo")!;
const tuesday = weeklyProgram.find((session) => session.id === "tuesday-lower-cardio")!;

const bench = monday.exercises.find((exercise) => exercise.id === "bench-press-5x5")!;
const romanianDeadlift = tuesday.exercises.find((exercise) => exercise.id === "rdl-or-hip-thrust")!;

test("live coach stays silent until the exercise has feedback", () => {
  const advice = getLiveCoachAdvice({
    exercise: bench,
    feedback: defaultSessionFeedback,
    log: {
      exerciseId: bench.id,
      usedLoad: "",
      completedReps: "",
      comment: ""
    },
    session: monday
  });

  assert.equal(advice, undefined);
});

test("live coach turns pain into a safety stop with replacement guidance", () => {
  const advice = getLiveCoachAdvice({
    exercise: romanianDeadlift,
    feedback: { ...defaultSessionFeedback, difficulty: 8, globalPain: 3 },
    log: {
      exerciseId: romanianDeadlift.id,
      status: "pain",
      usedLoad: "100 kg",
      completedReps: "8/6/0/0",
      comment: "Douleur dos en bas du mouvement."
    },
    session: tuesday
  });

  assert.equal(advice?.tone, "danger");
  assert.equal(advice?.decision, "remplacer");
  assert.match(advice?.title ?? "", /securite/i);
  assert.match(advice?.replacementSuggestion ?? "", /Hip thrust|leg curl/i);
  assert.match(advice?.primaryAction ?? "", /alternative/i);
});

test("live coach lowers volume when hard feedback misses many reps with fatigue", () => {
  const advice = getLiveCoachAdvice({
    exercise: bench,
    feedback: { ...defaultSessionFeedback, difficulty: 9, energy: 3 },
    log: {
      exerciseId: bench.id,
      status: "hard",
      usedLoad: "90 kg",
      completedReps: "5/3/0/0/0",
      comment: "Trop lourd aujourd'hui."
    },
    session: monday
  });

  assert.equal(advice?.tone, "warn");
  assert.equal(advice?.decision, "baisser");
  assert.equal(advice?.nextTarget, "4 x 5");
  assert.match(advice?.message ?? "", /trop haute|Reduis/i);
});

test("live coach announces a controlled progression after easy validated bench sets", () => {
  const advice = getLiveCoachAdvice({
    exercise: bench,
    feedback: { ...defaultSessionFeedback, difficulty: 5, energy: 8 },
    log: {
      exerciseId: bench.id,
      status: "easy",
      usedLoad: "90 kg",
      completedReps: "5/5/5/5/5",
      comment: "Facile et propre."
    },
    session: monday
  });

  assert.equal(advice?.tone, "info");
  assert.equal(advice?.decision, "augmenter");
  assert.equal(advice?.nextLoad, "92,5 kg");
  assert.match(advice?.primaryAction ?? "", /progression/i);
});
