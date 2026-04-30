import test from "node:test";
import assert from "node:assert/strict";
import { weeklyProgram } from "@/data/program";
import { getAlternatives, getContextualAlternatives } from "@/lib/alternatives";

const monday = weeklyProgram.find((session) => session.id === "monday-upper-force-judo")!;
const friday = weeklyProgram.find((session) => session.id === "friday-shoulders-arms-judo")!;

const shoulderPress = friday.exercises.find((exercise) => exercise.id === "machine-shoulder-press")!;
const latPulldown = monday.exercises.find((exercise) => exercise.id === "neutral-lat-pulldown")!;
const bench = monday.exercises.find((exercise) => exercise.id === "bench-press-5x5")!;

test("contextual alternatives keep default order when there is no context", () => {
  const plain = getAlternatives(bench.id, bench);
  const contextual = getContextualAlternatives(bench.id, bench);

  assert.deepEqual(
    contextual.map((exercise) => exercise.name),
    plain.map((exercise) => exercise.name)
  );
});

test("shoulder pain prefers cable or guided alternatives over dumbbell press", () => {
  const alternatives = getContextualAlternatives(shoulderPress.id, shoulderPress, {
    comment: "Douleur epaule sur la poussee verticale.",
    status: "pain"
  });

  assert.match(alternatives[0].name, /poulie|machine/i);
});

test("wrist feedback moves pulley and neutral-grip options upward", () => {
  const alternatives = getContextualAlternatives(latPulldown.id, latPulldown, {
    comment: "Poignet sensible, grip pas bon.",
    status: "hard"
  });

  assert.match(`${alternatives[0].name} ${alternatives[0].cue}`, /poulie|prise neutre/i);
});

test("avoid list penalizes alternatives that match user dislikes", () => {
  const alternatives = getContextualAlternatives(bench.id, bench, {
    avoid: ["halteres"]
  });

  assert.equal(normalize(alternatives[0].name).includes("haltere"), false);
});

test("manual exercises use taxonomy to find library alternatives", () => {
  const manual = {
    id: "manual-chest",
    name: "Presse poitrine perso",
    target: "4 x 8-10",
    plannedLoad: "60 kg",
    rest: "90 s",
    cue: "Machine stable.",
    muscleGroups: ["pectoraux", "triceps"],
    classification: "hypertrophie",
    taxonomy: {
      pattern: "chest-compound",
      equipment: ["salle-complete"],
      isCompound: true
    }
  } satisfies typeof bench;

  const alternatives = getContextualAlternatives(manual.id, manual, {
    equipment: "salle-complete",
    status: "hard"
  });

  assert.equal(alternatives.length > 0, true);
  assert.equal(alternatives.every((exercise) => exercise.taxonomy?.pattern === "chest-compound"), true);
});

test("equipment context filters library alternatives when possible", () => {
  const manual = {
    id: "manual-row",
    name: "Rowing perso",
    target: "4 x 10",
    plannedLoad: "30 kg",
    rest: "90 s",
    cue: "Dos stable.",
    muscleGroups: ["dos", "biceps"],
    classification: "hypertrophie",
    taxonomy: {
      pattern: "back-horizontal",
      equipment: ["halteres-maison"],
      isCompound: true
    }
  } satisfies typeof latPulldown;

  const alternatives = getContextualAlternatives(manual.id, manual, {
    equipment: "halteres-maison"
  });

  assert.equal(alternatives.length > 0, true);
  assert.equal(alternatives.every((exercise) => exercise.taxonomy?.equipment?.includes("halteres-maison")), true);
});

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
