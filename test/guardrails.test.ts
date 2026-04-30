import test from "node:test";
import assert from "node:assert/strict";
import { applyGuardrails } from "@/lib/guardrails";
import type { GuardrailInput } from "@/lib/guardrails";

const baseInput: GuardrailInput = {
  exerciseId: "bench",
  exerciseName: "Developpe couche",
  exerciseKind: "bench",
  muscleGroups: ["pectoraux", "triceps"],
  proposedDecision: "augmenter",
  proposedLoad: "92,5 kg",
  currentLoad: "90 kg",
  recentHistory: [],
  weeklySetsByMuscle: {
    pectoraux: 0,
    dos: 0,
    epaules: 0,
    biceps: 0,
    triceps: 0,
    jambes: 0,
    abdos: 0,
    cardio: 0,
    autre: 0
  },
  sessionRPE: 7,
  judoTonight: false,
  judoTomorrow: false,
  weeksSinceLastChange: Number.POSITIVE_INFINITY,
  hasNewPain: false,
  painKeywords: []
};

test("pain blocks load progression", () => {
  const result = applyGuardrails({
    ...baseInput,
    hasNewPain: true,
    painKeywords: ["douleur poignet"]
  });

  assert.equal(result.allowed, false);
  assert.equal(result.adjustedDecision, "maintenir");
  assert.equal(result.adjustedLoad, "90 kg");
  assert.equal(result.violations.some((violation) => violation.rule === "pain-block"), true);
});

test("minimum stability rule blocks too-early increases", () => {
  const result = applyGuardrails({
    ...baseInput,
    weeksSinceLastChange: 1
  });

  assert.equal(result.allowed, false);
  assert.equal(result.adjustedDecision, "maintenir");
  assert.equal(result.adjustedLoad, "90 kg");
  assert.equal(result.violations.some((violation) => violation.rule === "stability-min"), true);
});

test("load increase cap limits aggressive jumps", () => {
  const result = applyGuardrails({
    ...baseInput,
    exerciseName: "Curl cable",
    exerciseKind: "isolation",
    currentLoad: "20 kg",
    proposedLoad: "30 kg"
  });

  assert.equal(result.allowed, true);
  assert.equal(result.adjustedDecision, "augmenter");
  assert.equal(result.adjustedLoad, "21 kg");
  assert.equal(result.violations.some((violation) => violation.rule === "load-increase-cap"), true);
});

test("high recent RPE lowers confidence without overriding decision by itself", () => {
  const result = applyGuardrails({
    ...baseInput,
    recentHistory: [
      { dateKey: "2026-04-21", load: "90 kg", rpe: 9, completedReps: "5/5/5/5/5" },
      { dateKey: "2026-04-14", load: "87,5 kg", rpe: 9, completedReps: "5/5/5/5/5" }
    ]
  });

  assert.equal(result.allowed, true);
  assert.equal(result.adjustedDecision, "augmenter");
  assert.equal(result.confidence, "faible");
  assert.equal(result.violations.some((violation) => violation.rule === "high-rpe"), true);
});
